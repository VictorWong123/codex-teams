import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,rmSync,existsSync,cpSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {installNativeSkill,nativeInstructions,nativeStatus} from '../src/native.js';
function fixture(t){const root=mkdtempSync(join(tmpdir(),'cteam-native-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}

test('native status is read-only and separates installation from host capability',t=>{
 const home=fixture(t),options={scope:'user',home};
 assert.equal(nativeStatus(options).installation,'missing');assert.equal(existsSync(join(home,'.agents')),false);
 const installed=installNativeSkill(options),status=nativeStatus(options);
 assert.equal(status.installation,'current');assert.equal(status.capability,'check-in-chat');assert.equal(status.execution,'not-started');assert.equal(status.lifecycle,'active-task-only');
 writeFileSync(installed.path,'custom instructions');assert.equal(nativeStatus(options).installation,'different');assert.equal(readFileSync(installed.path,'utf8'),'custom instructions');
 assert.throws(()=>nativeStatus({scope:'user',home,project:home}),/requires --scope project/);
 assert.throws(()=>installNativeSkill({scope:'user',home,project:home}),/requires --scope project/);
});

test('native status rejects every symlink component and nonregular files without disclosing contents',t=>{
 const root=fixture(t),outside=join(root,'outside');mkdirSync(outside);writeFileSync(join(outside,'SKILL.md'),'private sentinel');
 const parts=['.agents','skills','codex-teams-native','SKILL.md'];
 for(let i=0;i<parts.length;i++){
  const home=join(root,String(i));mkdirSync(home);const parent=join(home,...parts.slice(0,i));mkdirSync(parent,{recursive:true});
  symlinkSync(i===3?join(outside,'SKILL.md'):outside,join(parent,parts[i]));
  const status=nativeStatus({scope:'user',home});assert.equal(status.installation,'unsafe-path');assert.ok(!JSON.stringify(status).includes('private sentinel'));
 }
 const home=join(root,'nonregular');mkdirSync(join(home,...parts),{recursive:true});
 assert.equal(nativeStatus({scope:'user',home}).installation,'unsafe-path');
 assert.equal(readFileSync(join(outside,'SKILL.md'),'utf8'),'private sentinel');
});

test('Cloud bootstrap works from a dependency-free checkout and preserves existing project state',t=>{
 const root=fixture(t),checkout=join(root,'checkout'),project=join(root,'project'),state=join(root,'state');mkdirSync(project);
 for(const file of ['scripts/setup-cloud.mjs','src/native.js','plugins/codex-teams-native/skills/codex-teams-native/SKILL.md'])cpSync(resolve(file),join(checkout,file),{recursive:true});
 writeFileSync(join(checkout,'package.json'),'{"type":"module"}');writeFileSync(join(project,'sentinel'),'keep');
 const script=join(checkout,'scripts/setup-cloud.mjs'),env={...process.env,CODEX_BIN:'/nonexistent/do-not-run',CODEX_TEAMS_DATA:state};
 const run=args=>JSON.parse(execFileSync(process.execPath,[script,...args],{cwd:project,env,encoding:'utf8',timeout:5000,stdio:'pipe'}));
 const args=['--scope','project','--project',project],first=run(args);assert.equal(first.changed,true);assert.equal(first.installation,'current');assert.equal(first.capability,'check-in-chat');assert.equal(first.execution,'not-started');
 assert.equal(run(args).changed,false);assert.equal(readFileSync(join(project,'sentinel'),'utf8'),'keep');assert.equal(existsSync(state),false);assert.equal(existsSync(join(project,'.codex-teams')),false);assert.equal(existsSync(join(checkout,'node_modules')),false);
 writeFileSync(first.path,'user edits');assert.throws(()=>run(args),/Existing skill differs/);assert.equal(readFileSync(first.path,'utf8'),'user edits');
 for(const invalid of [['--launchagent'],['--scope'],['--scope','user','--scope','user'],['--scope','project'],['--project',project]])assert.throws(()=>run(invalid));
});
test('native user install is idempotent and preserves an existing modified skill',t=>{
 const home=fixture(t);const first=installNativeSkill({scope:'user',home});assert.equal(first.changed,true);assert.equal(first.execution,'not-started');assert.equal(readFileSync(first.path,'utf8'),nativeInstructions());
 assert.equal(installNativeSkill({scope:'user',home}).changed,false);
 writeFileSync(first.path,'user content');assert.throws(()=>installNativeSkill({scope:'user',home}),/differs/);assert.equal(readFileSync(first.path,'utf8'),'user content');
});
test('native project install is caller-selected and leaves unrelated skills untouched',t=>{
 const root=fixture(t),a=join(root,'a'),b=join(root,'b');mkdirSync(a);mkdirSync(b);mkdirSync(join(a,'.agents','skills','unrelated'),{recursive:true});writeFileSync(join(a,'.agents','skills','unrelated','SKILL.md'),'keep');
 const result=installNativeSkill({scope:'project',project:a});assert.ok(result.path.startsWith(a));assert.equal(readFileSync(join(a,'.agents','skills','unrelated','SKILL.md'),'utf8'),'keep');assert.throws(()=>installNativeSkill({scope:'project'}),/explicit/);assert.throws(()=>installNativeSkill({scope:'invalid',home:b}),/Choose/);
});
test('native installer refuses symlinked directories and files without overwriting their targets',t=>{
 const root=fixture(t),home=join(root,'home'),outside=join(root,'outside');mkdirSync(home);mkdirSync(outside);symlinkSync(outside,join(home,'.agents'));assert.throws(()=>installNativeSkill({scope:'user',home}),/symlink/);
 rmSync(join(home,'.agents'));const dest=join(home,'.agents','skills','codex-teams-native');mkdirSync(dest,{recursive:true});const sentinel=join(outside,'sentinel');writeFileSync(sentinel,'keep');symlinkSync(sentinel,join(dest,'SKILL.md'));assert.throws(()=>installNativeSkill({scope:'user',home}),/symlink/);assert.equal(readFileSync(sentinel,'utf8'),'keep');
});
test('native CLI works outside a team project without service, login or Codex executable',t=>{
 const cwd=fixture(t),env={...process.env,CODEX_BIN:'/nonexistent/never-run-codex',CODEX_TEAMS_DATA:join(cwd,'unused-state')};
 const run=args=>execFileSync(process.execPath,[resolve('src/cli.js'),'native',...args],{cwd,env,encoding:'utf8'});
 assert.match(run(['instructions']),/Capability and mode check/);
 assert.equal(JSON.parse(run(['status','--scope','project','--project',cwd])).installation,'missing');
 const installed=JSON.parse(run(['install','--scope','project','--project',cwd]));assert.equal(installed.execution,'not-started');assert.equal(installed.capability,'check-in-chat');assert.equal(JSON.parse(run(['status','--scope','project','--project',cwd])).installation,'current');
});
