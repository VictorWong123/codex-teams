import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, SERVICE_PORT } from './constants.js';
export async function api(path,{method='GET',body,scope}={}){
 if(!scope&&process.env.CODEX_TEAMS_MEMBER_CONTEXT==='1')throw new Error('Human credentials unavailable inside orchestrated member context');
 const credential=scope?scope.token:readFileSync(join(DATA_DIR,'token'),'utf8').trim();
 const headers={authorization:`Bearer ${credential}`,'x-codex-teams-request':'1'};
 if(body!==undefined)headers['content-type']='application/json';
 if(scope){headers['x-codex-teams-agent']=scope.agent;headers['x-codex-teams-goal']=scope.goal;headers['x-codex-teams-project']=scope.project;}
 const res=await fetch(`http://127.0.0.1:${SERVICE_PORT}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(40000)});
 const data=await res.json().catch(()=>({error:res.statusText}));if(!res.ok)throw new Error(data.error||res.statusText);return data;
}
