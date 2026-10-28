import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

test('portable installation verifier isolates state, exercises installed transports and cleans up', {timeout:60000},async()=>{
 const original=mkdtempSync(join(tmpdir(),'cteam-existing-state-')),sentinel=join(original,'registry.json');writeFileSync(sentinel,'Do not replace existing state');
 const linked=join(original,'linked-tmp'),physical=join(original,'physical-tmp');mkdirSync(physical);symlinkSync(physical,linked);
 try{
  const {stdout}=await promisify(execFile)(process.execPath,[resolve('src/cli.js'),'verify-install'],{cwd:tmpdir(),env:{...process.env,CODEX_TEAMS_DATA:original,TMPDIR:linked,CODEX_BIN:'/nonexistent/do-not-use'},timeout:45000,maxBuffer:1000000});
  const report=JSON.parse(stdout);assert.equal(report.status,'PASSED');assert.equal(report.cleanedUp,true);assert.equal(report.modelTurns,0);assert.equal(report.checks.length,9);assert.ok(report.pending.includes('A separate user/account'));assert.equal(readFileSync(sentinel,'utf8'),'Do not replace existing state');
 }finally{rmSync(original,{recursive:true,force:true});}
});
