#!/usr/bin/env node
import {doctor,classifyError} from './diagnostics.js';
import {page,goalSummary,handoff,queueReason} from './queries.js';
import {resolveGoal,revision,sourceBaseline,starterSpecifications} from './workflows.js';
import {extendBudget,updateNote} from './store-actions.js';
import {storageUsage,createBackup} from './backup.js';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { timingSafeEqual } from 'node:crypto';
import { SERVICE_PORT, DATA_DIR } from './constants.js';
import { loadConfig, saveConfig, agentSchema } from './config.js';
import { ProjectStore, Registry } from './db.js';
import { Orchestrator } from './orchestrator.js';
import { json, now, id, parse, idSegment } from './util.js';
const failure=(status,message)=>Object.assign(new Error(message),{status});
const safeEqual=(a,b)=>typeof a==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export async function createService({port=SERVICE_PORT,registry=new Registry(),appServer}={}){
 const openProject=ref=>{const p=typeof ref==='string'?registry.find(ref):ref;if(!p)throw failure(404,'Project not registered');return new ProjectStore(p.root,p.inactive?JSON.parse(readFileSync(join(DATA_DIR,'restored-configs',p.id+'.json'),'utf8')):loadConfig(p.root));};
 const orchestrator=new Orchestrator({registry,openProject,...(appServer?{appServer}:{})});await orchestrator.start();
 const server=http.createServer(async(req,res)=>{try{
  res.setHeader('cache-control','no-store');res.setHeader('x-content-type-options','nosniff');res.setHeader('referrer-policy','no-referrer');
  const host=req.headers.host;if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host))throw failure(403,'Invalid Host');
  const origin=req.headers.origin;if(origin&&![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(origin))throw failure(403,'Invalid Origin');
  if(req.headers['sec-fetch-site']==='cross-site')throw failure(403,'Cross-site request rejected');
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(req.method==='GET'&&url.pathname==='/health')return send(res,200,{ok:true,version:'0.1.5-rc.1',codexConnected:orchestrator.ready});
  if(!url.pathname.startsWith('/api/')){if(req.method!=='GET')throw failure(405,'GET required');return staticFile(url.pathname,res);}
  if(req.headers['x-codex-teams-request']!=='1')throw failure(403,'CSRF header required');
  const bearer=(req.headers.authorization||'').replace(/^Bearer /,'');let scoped=null;
  if(!safeEqual(bearer,registry.authToken())){
   scoped={project:req.headers['x-codex-teams-project'],goal:req.headers['x-codex-teams-goal'],agent:req.headers['x-codex-teams-agent'],token:bearer};
   if(!orchestrator.verifyScope(scoped))throw failure(401,'Unauthorized');
  }else if(req.headers['x-codex-teams-agent'])throw failure(403,'Master credentials cannot impersonate members');
  if(url.pathname==='/api/shutdown'&&req.method==='POST'){if(scoped)throw failure(403,'Human only');send(res,200,{stopped:true});setImmediate(()=>server.emit('shutdown'));return;}
  const body=await readBody(req),route=url.pathname.slice(5).split('/').filter(Boolean),method=req.method;
  if(route[0]==='projects'&&route.length===1&&method==='GET'){if(scoped)throw failure(403,'Human only');return send(res,200,registry.list());}
  if(route[0]==='doctor'&&method==='GET'){if(scoped)throw failure(403,'Human only');return send(res,200,{...await doctor(registry.find(url.searchParams.get('project'))?.root||url.searchParams.get('project')||undefined),diagnostics:[...orchestrator.diagnostics].map(([project,error])=>({project,...error}))});}
  if(route[0]==='service-config'&&route.length===1){if(scoped)throw failure(403,'Human only');return send(res,200,method==='POST'?registry.setConcurrency(body.concurrency):{concurrency:registry.concurrency()});}
  if(route[0]==='storage'&&route.length===1&&method==='GET'){if(scoped)throw failure(403,'Human only');return send(res,200,storageUsage());}
  if(route[0]==='backup'&&route.length===1&&method==='POST'){if(scoped)throw failure(403,'Human only');if(typeof body.destination!=='string')throw failure(400,'Destination required');return send(res,200,createBackup(registry,openProject,body.destination));}
  if(route[0]==='projects'&&route[2]==='activate'&&route.length===3&&method==='POST'){if(scoped)throw failure(403,'Human only');const p=registry.find(route[1]);if(!p?.inactive)throw failure(400,'Project is not awaiting restore review');if(body.acknowledge!==true)throw failure(400,'Explicit restore review acknowledgment required');const config=loadConfig(p.root),saved=JSON.parse(readFileSync(join(DATA_DIR,'restored-configs',p.id+'.json'),'utf8'));if(revision(config)!==revision(saved))throw failure(409,'Root configuration differs from restored configuration; reconcile it before activating');const restored=openProject(p);try{for(const turn of restored.rows("SELECT * FROM turns WHERE status IN ('starting','dispatching','running')"))orchestrator.review(restored,turn,'Restored uncertain turn requires review');restored.db.prepare("UPDATE approvals SET status='expired',resolved_at=? WHERE status='pending'").run(now());}finally{restored.close();}registry.mutate(data=>{data.projects.find(x=>x.id===p.id).inactive=false;});return send(res,200,{activated:p.id,nextAction:'Inspect recovery and explicitly resume each goal.'});}
  const project=body.project||url.searchParams.get('project')||scoped?.project;if(!project)throw failure(400,'project required');if(scoped&&project!==scoped.project)throw failure(403,'Cross-project access denied');
  if(method!=='GET'&&registry.find(project)?.inactive)throw failure(409,'Restored project is inactive; review root and configuration before activation');
  const s=openProject(project);let result;try{
   if(scoped){s.assertMutableGoal(scoped.goal);if(!s.row('SELECT 1 FROM participants WHERE goal_id=? AND agent_id=?',scoped.goal,scoped.agent))throw failure(403,'Inactive member scope');
    if(!memberRoute(route,method))throw failure(403,'Member cannot access human controls');
    if(body.sender||body.agent)throw failure(403,'Member identity is bound to credentials');
    if(body.goalId&&body.goalId!==scoped.goal)throw failure(403,'Cross-goal access denied');
    if(route[0]==='goals'&&route[1]!==scoped.goal)throw failure(403,'Cross-goal access denied');
    if(route[0]==='tasks'&&route[1]&&s.task(route[1])?.goal_id!==scoped.goal)throw failure(403,'Cross-goal task denied');
   }
   result=await dispatch({s,scoped,route,method,body,url,orchestrator});
  }finally{s.close();}send(res,200,result);
 }catch(e){send(res,e.status||(e.name==='ZodError'||e instanceof SyntaxError?400:400),{error:classifyError(e).message,...classifyError(e)});}});
 server.requestTimeout=15000;server.headersTimeout=10000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,orchestrator,close:async()=>{await orchestrator.stop();await new Promise(r=>server.close(r));}};
}
function memberRoute(r,m){return m==='GET'&&r[0]==='status'||m==='POST'&&(['tasks','messages','notes'].includes(r[0])||r[0]==='goals'&&r[2]==='complete');}
async function dispatch({s,scoped,route:r,method:m,body:b,url,orchestrator:o}){
 if(!scoped&&r[0]==='read'&&r.length===2&&m==='GET')return page(s,r[1],Object.fromEntries(url.searchParams));
 if(!scoped&&r[0]==='summary'&&r.length===1&&m==='GET')return url.searchParams.get('goal')?{...goalSummary(s,url.searchParams.get('goal')),queueReason:queueReason(s,s.requireGoal(url.searchParams.get('goal')),o)}:{goals:s.rows('SELECT id FROM goals ORDER BY created_at DESC').map(g=>goalSummary(s,g.id))};
 if(!scoped&&r[0]==='handoff'&&r.length===1&&m==='GET')return handoff(s,url.searchParams.get('goal'));
 if(!scoped&&r[0]==='preview'&&r.length===1&&m==='POST')return {project:s.root,...resolveGoal(s.config,b),baseline:sourceBaseline(s.root,b.baseline),note:'Isolated writers use the recorded commit; dirty and untracked root files are excluded. Preview does not start work.'};
 if(!scoped&&r[0]==='goals'&&r[2]==='budget'&&r.length===3&&m==='POST')return extendBudget(s,r[1],b);
 if(!scoped&&r[0]==='notes'&&r.length===3&&m==='POST')return updateNote(s,r[1],r[2],b);
 if(!scoped&&r[0]==='notes'&&r[2]==='revisions'&&r.length===3&&m==='GET')return s.rows('SELECT * FROM note_revisions WHERE note_id=? ORDER BY id DESC',r[1]);
 if(!scoped&&r[0]==='specifications'&&r.length===1&&m==='GET')return starterSpecifications;
 const lengths={status:1,config:1,agents:m==='DELETE'?2:1,goals:r.length===1?1:3,tasks:r.length===1?1:3,messages:1,notes:1,control:1,recovery:1,approvals:3,interrupt:1,history:1,conversations:1};if(r.length!==lengths[r[0]])throw failure(404,'Unknown route');if(['goals','tasks','approvals'].includes(r[0])&&r[1])idSegment(r[1]);
 if(r[0]==='status'&&m==='GET')return scoped?{goal:s.requireGoal(scoped.goal),agents:parse(s.requireGoal(scoped.goal).config_json,{}).agents,tasks:s.rows('SELECT * FROM tasks WHERE goal_id=?',scoped.goal),messages:s.rows('SELECT * FROM messages WHERE goal_id=? AND (sender_agent_id=? OR recipient_agent_id=?)',scoped.goal,scoped.agent,scoped.agent),evidence:s.rows('SELECT * FROM evidence WHERE goal_id=?',scoped.goal)}:{...s.status(url.searchParams.get('bounded')==='1'),queueReasons:Object.fromEntries(s.rows("SELECT * FROM goals WHERE status IN ('queued','running')").map(g=>[g.id,queueReason(s,g,o)]))};
 if(r[0]==='config'&&m==='GET')return s.config;
 if(r[0]==='config'&&m==='POST'){if(b.expectedRevision&&b.expectedRevision!==revision(s.config))throw failure(409,'Configuration changed; reload before saving');s.config=saveConfig(s.root,b.config);s.syncRoster(s.config.agents);return s.config;}
 if(r[0]==='agents'&&m==='POST'){const parsed=agentSchema.partial().parse(b.agent);const input=Object.fromEntries(Object.entries(parsed).filter(([key])=>Object.hasOwn(b.agent,key)));const old=input.id?s.config.agents.find(a=>a.id===input.id):s.config.agents.find(a=>a.name===input.name);if(b.createOnly&&old)throw new Error('Agent already exists; use edit to change it');const a=agentSchema.parse({...old,...input,id:old?.id||input.id||id()});s.config.agents=s.config.agents.filter(x=>x.id!==a.id);s.config.agents.push(a);s.config=saveConfig(s.root,s.config);s.syncRoster(s.config.agents);return a;}
 if(r[0]==='agents'&&r[1]&&m==='DELETE'){const agent=s.config.agents.find(a=>a.id===r[1])||s.config.agents.find(a=>a.name===r[1]);if(!agent)throw new Error('Agent not found');s.config.agents=s.config.agents.filter(a=>a.id!==agent.id);saveConfig(s.root,s.config);s.syncRoster(s.config.agents);return {removed:r[1]};}
 if(r[0]==='goals'&&r.length===1&&m==='POST'){const input=resolveGoal(s.config,b);return s.createGoal(input.prompt,{...input,budgetLocked:!!process.env.CODEX_TEAMS_ACCEPTANCE_CAP});}
 if(r[0]==='goals'&&r[2]==='participants'&&m==='POST'){const goal=s.requireGoal(r[1]),cfg=parse(goal.config_json,{}),candidate=s.findAgent(b.agent);if(candidate.permission!=='read-only'&&cfg.agents.some(a=>a.permission!=='read-only'&&a.id!==candidate.id)){if(!cfg.baseline?.sha){if(b.baseline!=='HEAD')throw new Error('Legacy goal needs explicit baseline HEAD before isolation');cfg.baseline=sourceBaseline(s.root,b.baseline);}const current=sourceBaseline(s.root,b.baseline);if(current.dirty&&!cfg.baseline.accepted&&b.baseline!=='HEAD')throw new Error('Dirty root: select baseline HEAD to exclude unpublished files');if(b.baseline==='HEAD')cfg.baseline.accepted=true;s.db.prepare('UPDATE goals SET config_json=? WHERE id=?').run(json(cfg),goal.id);}const agent=s.addParticipant(r[1],b.agent);try{const threadId=await o.prepareParticipant(s,s.requireGoal(r[1]),s.row('SELECT * FROM participants WHERE goal_id=? AND agent_id=?',r[1],agent.id));return {agent,threadId};}catch(e){s.event('participant.auth_blocked',{reason:e.message},r[1],agent.id);return {agent,threadStatus:'auth_blocked',reason:e.message};}}
 if(r[0]==='goals'&&r[2]==='reopen'&&m==='POST')return s.reopenGoal(r[1],{prompt:b.prompt,idempotencyKey:b.idempotencyKey});
 if(r[0]==='tasks'&&r.length===1&&m==='POST')return s.createTask(scoped?.goal||b.goalId,b);
 if(r[0]==='tasks'&&r[2]==='claim'&&m==='POST')return s.claimTask(r[1],scoped?.agent||b.agent,b.claimKey);
 if(r[0]==='tasks'&&r[2]==='verify'&&m==='POST')return s.verifyTask(r[1],scoped?.agent||b.agent);
 if(r[0]==='tasks'&&r[2]==='revise'&&m==='POST'){const t=s.task(r[1]);if(!t)throw new Error('Task not found');const g=s.requireGoal(t.goal_id);if(scoped&&g.lead_agent_id!==scoped.agent)throw failure(403,'Lead only');s.db.prepare("UPDATE tasks SET status='pending',claim_key=NULL,verification_requested=0,updated_at=? WHERE id=?").run(now(),t.id);if(b.instructions)s.db.prepare('UPDATE tasks SET description=description||? WHERE id=?').run(`\nCorrection: ${b.instructions}`,t.id);return s.task(t.id);}
 if(r[0]==='messages'&&m==='POST'){if(!b.goalId&&!scoped){const a=s.findAgent(b.recipient);return {assignment:s.createGoal(b.body,{title:`Assignment for ${a.name}`,lead:a.id,participants:[a.id],idempotencyKey:b.idempotencyKey})};}return s.sendMessage({goalId:scoped?.goal||b.goalId,sender:scoped?.agent||null,recipient:b.recipient,body:b.body,actionable:b.actionable!==false,idempotencyKey:b.idempotencyKey});}
 if(r[0]==='notes'&&m==='POST'){const goalId=scoped?.goal||b.goalId;s.requireGoal(goalId);if(typeof b.title!=='string'||!b.title.trim()||typeof b.body!=='string'||!b.body.trim())throw new Error('Note title/body required');const n={id:id(),goalId,title:b.title,body:b.body,createdAt:now()};s.db.prepare('INSERT INTO notes(id,goal_id,title,body,created_at) VALUES(?,?,?,?,?)').run(n.id,n.goalId,n.title,n.body,n.createdAt);return n;}
 if(r[0]==='goals'&&r[2]==='complete'&&m==='POST'){const g=s.requireGoal(r[1]),a=s.goalAgent(g.id,scoped?.agent||b.agent);if(g.lead_agent_id!==a.id)throw failure(403,'Only goal lead can complete');if(s.row('SELECT 1 FROM participants WHERE goal_id=? AND agent_id!=? AND active_turn_id IS NOT NULL',g.id,a.id))throw new Error('Wait for other participant turns before completing goal');if(s.row("SELECT count(*) n FROM tasks WHERE goal_id=? AND status!='verified'",g.id).n||!s.row('SELECT 1 FROM tasks WHERE goal_id=?',g.id)||!s.row('SELECT 1 FROM evidence WHERE goal_id=?',g.id))throw new Error('Goal requires verified tasks and captured evidence');s.db.prepare("UPDATE goals SET status='completed',completed_at=?,updated_at=? WHERE id=?").run(now(),now(),g.id);return {id:g.id,status:'completed'};}
 if(r[0]==='control'&&m==='POST'){
  if(!['pause','resume','stop'].includes(b.action))throw new Error('Unknown action');const goals=b.goalId?[s.requireGoal(b.goalId)].filter(g=>!['completed','stopped'].includes(g.status)):s.rows("SELECT * FROM goals WHERE status NOT IN ('completed','stopped')");for(const g of goals)s.db.prepare('UPDATE goals SET control_version=control_version+1 WHERE id=?').run(g.id);
  if(b.action==='pause'||b.action==='stop'){if(!b.goalId){s.config.paused=b.action==='pause';saveConfig(s.root,s.config);}for(const g of goals){if(b.action==='pause'){s.db.prepare("UPDATE goals SET status='paused',updated_at=? WHERE id=? AND status NOT IN ('recovery_review','stopped','completed')").run(now(),g.id);}if(b.action==='stop')s.db.prepare("UPDATE goals SET status='stopped',updated_at=? WHERE id=?").run(now(),g.id);for(const a of s.rows('SELECT * FROM participants WHERE goal_id=? AND active_turn_id IS NOT NULL',g.id))try{await o.interrupt(s,g.id,a.agent_id);}catch{} }return {action:b.action};}
  for(const g of goals){if(g.status==='recovery_review')throw new Error('Ambiguous side effects require recovery inspect and explicit acknowledgement');if(['auth_blocked','dispatch_blocked','paused','stalled','message_loop','limit_reached'].includes(g.status))s.db.prepare("UPDATE goals SET status=CASE WHEN turn_count=0 THEN 'queued' ELSE 'running' END WHERE id=?").run(g.id);}
  if(!b.goalId){s.config.paused=false;saveConfig(s.root,s.config);}return {paused:false};
 }
 if(r[0]==='recovery'&&m==='POST'){
  const g=s.requireGoal(b.goalId);if(b.action==='inspect')return {history:await o.reconcile(s,g.id),turns:s.rows("SELECT * FROM turns WHERE goal_id=? AND status='recovery_review'",g.id)};
  if(b.action!=='acknowledge'||b.acknowledgeSideEffects!==true)throw new Error('Explicit acknowledgement of inspected side effects required');
  const recoverable=()=>s.row("SELECT 1 FROM turns WHERE goal_id=? AND status='recovery_review' AND uncertain=1",g.id);
  if(!['recovery_review','completed','stopped'].includes(g.status)||!recoverable())throw new Error('Goal has no pending recovery review');if([...o.active.values()].some(a=>a.goal===g.id))throw new Error('Turn still active');
  await o.reconcile(s,g.id);
  const nextStatus=g.status==='recovery_review'?'running':g.status;s.db.exec('BEGIN IMMEDIATE');try{const fresh=s.requireGoal(g.id);if(fresh.status!==g.status||fresh.control_version!==g.control_version||!recoverable())throw new Error('Goal control changed during recovery; no acknowledgement applied');const updated=s.db.prepare("UPDATE goals SET status=?,control_version=control_version+1,updated_at=? WHERE id=? AND status=? AND control_version=?").run(nextStatus,now(),g.id,g.status,g.control_version);if(!updated.changes)throw new Error('Goal control changed during recovery');s.db.prepare("UPDATE turns SET status='reviewed',uncertain=0 WHERE goal_id=? AND status='recovery_review'").run(g.id);s.db.prepare("UPDATE participants SET status='idle',active_turn_id=NULL WHERE goal_id=?").run(g.id);s.db.prepare("UPDATE messages SET status='held' WHERE goal_id=? AND status='dispatching'").run(g.id);s.event('recovery.acknowledged',{},g.id);s.db.exec('COMMIT');}catch(e){s.db.exec('ROLLBACK');throw e;}return {status:nextStatus,note:'No ambiguous messages/tasks replayed; terminal goals require an explicit reopen before new work'};
 }
 if(r[0]==='approvals'&&r[2]==='resolve'&&m==='POST')return o.resolveApproval(s,r[1],b.response??b.decision);
 if(r[0]==='interrupt'&&m==='POST')return o.interrupt(s,b.goalId,b.agent);
 if(r[0]==='history'&&m==='POST'){const goals=b.goalId?[s.requireGoal(b.goalId)].filter(g=>!['completed','stopped'].includes(g.status)):s.rows('SELECT * FROM goals');const result=[];for(const g of goals)result.push(...await o.reconcile(s,g.id));return {synced:result.length};}
 if(r[0]==='conversations'&&m==='GET'){const query=url.searchParams.get('search')||'';return s.rows('SELECT * FROM turns WHERE output LIKE ? OR prompt LIKE ? ORDER BY started_at DESC LIMIT 500',`%${query}%`,`%${query}%`);}
 throw failure(404,'Unknown route');
}
function staticFile(path,res){const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};if(!files[path])throw failure(404,'Not found');const p=join(import.meta.dirname,'..','public',files[path]);res.setHeader('content-security-policy',"default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");res.writeHead(200,{'content-type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[extname(p)]});res.end(readFileSync(p));}
async function readBody(req){if(req.method==='GET'||req.method==='DELETE')return {};if(!req.headers['content-type']?.startsWith('application/json'))throw failure(415,'JSON required');let n=0,raw='';for await(const c of req){n+=c.length;if(n>1000000)throw failure(413,'Body too large');raw+=c;}return raw?JSON.parse(raw):{};}
function send(res,code,data){res.writeHead(code,{'content-type':'application/json; charset=utf-8'});res.end(json(data));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const service=await createService();console.log(`Codex Teams listening on http://127.0.0.1:${SERVICE_PORT}`);const shutdown=async()=>{await service.close();process.exit(0);};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);service.server.on('shutdown',shutdown);}
