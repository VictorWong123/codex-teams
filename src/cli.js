#!/usr/bin/env node
import { readFileSync, openSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, resolve } from 'node:path';
import { api } from './http-client.js';
import { initializeProject } from './project.js';
import { resolveProject, ensureDir } from './util.js';
import { DATA_DIR, SERVICE_PORT } from './constants.js';
import { Registry } from './db.js';
import { install, uninstall } from './install.js';
const args=process.argv.slice(2),flags={};const words=[];
for(let i=0;i<args.length;i++){if(args[i].startsWith('--')){const name=args[i].slice(2);flags[name]=['foreground','launchagent','no-open','disabled','informational','acknowledge-side-effects','live','sync'].includes(name)?true:args[++i];}else words.push(args[i]);}
const [cmd,sub,...rest]=words;
const out=v=>console.log(JSON.stringify(v,null,2));
const input=()=>flags.json?JSON.parse(flags.json):flags.file?JSON.parse(readFileSync(flags.file,'utf8')):{};
const project=()=>{const reg=new Registry(),selected=flags.project&&reg.find(flags.project);return selected?.root||resolveProject(process.cwd(),flags.project).root;};
const post=(path,body={})=>api(`/api/${path}`,{method:'POST',body:{...body,project:project()}});
const get=path=>api(`/api/${path}${path.includes('?')?'&':'?'}project=${encodeURIComponent(project())}`);
const health=async()=>{try{const r=await fetch(`http://127.0.0.1:${SERVICE_PORT}/health`,{signal:AbortSignal.timeout(1000)});if(!r.ok)return null;return await r.json();}catch{return null;}};
try{
 if(!cmd||cmd==='help'||cmd==='--help'){console.log(`codex-teams 0.1.0 — Node >=22.22; Codex 0.163.0\n\ninit [path] | status | config [get|set] --file team.json\nroster [list|add|edit|disable|remove|model] [name] --json '{...}'\ngoal [prompt] --lead agent --participants a,b | reopen GOAL --prompt text\nmessage AGENT --body text [--goal ID] [--informational]\ntasks [create|claim|verify|revise] [ID] --json '{...}'\nnotes [add] --json '{"goalId":"...","title":"...","body":"..."}'\nconversations --search text | interrupt --goal ID --agent NAME\npause | resume | stop [--goal ID]\napprovals [resolve ID] --json '{"decision":"decline"}'\nrecovery [inspect|acknowledge] --goal ID [--acknowledge-side-effects]\nservice [start|status|stop] [--foreground] | dashboard [--no-open]\ninstall [--launchagent] | uninstall | self-test [--live]\n\nUse --project PATH_OR_ID for every project command; nearest team.json otherwise.\nModel/config edits: roster model NAME --model MODEL; roster edit NAME --json '{"purpose":"...","permission":"read-only"}'.\nTeams run only on explicit goal/message requests. Login with your own codex login.`);}
 else if(cmd==='init')out(initializeProject(resolve(sub||flags.project||process.cwd())));
 else if(cmd==='service'){
  if(sub==='status')out(await health()||{ok:false});
  else if(sub==='stop'){if(await health())out(await api('/api/shutdown',{method:'POST',body:{}}));else out({stopped:true});}
  else if(sub==='start'){
   if(await health())out({running:true});
   else if(flags.foreground){const {createService}=await import('./service.js');const service=await createService();console.log(`http://127.0.0.1:${SERVICE_PORT}`);process.on('SIGTERM',async()=>{await service.close();process.exit();});process.on('SIGINT',async()=>{await service.close();process.exit();});service.server.on('shutdown',async()=>{await service.close();process.exit();});}
   else{new Registry();const log=openSync(join(ensureDir(DATA_DIR),'service.log'),'a',0o600);const child=spawn(process.execPath,[join(import.meta.dirname,'service.js')],{detached:true,stdio:['ignore',log,log],env:process.env});child.unref();let ready=false;for(let n=0;n<30;n++){await new Promise(r=>setTimeout(r,100));if(await health()){ready=true;break;}}if(!ready)throw new Error(`Service did not start. Inspect ${join(DATA_DIR,'service.log')}`);out({running:true,url:`http://127.0.0.1:${SERVICE_PORT}`});}
  }else throw new Error('service start|status|stop');
 }
 else if(cmd==='dashboard'){const token=new Registry().authToken(),url=`http://127.0.0.1:${SERVICE_PORT}/#${token}`;if(!(await health()))throw new Error('Start service first: codex-teams service start');if(!flags['no-open']){const command=process.platform==='darwin'?'open':process.platform==='win32'?'explorer.exe':'xdg-open';const child=spawn(command,[url],{stdio:'ignore'});child.on('error',()=>{});child.unref();}console.log(url);}
 else if(cmd==='install')out(install({launchagent:!!flags.launchagent}));
 else if(cmd==='uninstall'){if(await health())await api('/api/shutdown',{method:'POST',body:{}});out(uninstall());}
 else if(cmd==='self-test'){const {selfTest}=await import('./self-test.js');out(await selfTest({live:args.includes('--live')}));}
 else if(cmd==='status')out(await get('status'));
 else if(cmd==='config')out(sub==='set'?await post('config',{config:input()}):await get('config'));
 else if(cmd==='roster'){
  if(!sub||sub==='list')out((await get('status')).config.agents);
  else{const name=rest[0],config=await get('config'),old=config.agents.find(a=>a.name===name||a.id===name);if(sub==='remove'){if(!old)throw new Error('Agent not found');config.agents=config.agents.filter(a=>a.id!==old.id);out(await post('config',{config}));}
   else{if(sub!=='add'&&!old)throw new Error('Agent not found');out(await post('agents',{agent:{...old,...input(),...(name&&!old?{name}:{}),...(sub==='disable'?{enabled:false}:{}),...(sub==='model'?{model:flags.model==='inherit'?null:flags.model}:{}),...(flags.model?{model:flags.model==='inherit'?null:flags.model}:{})}}));}}
 }
 else if(cmd==='goal')out(await post('goals',{prompt:flags.prompt||[sub,...rest].filter(Boolean).join(' '),lead:flags.lead,participants:flags.participants?.split(','),idempotencyKey:flags.key,...input()}));
 else if(cmd==='reopen')out(await post(`goals/${sub}/reopen`,{prompt:flags.prompt,idempotencyKey:flags.key}));
 else if(cmd==='message')out(await post('messages',{recipient:sub,body:flags.body||rest.join(' '),goalId:flags.goal,actionable:!flags.informational,idempotencyKey:flags.key}));
 else if(cmd==='tasks'){if(!sub||sub==='list')out((await get('status')).tasks);else out(await post(sub==='create'?'tasks':`tasks/${rest[0]}/${sub}`,{goalId:flags.goal,agent:flags.agent,...input()}));}
 else if(cmd==='notes')out(sub==='add'?await post('notes',input()):(await get('status')).notes);
 else if(cmd==='conversations'){if(flags.sync)await post('history',{});out(await get(`conversations?search=${encodeURIComponent(flags.search||'')}`));}
 else if(cmd==='participant')out(await post(`goals/${flags.goal}/participants`,{agent:sub}));
 else if(['pause','resume','stop'].includes(cmd))out(await post('control',{action:cmd,goalId:flags.goal}));
 else if(cmd==='interrupt')out(await post('interrupt',{goalId:flags.goal,agent:flags.agent}));
 else if(cmd==='approvals')out(sub==='resolve'?await post(`approvals/${rest[0]}/resolve`,{response:input()}):(await get('status')).approvals);
 else if(cmd==='recovery')out(await post('recovery',{action:sub,goalId:flags.goal,acknowledgeSideEffects:!!flags['acknowledge-side-effects']}));
 else throw new Error(`Unknown command ${cmd}; run codex-teams help`);
}catch(e){console.error(e.message);process.exitCode=1;}
