import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {DATA_DIR,SERVICE_PORT,PROTOCOL_VERSION} from './constants.js';
import {validateConfig} from './config.js';
export function classifyError(error) {
 const message=String(error.message||error),rules=[['CONFIG_INVALID',/config|Zod|JSON|project.*not|Project not/i,'Check project selection and validate team.json.'],['PROTOCOL_MISMATCH',/version|protocol/i,'Use the supported Codex version; do not upgrade automatically.'],['AUTH_REQUIRED',/auth|login|Unauthorized|credential/i,'Check your own Codex login and local service credentials.'],['GIT_BASELINE',/Git|worktree|baseline/i,'Inspect Git status and choose the committed baseline explicitly.'],['SERVICE_UNAVAILABLE',/fetch failed|ECONN|ENOENT|timeout|service/i,'Run cteam doctor and cteam service status.']];
 const [code,,nextAction]=rules.find(([,pattern])=>pattern.test(message))||['DISPATCH_FAILED',null,'Inspect goal status and recovery history before retrying.'];
 return {code,message:message.replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/[a-f0-9]{64}/gi,'[redacted]').slice(0,1000),nextAction};
}
export async function doctor(project) {
 const checks=[],check=(name,ok,detail,nextAction)=>checks.push({name,ok,detail,nextAction:ok?null:nextAction});
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 check('node',(Number(process.versions.node.split('.')[0])>22||Number(process.versions.node.split('.')[0])===22&&Number(process.versions.node.split('.')[1])>=22),process.version,'Install Node >=22.22.0.');
 const executable=process.env.CODEX_BIN||'codex',version=spawnSync(executable,['--version'],{encoding:'utf8',timeout:5000});
 check('codex',version.status===0&&version.stdout.trim()===`codex-cli ${PROTOCOL_VERSION}`,{executable,expected:PROTOCOL_VERSION,actual:version.stdout?.trim().slice(0,100)||'unavailable'},'Install the exact supported Codex version; no automatic upgrade is performed.');
 try{const response=await fetch(`http://127.0.0.1:${SERVICE_PORT}/health`,{signal:AbortSignal.timeout(1500)});check('service',response.ok,await response.json(),'Run cteam service start.');}catch{check('service',false,'unreachable','Run cteam service start.');}
 if(project)try{validateConfig(JSON.parse(readFileSync(join(project,'.codex-teams','team.json'),'utf8')));check('project',true,project);}catch(e){check('project',false,classifyError(e),'Check the selected project and team.json.');}
 const codexHome=process.env.CODEX_HOME||join(homedir(),'.codex');
 check('integration',existsSync(join(codexHome,'config.toml')),{configPresent:existsSync(join(codexHome,'config.toml')),launchAgentPresent:existsSync(join(homedir(),'Library/LaunchAgents/com.codex-teams.service.plist')),note:'Presence only; run verify-install for isolated transport checks.'},'Review cteam install instructions.');
 return {package:pkg.version,nodeExecutable:process.execPath,stateDirectory:DATA_DIR,checks,authentication:'not probed; no authentication files read',modelTurns:0};
}
