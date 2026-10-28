#!/usr/bin/env node
import { readFileSync, openSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { api } from './http-client.js';
import { initializeProject } from './project.js';
import { resolveProject, ensureDir, idSegment } from './util.js';
import { DATA_DIR, SERVICE_PORT } from './constants.js';
import { Registry } from './db.js';
import { controlLaunchAgent } from './service-control.js';
import { install, uninstall } from './install.js';
import {doctor} from './diagnostics.js';
import {parseArgs,commandHelp} from './cli-options.js';
const args=process.argv.slice(2);let parsed;
try{parsed=parseArgs(args);}catch(e){console.error(e.message);process.exit(1);}
if(parsed.help){console.log(commandHelp(parsed.cmd));process.exit(0);}
const flags=parsed.flags,words=parsed.words;
const [cmd,sub,...rest]=words;
const out=v=>console.log(JSON.stringify(v,null,2));
const textInput=()=>flags['text-file']?readFileSync(flags['text-file'],'utf8'):flags.stdin?readFileSync(0,'utf8'):undefined;
const input=()=>flags.json?JSON.parse(flags.json):flags.file?JSON.parse(readFileSync(flags.file,'utf8')):{};
const project=()=>{const reg=new Registry(),selected=flags.project&&reg.find(flags.project);return selected?.root||resolveProject(process.cwd(),flags.project).root;};
const post=(path,body={})=>api(`/api/${path}`,{method:'POST',body:{...body,project:project()}});
const get=path=>api(`/api/${path}${path.includes('?')?'&':'?'}project=${encodeURIComponent(project())}`);
const health=async()=>{try{const r=await fetch(`http://127.0.0.1:${SERVICE_PORT}/health`,{signal:AbortSignal.timeout(1000)});if(!r.ok)return null;return await r.json();}catch{return null;}};
try{
 if(!cmd||cmd==='help'||cmd==='--help'){console.log(`cteam 0.1.5-rc.1 (codex-teams compatible) — Node >=22.22; Codex 0.163.0\n\ninit [path] | status | config [get|set] --file team.json\nroster [list|add|edit|disable|remove|model] [name] --json '{...}'\ngoal [prompt] --lead agent --participants a,b | reopen GOAL --prompt text\nmessage AGENT --body text [--goal ID] [--informational]\ntasks [create|claim|verify|revise] [ID] --json '{...}'\nnotes [add] --json '{"goalId":"...","title":"...","body":"..."}'\nconversations --search text | interrupt --goal ID --agent NAME\npause | resume | stop [--goal ID]\napprovals [resolve ID] --json '{"decision":"decline"}'\nrecovery [inspect|acknowledge] --goal ID [--acknowledge-side-effects]\nservice [start|status|stop] [--foreground] | dashboard [--no-open]\ninstall [--launchagent] | uninstall | self-test [--live] | verify-install\nnative instructions | native install --scope user|project [--project PATH]\n\nUse --project PATH_OR_ID for every project command; nearest team.json otherwise.\nModel/config edits: roster model NAME --model MODEL; roster edit NAME --json '{"purpose":"...","permission":"read-only"}'.\nTeams run only on explicit goal/message requests. Login with your own codex login.`);}
 else if(cmd==='verify-install'){const {verifyInstall}=await import('../scripts/verify-install.mjs');const report=await verifyInstall();out(report);if(report.status!=='PASSED')process.exitCode=1;}
 else if(cmd==='native'){const {nativeInstructions,installNativeSkill}=await import('./native.js');if(sub==='instructions')console.log(nativeInstructions());else if(sub==='install')out(installNativeSkill({scope:flags.scope,project:flags.project}));else throw new Error('native instructions | native install --scope user|project [--project PATH]');}
 else if(cmd==='init')out(initializeProject(resolve(sub||flags.project||process.cwd())));
 else if(cmd==='doctor'){let root;if(flags.project){let registered;try{registered=JSON.parse(readFileSync(join(DATA_DIR,'registry.json'),'utf8')).projects.find(p=>p.id===flags.project||p.root===flags.project);}catch{}root=registered?.root||resolveProject(process.cwd(),flags.project).root;}out(await doctor(root));}
 else if(cmd==='projects')out(sub==='activate'?await api('/api/projects/'+encodeURIComponent(rest[0])+'/activate',{method:'POST',body:{acknowledge:flags.acknowledge}}):await api('/api/projects'));
 else if(cmd==='handoff'){const value=await get('handoff?goal='+encodeURIComponent(flags.goal));if(flags.format==='text'){console.log(`${value.goal.title} — ${value.goal.status}\nBaseline: ${value.baseline?.sha||'unknown'}\n`);for(const w of value.workspaces)console.log(`${w.agent}: ${w.path||'not initialized'} (${w.branch||'root workspace'})`);for(const t of value.tasks)console.log(`${t.status}: ${t.title}`);for(const e of value.evidence)console.log(`${e.kind}: ${e.command||e.id} · exit ${e.exit_code??'n/a'}`);console.log(value.integration);}else out(value);}
 else if(cmd==='storage')out(await api('/api/storage'));
 else if(cmd==='backup')out(await api('/api/backup',{method:'POST',body:{destination:resolve(flags.destination)}}));
 else if(cmd==='restore'){const {restoreBackup}=await import('./backup.js');out(restoreBackup(resolve(flags.source),resolve(flags.destination)));}
 else if(cmd==='service'){
  if(sub==='config')out(flags.json||flags.file?await api('/api/service-config',{method:'POST',body:input()}):await api('/api/service-config'));
  else if(sub==='status')out(await health()||{ok:false});
  else if(sub==='stop'){const managed=await controlLaunchAgent('stop');if(await health()){try{await api('/api/shutdown',{method:'POST',body:{}});}catch(e){if(!managed.handled||await health())throw e;}}out(managed.handled?managed:{stopped:true});}
  else if(sub==='start'){
   const managed=flags.foreground?{handled:false}:await controlLaunchAgent('start',{beforeBootstrap:async()=>{if(await health()){await api('/api/shutdown',{method:'POST',body:{}});for(let n=0;n<30;n++){if(!(await health()))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Existing detached service did not stop before LaunchAgent startup');}}});
   if(managed.handled){let ready=false;for(let n=0;n<30;n++){if(await health()){ready=true;break;}await new Promise(r=>setTimeout(r,100));}if(!ready)throw new Error('Owned LaunchAgent started but service health is unavailable; inspect launchctl and service.log');out(managed);}
   else if(await health())out({running:true});
   else if(flags.foreground){const {createService}=await import('./service.js');const service=await createService();console.log(`http://127.0.0.1:${SERVICE_PORT}`);process.on('SIGTERM',async()=>{await service.close();process.exit();});process.on('SIGINT',async()=>{await service.close();process.exit();});service.server.on('shutdown',async()=>{await service.close();process.exit();});}
   else{new Registry();const log=openSync(join(ensureDir(DATA_DIR),'service.log'),'a',0o600);const child=spawn(process.execPath,[join(import.meta.dirname,'service.js')],{detached:true,stdio:['ignore',log,log],env:process.env});child.unref();let ready=false;for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,100));if(await health()){ready=true;break;}}if(!ready)throw new Error(`Service did not start. Inspect ${join(DATA_DIR,'service.log')}`);out({running:true,url:`http://127.0.0.1:${SERVICE_PORT}`});}
  }else throw new Error('service start|status|stop');
 }
 else if(cmd==='dashboard'){const token=new Registry().authToken(),url=`http://127.0.0.1:${SERVICE_PORT}/#${token}`;if(!(await health()))throw new Error('Start service first: cteam service start');if(!flags['no-open']){const command=process.platform==='darwin'?'open':process.platform==='win32'?'explorer.exe':'xdg-open';const child=spawn(command,[url],{stdio:'ignore'});child.on('error',()=>{});child.unref();}console.log(url);}
 else if(cmd==='install')out(await install({launchagent:!!flags.launchagent}));
 else if(cmd==='uninstall'){if(await health())await api('/api/shutdown',{method:'POST',body:{}});out(await uninstall());}
 else if(cmd==='self-test'){const {selfTest}=await import('./self-test.js');out(await selfTest({live:args.includes('--live')}));}
 else if(cmd==='status'){do{const value=await get(flags.goal?'summary?goal='+encodeURIComponent(flags.goal):'status');if(flags.format==='text'){const goals=value.goal?[value.goal]:value.goals;for(const g of goals){const limits=JSON.parse(g.config_json).limits;console.log(`${g.id} ${g.status}: ${g.title} (${g.turn_count}/${limits.turns} turns, ${Math.round(g.active_ms/60000)}/${limits.minutes} active minutes, ${g.token_count}/${limits.tokens??'unlimited'} tokens)`);console.log(value.queueReason||value.queueReasons?.[g.id]||value.blocker||'');}if(value.goal){for(const p of value.participants)console.log(`${JSON.parse(p.snapshot_json).name}: ${p.status} · ${p.workspace||'workspace not initialized'}`);for(const t of value.tasks)console.log(`${t.status}: ${t.title}`);}}else out(value);if(flags.watch)await new Promise(r=>setTimeout(r,2500));}while(flags.watch);}
 else if(cmd==='config')out(sub==='set'?await post('config',{config:input()}):await get('config'));
 else if(cmd==='roster'){
  if(!sub||sub==='list')out((await get('status')).config.agents);
  else{const name=rest[0],config=await get('config'),old=config.agents.find(a=>a.id===name)||config.agents.find(a=>a.name===name);if(sub==='remove'){if(!old)throw new Error('Agent not found');config.agents=config.agents.filter(a=>a.id!==old.id);out(await post('config',{config}));}
   else{if(sub==='add'&&old)throw new Error('Agent already exists; use roster edit to change it');if(sub!=='add'&&!old)throw new Error('Agent not found');out(await post('agents',{createOnly:sub==='add',agent:{...old,...input(),...(name&&!old?{name}:{}),...(sub==='disable'?{enabled:false}:{}),...(sub==='model'?{model:flags.model==='inherit'?null:flags.model}:{}),...(flags.model?{model:flags.model==='inherit'?null:flags.model}:{})}}));}}
 }
 else if(cmd==='goal'){if(parsed.sub==='budget')out(await post(`goals/${idSegment(flags.goal)}/budget`,Object.fromEntries(['turns','minutes','tokens'].filter(k=>flags[k]!==undefined).map(k=>[k,Number(flags[k])]))));else out(await post(flags.preview?'preview':'goals',{prompt:textInput()??flags.prompt??(flags.spec?undefined:[sub,...rest].filter(Boolean).join(' ')),spec:flags.spec,lead:flags.lead,participants:flags.participants?.split(','),idempotencyKey:flags.key,baseline:flags.baseline,...input()}));}
 else if(cmd==='reopen')out(await post(`goals/${idSegment(sub)}/reopen`,{prompt:flags.prompt,idempotencyKey:flags.key}));
 else if(cmd==='message')out(await post('messages',{recipient:sub,body:textInput()??flags.body??rest.join(' '),goalId:flags.goal,actionable:!flags.informational,idempotencyKey:flags.key}));
 else if(cmd==='tasks'){if(!sub||sub==='list')out((await get('status')).tasks);else out(await post(sub==='create'?'tasks':`tasks/${idSegment(rest[0])}/${sub}`,{goalId:flags.goal,agent:flags.agent,...input()}));}
 else if(cmd==='notes')out(sub==='add'?await post('notes',input()):['edit','archive','unarchive'].includes(sub)?await post(`notes/${idSegment(rest[0])}/${sub}`,input()):flags.page||flags.cursor?await get('read/notes?'+new URLSearchParams(Object.fromEntries(['search','cursor','limit'].filter(k=>flags[k]!==undefined).map(k=>[k,flags[k]])))):(await get('status')).notes.filter(n=>!flags.search||(n.title+' '+n.body).toLowerCase().includes(flags.search.toLowerCase())));
 else if(cmd==='conversations'){if(flags.sync)await post('history',{});out(await get((flags.page||flags.cursor||flags.goal||flags.agent?'read/conversations':'conversations')+'?'+new URLSearchParams(Object.fromEntries(['search','goal','agent','cursor','limit'].filter(k=>flags[k]!==undefined).map(k=>[k,flags[k]])))));}
 else if(cmd==='participant')out(await post(`goals/${idSegment(flags.goal)}/participants`,{agent:sub,baseline:flags.baseline}));
 else if(['pause','resume','stop'].includes(cmd))out(await post('control',{action:cmd,goalId:flags.goal}));
 else if(cmd==='interrupt')out(await post('interrupt',{goalId:flags.goal,agent:flags.agent}));
 else if(cmd==='approvals')out(sub==='resolve'?await post(`approvals/${idSegment(rest[0])}/resolve`,{response:input()}):(await get('status')).approvals);
 else if(cmd==='recovery')out(await post('recovery',{action:sub,goalId:flags.goal,acknowledgeSideEffects:!!flags['acknowledge-side-effects']}));
 else throw new Error(`Unknown command ${cmd}; run cteam help`);
}catch(e){console.error(e.message);process.exitCode=1;}
