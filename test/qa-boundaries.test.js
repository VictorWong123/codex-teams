import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {EventEmitter} from 'node:events';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const scratch=mkdtempSync(join(tmpdir(),'cteam-qa-boundaries-'));
process.env.CODEX_TEAMS_DATA=join(scratch,'data');
const {initializeProject}=await import('../src/project.js');
const {ProjectStore,Registry}=await import('../src/db.js');
const {loadConfig,saveConfig}=await import('../src/config.js');
const {createService}=await import('../src/service.js');
const {id,idSegment}=await import('../src/util.js');
after(()=>rmSync(scratch,{recursive:true,force:true}));
class NoModelApp extends EventEmitter {
 constructor(){super();this.calls=[];}
 async start(){} async stop(){}
 async request(method,params){this.calls.push({method,params});if(method==='thread/turns/list')return {data:[],nextCursor:null};throw new Error(`Unexpected app-server request: ${method}`);}
}
function project(root){mkdirSync(root,{recursive:true});initializeProject(root);const config=loadConfig(root);config.paused=true;saveConfig(root,config);return {root,store:()=>new ProjectStore(root,loadConfig(root))};}
async function fixture(){
 const dir=mkdtempSync(join(scratch,'case-')),caller=join(dir,'caller'),daemon=join(dir,'daemon');
 const a=project(join(caller,'sub')),b=project(join(daemon,'sub')),registry=new Registry(),app=new NoModelApp(),port=56500+Math.floor(Math.random()*2000);
 const service=await createService({port,registry,appServer:app});clearInterval(service.orchestrator.timer);
 const headers={authorization:`Bearer ${registry.authToken()}`,'x-codex-teams-request':'1','content-type':'application/json'};
 async function req(route,body,method=body?'POST':'GET'){const response=await fetch(`http://127.0.0.1:${port}/api/${route}`,{method,headers,body:body?JSON.stringify({project:a.root,...body}):undefined});return {status:response.status,data:await response.json()};}
 return {a,b,app,service,caller,daemon,port,req,close:()=>service.close()};
}
function assertToolError(result){assert.equal(result.isError,true,JSON.stringify(result));}
function toolValue(result){assert.notEqual(result.isError,true,JSON.stringify(result));return JSON.parse(result.content[0].text);}

test('actual MCP SDK binds caller context, task scope and UUIDs and supports partial roster edits',async()=>{
 const f=await fixture(),a=f.a.store(),b=f.b.store(),goal=a.createGoal('Caller goal'),other=b.createGoal('Daemon goal'),stopped=a.createGoal('Stopped goal');a.db.prepare("UPDATE goals SET status='stopped' WHERE id=?").run(stopped.id);
 const client=new Client({name:'qa-boundary-regression',version:'1.0.0'}),transport=new StdioClientTransport({command:process.execPath,args:[resolve('src/mcp.js')],cwd:f.daemon,env:{...process.env,CODEX_TEAMS_PORT:String(f.port)},stderr:'pipe'});
 try{
  await client.connect(transport);assert.equal((await client.listTools()).tools.length,17);
  const call=(name,args)=>client.callTool({name,arguments:{cwd:f.caller,project:'sub',...args}});
  const status=toolValue(await call('team_status',{}));assert.equal(status.project.root,f.a.root);
  assertToolError(await client.callTool({name:'team_status',arguments:{project:'sub'}}));
  const agent=a.findAgent('developer');const edited=toolValue(await call('team_roster',{agent:{id:agent.id,purpose:'Changed by stable ID'}}));assert.equal(edited.id,agent.id);assert.equal(edited.name,'developer');assert.equal(edited.purpose,'Changed by stable ID');
  assertToolError(await call('team_notes',{goalId:goal.id,title:'Must not become a list',body:''}));assert.equal(a.row('SELECT count(*) n FROM notes').n,0);
  assertToolError(await call('team_tasks',{action:'create',goalId:goal.id,task:{title:'Cross-context injection',project:f.b.root,goalId:other.id}}));assert.equal(a.row('SELECT count(*) n FROM tasks').n,0);assert.equal(b.row('SELECT count(*) n FROM tasks').n,0);
  const task=toolValue(await call('team_tasks',{action:'create',goalId:goal.id,task:{title:'Bound to caller',owner:'developer'}}));assert.equal(task.goalId,goal.id);assert.ok(a.task(task.id));assert.equal(b.task(task.id),null);
  const message={goalId:goal.id,recipient:'developer',body:'Idempotent public shape',idempotencyKey:'public-message-shape'},firstMessage=toolValue(await call('team_message',message)),replayedMessage=toolValue(await call('team_message',message));assert.deepEqual(replayedMessage,firstMessage);assert.equal(a.row('SELECT count(*) n FROM messages WHERE id=?',firstMessage.id).n,1);assert.equal(firstMessage.goalId,goal.id);assert.equal(Object.hasOwn(firstMessage,'goal_id'),false);
  const before=a.row('SELECT count(*) n FROM messages').n;
  assertToolError(await call('team_tasks',{action:'claim',taskId:`../goals/${stopped.id}/reopen`,agent:'developer'}));
  assert.equal(a.requireGoal(stopped.id).status,'stopped');assert.equal(a.row('SELECT count(*) n FROM messages').n,before);
  const suffix=await f.req(`goals/${stopped.id}/reopen/claim`,{agent:'developer'});assert.equal(suffix.status,404);assert.equal(a.requireGoal(stopped.id).status,'stopped');assert.equal(a.row('SELECT count(*) n FROM messages').n,before);
  await assert.rejects(promisify(execFile)(process.execPath,[resolve('src/cli.js'),'tasks','claim',`../goals/${stopped.id}/reopen`,'--agent','developer','--project',f.a.root],{env:{...process.env,CODEX_TEAMS_PORT:String(f.port)},timeout:5000}),/UUID/);
  assert.equal(a.requireGoal(stopped.id).status,'stopped');assert.equal(f.app.calls.length,0);
 }finally{await client.close();a.close();b.close();await f.close();}
});

test('recovery acknowledgement requires real uncertainty and cannot override concurrent human stop',async()=>{
 const f=await fixture(),s=f.a.store();
 try{
  for(const state of ['queued','stopped','completed','recovery_review']){
   const goal=s.createGoal(state);s.db.prepare('UPDATE goals SET status=? WHERE id=?').run(state,goal.id);
   const before=s.requireGoal(goal.id);const result=await f.req('recovery',{goalId:goal.id,action:'acknowledge',acknowledgeSideEffects:true});assert.equal(result.status,400);assert.deepEqual(s.requireGoal(goal.id),before);
  }
  const goal=s.createGoal('Genuine recovery'),agent=s.findAgent('developer'),turn=id();s.db.prepare("UPDATE goals SET status='recovery_review' WHERE id=?").run(goal.id);
  s.db.prepare("UPDATE participants SET thread_id='original-thread' WHERE goal_id=? AND agent_id=?").run(goal.id,agent.id);
  s.db.prepare("INSERT INTO turns(id,goal_id,agent_id,thread_id,status,prompt,started_at,uncertain) VALUES(?,?,?,'original-thread','recovery_review','prior work',?,1)").run(turn,goal.id,agent.id,new Date().toISOString());
  let release,entered;const waiting=new Promise(r=>entered=r);f.app.request=async(method)=>{assert.equal(method,'thread/turns/list');entered();await new Promise(r=>release=r);return {data:[],nextCursor:null};};
  const pending=f.req('recovery',{goalId:goal.id,action:'acknowledge',acknowledgeSideEffects:true});await waiting;
  assert.equal((await f.req('control',{goalId:goal.id,action:'stop'})).status,200);release();const result=await pending;assert.equal(result.status,400);assert.match(result.data.error,/control changed/);assert.equal(s.requireGoal(goal.id).status,'stopped');assert.equal(s.row('SELECT uncertain FROM turns WHERE id=?',turn).uncertain,1);
 }finally{s.close();await f.close();}
});

test('reopen validates before mutation, rolls back message conflicts and retries idempotently',async()=>{
 const f=await fixture(),s=f.a.store(),goal=s.createGoal('Original');s.db.prepare("UPDATE goals SET status='stopped' WHERE id=?").run(goal.id);
 try{
  const original=s.requireGoal(goal.id);for(const input of [{prompt:42},{prompt:' '},{prompt:'valid',idempotencyKey:''}]){assert.equal((await f.req(`goals/${goal.id}/reopen`,input)).status,400);assert.deepEqual(s.requireGoal(goal.id),original);}
  s.db.prepare("UPDATE goals SET status='running' WHERE id=?").run(goal.id);s.sendMessage({goalId:goal.id,recipient:original.lead_agent_id,body:'Conflicting existing message',idempotencyKey:'reopen:conflict'});s.db.prepare("UPDATE goals SET status='stopped' WHERE id=?").run(goal.id);
  assert.equal((await f.req(`goals/${goal.id}/reopen`,{prompt:'New prompt',idempotencyKey:'conflict'})).status,400);assert.equal(s.requireGoal(goal.id).status,'stopped');
  const request={prompt:'Inspect original work',idempotencyKey:'stable-reopen'},first=await f.req(`goals/${goal.id}/reopen`,request),second=await f.req(`goals/${goal.id}/reopen`,request);assert.equal(first.status,200);assert.deepEqual(second,first);assert.equal(s.row('SELECT count(*) n FROM messages WHERE body=?',request.prompt).n,1);
  assert.equal((await f.req(`goals/${goal.id}/reopen`,{...request,prompt:'Conflicting retry'})).status,400);assert.equal(s.requireGoal(goal.id).status,'running');
 }finally{s.close();await f.close();}
});

test('explicit Add refuses duplicates while ID-first removal preserves an agent named after another ID',async()=>{
 const f=await fixture(),s=f.a.store(),worker=s.findAgent('developer'),before=loadConfig(f.a.root),lookalike={id:id(),name:worker.id,purpose:'Distinct agent',instructions:'Keep me'};
 try{
  const add=await f.req('agents',{createOnly:true,agent:{name:'developer',purpose:'Overwrite'}});assert.equal(add.status,400);assert.deepEqual(loadConfig(f.a.root),before);
  await assert.rejects(promisify(execFile)(process.execPath,[resolve('src/cli.js'),'roster','add','developer','--json','{"purpose":"overwrite"}','--project',f.a.root],{env:{...process.env,CODEX_TEAMS_PORT:String(f.port)},timeout:5000}),/already exists/);assert.deepEqual(loadConfig(f.a.root),before);
  assert.equal((await f.req('agents',{createOnly:true,agent:lookalike})).status,200);
  const removed=await f.req(`agents/${worker.id}?project=${encodeURIComponent(f.a.root)}`,undefined,'DELETE');assert.equal(removed.status,200);const agents=loadConfig(f.a.root).agents;assert.equal(agents.some(a=>a.id===worker.id),false);assert.ok(agents.some(a=>a.id===lookalike.id));
 }finally{s.close();await f.close();}
});

test('hand-authored roster entries receive persistent IDs before subsequent loads and snapshots',()=>{
 const root=join(mkdtempSync(join(scratch,'manual-')),'project');project(root);const file=join(root,'.codex-teams','team.json'),raw=JSON.parse(readFileSync(file,'utf8'));raw.agents.push({name:'Arbitrary reviewer',purpose:'Review',instructions:'Read only',permission:'read-only'});writeFileSync(file,JSON.stringify(raw));
 const first=loadConfig(root),second=loadConfig(root),persisted=JSON.parse(readFileSync(file,'utf8'));assert.equal(first.agents.at(-1).id,second.agents.at(-1).id);assert.equal(first.agents.at(-1).id,persisted.agents.at(-1).id);assert.ok(first.agents.at(-1).id);
 const s=new ProjectStore(root,first);try{const goal=s.createGoal('Snapshot',{lead:'Arbitrary reviewer',participants:[]});assert.equal(s.goalAgent(goal.id,'Arbitrary reviewer').id,first.agents.at(-1).id);assert.equal(s.findAgent(first.agents.at(-1).id).id,first.agents.at(-1).id);}finally{s.close();}
 for(const value of ['../goals/anything/reopen','.',undefined,'not-a-uuid'])assert.throws(()=>idSegment(value),/UUID/);
});

test('goal operations retain immutable participant identities after roster rename, removal and ID-like names',async()=>{
 const f=await fixture(),s=f.a.store(),worker=s.findAgent('developer'),lead=s.findAgent('coordinator'),config=loadConfig(f.a.root),lookalike={id:id(),name:worker.id,purpose:'A different agent',permission:'read-only'};
 config.agents.push(lookalike);saveConfig(f.a.root,config);const current=f.a.store(),goal=current.createGoal('Immutable identities');
 try{
  assert.equal(current.goalAgent(goal.id,worker.id).id,worker.id);assert.equal(current.findAgent(worker.id).id,worker.id);
  const task=current.createTask(goal.id,{title:'Verify snapshot behavior',owner:worker.id});
  const future=loadConfig(f.a.root);future.agents=future.agents.filter(a=>a.id!==lead.id);future.agents.find(a=>a.id===worker.id).name='renamed developer';future.agents.find(a=>a.id===worker.id).enabled=false;saveConfig(f.a.root,future);
  const claim=await f.req(`tasks/${task.id}/claim`,{agent:'developer',claimKey:'old-name'});assert.equal(claim.status,200);assert.equal(claim.data.owner_agent_id,worker.id);
  const captured=id();current.db.prepare("INSERT INTO turns(id,goal_id,agent_id,thread_id,codex_turn_id,status,prompt,started_at) VALUES(?,?,?,'original-lead-thread','original-lead-turn','running','work',?)").run(captured,goal.id,lead.id,new Date().toISOString());
  current.db.prepare("UPDATE participants SET thread_id='original-lead-thread',active_turn_id=? WHERE goal_id=? AND agent_id=?").run(captured,goal.id,lead.id);
  f.app.request=async(method,params)=>{f.app.calls.push({method,params});assert.equal(method,'turn/interrupt');return {};};
  assert.equal((await f.req('interrupt',{goalId:goal.id,agent:'coordinator'})).status,200);assert.deepEqual(f.app.calls.at(-1).params,{threadId:'original-lead-thread',turnId:'original-lead-turn'});
  current.db.prepare("UPDATE turns SET status='completed' WHERE id=?").run(captured);current.db.prepare('UPDATE participants SET active_turn_id=NULL WHERE goal_id=?').run(goal.id);
  current.addEvidence({goalId:goal.id,taskId:task.id,turnId:captured,kind:'command',command:'node --test test.js',output:'# pass 2\n# fail 0',exitCode:0});
  assert.equal((await f.req(`tasks/${task.id}/verify`,{agent:'coordinator'})).status,200);
  assert.equal((await f.req(`goals/${goal.id}/complete`,{agent:'coordinator'})).status,200);assert.equal(current.requireGoal(goal.id).status,'completed');
  assert.equal(current.goalAgent(goal.id,'developer').id,worker.id);assert.equal(current.goalAgent(goal.id,'coordinator').id,lead.id);
 }finally{current.close();s.close();await f.close();}
});
