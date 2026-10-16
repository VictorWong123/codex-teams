#!/usr/bin/env node
import http from "node:http";
import { readFileSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DATA_DIR, SERVICE_PORT } from "./constants.js";
import { ProjectStore, Registry } from "./db.js";
import { Orchestrator } from "./orchestrator.js";
import { json, now, readJson } from "./util.js";

const rootDir=join(fileURLToPath(new URL("..",import.meta.url)));
const registry=new Registry();
function openProject(ref){const p=typeof ref==="string"?registry.find(ref):ref;if(!p)throw new Error("Project not registered");const config=readJson(join(p.root,".codex-teams","team.json"));return new ProjectStore(p.root,config);}
const orchestrator=new Orchestrator({registry,openProject});
await orchestrator.start();

const clients=new Set();
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://127.0.0.1:${SERVICE_PORT}`);
    if(url.pathname==="/health")return send(res,200,{ok:true,version:"0.1.0"});
    if(!url.pathname.startsWith("/api/"))return staticFile(url.pathname,res);
    const origin=req.headers.origin;if(origin&&!new URL(origin).hostname.match(/^(127\.0\.0\.1|localhost)$/))throw status(403,"Invalid origin");
    const bearer=(req.headers.authorization||"").replace(/^Bearer /,"")||url.searchParams.get("token");if(bearer!==registry.authToken())throw status(401,"Unauthorized");
    if(url.pathname==="/api/events"){res.writeHead(200,{"content-type":"text/event-stream","cache-control":"no-cache","connection":"keep-alive"});clients.add(res);req.on("close",()=>clients.delete(res));return;}
    const body=await readBody(req), scoped=req.headers["x-codex-teams-agent"]?{agent:req.headers["x-codex-teams-agent"],goal:req.headers["x-codex-teams-goal"]||null,project:req.headers["x-codex-teams-project"],token:req.headers["x-codex-teams-scope-token"]||""}:null;
    if(scoped&&!orchestrator.verifyScope(scoped))throw status(403,"Invalid member scope");
    const route=url.pathname.slice(5).split("/").filter(Boolean), method=req.method;
    let result;
    if(route[0]==="projects"&&route.length===1&&method==="GET")result=registry.list();
    else {const project=body.project||url.searchParams.get("project")||scoped?.project;if(!project)throw status(400,"project is required");if(scoped&&project!==scoped.project)throw status(403,"Cross-project access denied");const s=openProject(project);try{result=await dispatch({route,method,body,s,scoped,url});}finally{s.close();}}
    broadcast({type:"change",at:now()});send(res,200,result);
  }catch(e){send(res,e.status||500,{error:e.message});}
});

async function dispatch({route,method,body,s,scoped,url}){
  if(scoped&&!routeAllowedToMember(route,method))throw status(403,"Member credentials cannot access human controls");
  if(route[0]==="status"&&method==="GET")return scoped?memberStatus(s,scoped):s.status();
  if(route[0]==="agents"&&method==="POST"){if(scoped)throw status(403,"Human control only");const a=s.saveAgent(body.agent);persistRoster(s);return a;}
  if(route[0]==="goals"&&route.length===1&&method==="POST"){if(scoped)throw status(403,"Human control only");return s.createGoal(body.prompt,body);}
  if(route[0]==="goals"&&route[2]==="participants"&&method==="POST")return s.addParticipant(route[1],body.agent);
  if(route[0]==="tasks"&&route.length===1&&method==="POST")return s.createTask(scoped?.goal||body.goalId,body);
  if(route[0]==="tasks"&&route[2]==="claim"&&method==="POST")return s.claimTask(route[1],scoped?.agent||body.agent,body.claimKey);
  if(route[0]==="tasks"&&route[2]==="verify"&&method==="POST")return s.verifyTask(route[1],scoped?.agent||body.agent);
  if(route[0]==="messages"&&method==="POST"){
    if(!body.goalId&&!scoped){const a=s.findAgent(body.recipient);const g=s.createGoal(body.body,{title:`Assignment for ${a.name}`,lead:a.id,participants:[a.id],idempotencyKey:body.idempotencyKey});return {assignment:g};}
    return s.sendMessage({goalId:scoped?.goal||body.goalId,sender:scoped?.agent||body.sender,recipient:body.recipient,body:body.body,actionable:body.actionable!==false,idempotencyKey:body.idempotencyKey});
  }
  if(route[0]==="notes"&&method==="POST"){const goalId=scoped?.goal||body.goalId;s.requireGoal(goalId);const n={id:crypto.randomUUID(),goalId,title:body.title,body:body.body,createdAt:now()};s.db.prepare("INSERT INTO notes VALUES(?,?,?,?,?)").run(n.id,n.goalId,n.title,n.body,n.createdAt);return n;}
  if(route[0]==="goals"&&route[2]==="complete"&&method==="POST"){const g=s.requireGoal(route[1]),a=s.findAgent(scoped?.agent||body.agent);if(g.lead_agent_id!==a.id)throw status(403,"Only the goal lead can complete it");const pending=s.row("SELECT count(*) n FROM tasks WHERE goal_id=? AND status!='verified'",g.id).n;if(pending)throw new Error("Every task must be verified before goal completion");if(!s.row("SELECT 1 FROM evidence WHERE goal_id=?",g.id))throw new Error("Goal requires captured evidence");s.db.prepare("UPDATE goals SET status='completed',completed_at=?,updated_at=? WHERE id=?").run(now(),now(),g.id);return {id:g.id,status:"completed"};}
  if(route[0]==="control"&&method==="POST"){if(scoped)throw status(403,"Human control only");return control(s,body);}
  if(route[0]==="approvals"&&route[2]==="resolve"&&method==="POST"){if(scoped)throw status(403,"Human control only");return orchestrator.resolveApproval(s,route[1],body.decision);}
  if(route[0]==="interrupt"&&method==="POST"){if(scoped)throw status(403,"Human control only");return orchestrator.interrupt(s,body.goalId,body.agent);}
  throw status(404,"Not found");
}
function routeAllowedToMember(route,method){return (route[0]==="status"&&method==="GET")||(["tasks","messages","notes"].includes(route[0])&&method==="POST")||(route[0]==="goals"&&route[2]==="complete"&&method==="POST");}
function memberStatus(s,scope){return {agents:s.listAgents().map(a=>({id:a.id,name:a.name,purpose:a.purpose,enabled:a.enabled})),tasks:s.rows("SELECT * FROM tasks WHERE goal_id=? ORDER BY created_at",scope.goal),messages:s.rows("SELECT * FROM messages WHERE goal_id=? AND (sender_agent_id=? OR recipient_agent_id=?) ORDER BY created_at",scope.goal,scope.agent,scope.agent),goal:s.row("SELECT id,title,status,lead_agent_id,turn_count,token_count FROM goals WHERE id=?",scope.goal)};}
function control(s,body){if(!["pause","resume","stop"].includes(body.action))throw new Error("Unknown control action");if(body.action==="stop"&&body.goalId){s.db.prepare("UPDATE goals SET status='stopped',updated_at=? WHERE id=?").run(now(),body.goalId);return {goalId:body.goalId,status:"stopped"};}s.config.paused=body.action==="pause";persistConfig(s);return {project:s.id,paused:s.config.paused};}
function persistRoster(s){s.config.agents=s.listAgents().map(({id,name,purpose,instructions,model,enabled})=>({id,name,purpose,instructions,model,enabled}));persistConfig(s);}
function persistConfig(s){writeFileSync(join(s.root,".codex-teams","team.json"),`${JSON.stringify(s.config,null,2)}\n`);}
function broadcast(data){for(const c of clients)c.write(`data: ${json(data)}\n\n`);}
function staticFile(path,res){const rel=path==="/"?"index.html":path.slice(1);if(rel.includes(".."))throw status(400,"Invalid path");const p=join(rootDir,"public",rel);const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8"}[extname(p)]||"application/octet-stream";try{res.writeHead(200,{"content-type":mime,"x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(readFileSync(p));}catch{send(res,404,{error:"Not found"});}}
async function readBody(req){if(req.method==="GET")return{};let raw="";for await(const c of req){raw+=c;if(raw.length>1_000_000)throw status(413,"Body too large");}return raw?JSON.parse(raw):{};}
function send(res,code,data){res.writeHead(code,{"content-type":"application/json; charset=utf-8","x-content-type-options":"nosniff"});res.end(json(data));}
function status(code,message){return Object.assign(new Error(message),{status:code});}

server.listen(SERVICE_PORT,"127.0.0.1",()=>console.log(`Codex Teams listening on http://127.0.0.1:${SERVICE_PORT}`));
async function shutdown(){server.close();await orchestrator.stop();process.exit(0);}process.on("SIGTERM",shutdown);process.on("SIGINT",shutdown);
