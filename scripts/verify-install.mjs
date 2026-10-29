import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,existsSync,rmSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import net from 'node:net';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
const exec=promisify(execFile);
const pause=ms=>new Promise(r=>setTimeout(r,ms));

export async function verifyInstall(){
 const report={version:1,packageVersion:JSON.parse(readFileSync(new URL('../package.json',import.meta.url))).version,platform:process.platform,node:process.version,status:'FAILED',checks:[],modelTurns:0,pending:['Native host tool availability and hosted plugin activation','Consumer-owned live model acceptance','Actual macOS LaunchAgent behavior','A separate user/account']};
 const scratch=realpathSync(mkdtempSync(join(tmpdir(),'cteam-verify-')));
 const project=join(scratch,'project'),other=join(scratch,'other');mkdirSync(project);mkdirSync(other);
 let service,client,port;
 const check=name=>report.checks.push(name);
 try{
  const listener=net.createServer();await new Promise((r,j)=>{listener.once('error',j);listener.listen(0,'127.0.0.1',r)});port=listener.address().port;await new Promise(r=>listener.close(r));
  const trap=join(scratch,'codex-trap');const marker=join(scratch,'codex-invoked');
  writeFileSync(trap,`#!/usr/bin/env node\nrequire('node:fs').writeFileSync(${JSON.stringify(marker)},'unexpected invocation');process.exit(99);\n`,{mode:0o700});
  await assert.rejects(exec(trap,[],{timeout:10000}),error=>error.code===99);
  assert.equal(existsSync(marker),true,'Codex invocation detector did not execute');rmSync(marker);
  check('Codex invocation detector self-test');
  const env={...process.env,CODEX_TEAMS_DATA:join(scratch,'state'),CODEX_TEAMS_PORT:String(port),CODEX_HOME:join(scratch,'codex-home'),CODEX_BIN:trap};mkdirSync(env.CODEX_HOME);
  const cli=resolve(import.meta.dirname,'../src/cli.js');
  const command=async(...args)=>{const {stdout}=await exec(process.execPath,[cli,...args],{cwd:project,env,timeout:15000,maxBuffer:1000000});return stdout;};
  const json=async(...args)=>JSON.parse(await command(...args));
  assert.match(await command('help'),new RegExp(report.packageVersion.replaceAll('.','\\.')));check('installed CLI help');
  const initialized=await json('init',project);assert.ok(initialized.project.id);check('isolated project initialization');
  for(const target of [project,other]){const first=await json('native','install','--scope','project','--project',target);assert.equal(first.changed,true);assert.equal(first.execution,'not-started');assert.equal((await json('native','install','--scope','project','--project',target)).changed,false);}
  check('native skill installation in two projects and idempotence');
  service=spawn(process.execPath,[resolve(import.meta.dirname,'../src/service.js')],{cwd:other,env,stdio:'ignore'});let spawnError;service.once('error',e=>{spawnError=e});
  const base=`http://127.0.0.1:${port}`;let ready=false;
  for(let i=0;i<50;i++){if(spawnError)throw spawnError;if(service.exitCode!==null)throw new Error('Service exited during startup');try{const r=await fetch(base+'/health',{signal:AbortSignal.timeout(300)});if(r.ok){assert.equal((await r.json()).version,report.packageVersion);ready=true;break}}catch{}await pause(100);}
  assert.equal(ready,true,'service health unavailable');check('isolated loopback service version');
  assert.equal((await fetch(base+'/api/projects',{headers:{'x-codex-teams-request':'1'},signal:AbortSignal.timeout(3000)})).status,401);
  assert.equal((await fetch(base+'/',{headers:{Origin:'https://example.com'},signal:AbortSignal.timeout(3000)})).status,403);check('unauthenticated and cross-origin rejection');
  const dashboard=await fetch(base+'/',{signal:AbortSignal.timeout(3000)});assert.equal(dashboard.status,200);assert.ok(dashboard.headers.get('content-security-policy'));check('dashboard response and CSP');
  client=new Client({name:'cteam-install-verification',version:'1.0.0'});
  await client.connect(new StdioClientTransport({command:process.execPath,args:[resolve(import.meta.dirname,'../src/mcp.js')],cwd:other,env,stderr:'pipe'}),{timeout:5000});
  assert.equal(client.getServerVersion().version,report.packageVersion);
  assert.equal((await client.listTools({}, {timeout:5000})).tools.length,25);
  const status=await client.callTool({name:'team_status',arguments:{cwd:project}},undefined,{timeout:5000});assert.notEqual(status.isError,true);assert.equal(JSON.parse(status.content[0].text).project.root,project);
  assert.equal((await client.callTool({name:'team_status',arguments:{}},undefined,{timeout:5000})).isError,true);check('actual MCP handshake, 25 tools and caller context isolation');
  assert.equal(existsSync(marker),false,'Codex unexpectedly invoked');check('no Codex invocation');
  report.status='PASSED';
 }catch(error){report.error=error.message;}
 finally{
  try{if(client)await client.close();}catch(error){report.status='FAILED';report.cleanupError=error.message;}
  if(service&&service.exitCode===null&&service.signalCode===null){service.kill('SIGTERM');await Promise.race([new Promise(r=>service.once('exit',r)),pause(2000)]);if(service.exitCode===null&&service.signalCode===null){service.kill('SIGKILL');await Promise.race([new Promise(r=>service.once('exit',r)),pause(2000)]);}}
  if(service&&service.exitCode===null&&service.signalCode===null){report.status='FAILED';report.cleanupError='Service did not exit';report.scratchRetained=scratch;}
  else{rmSync(scratch,{recursive:true,force:true});report.cleanedUp=!existsSync(scratch);}
 }
 return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const report=await verifyInstall();console.log(JSON.stringify(report,null,2));if(report.status!=='PASSED')process.exitCode=1;}
