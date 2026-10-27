import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {installNativeSkill,nativeInstructions} from '../src/native.js';
function fixture(t){const root=mkdtempSync(join(tmpdir(),'cteam-native-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}
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
 const installed=JSON.parse(run(['install','--scope','project','--project',cwd]));assert.equal(installed.execution,'not-started');assert.equal(installed.capability,'check-in-chat');
});
