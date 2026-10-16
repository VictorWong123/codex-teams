import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR, SERVICE_PORT } from "./constants.js";

export async function api(path,{method="GET",body,scope}={}){
  const headers={authorization:`Bearer ${readFileSync(join(DATA_DIR,"token"),"utf8").trim()}`};
  if(body!==undefined)headers["content-type"]="application/json";
  if(scope){headers["x-codex-teams-agent"]=scope.agent;headers["x-codex-teams-goal"]=scope.goal||"";headers["x-codex-teams-project"]=scope.project;headers["x-codex-teams-scope-token"]=scope.token;}
  const res=await fetch(`http://127.0.0.1:${SERVICE_PORT}${path}`,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const data=await res.json().catch(()=>({error:res.statusText}));if(!res.ok)throw new Error(data.error||res.statusText);return data;
}
