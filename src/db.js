import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { DATA_DIR } from "./constants.js";
import { ensureDir, id, json, now, parse, projectId, token } from "./util.js";

const schema = `
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS agents(id TEXT PRIMARY KEY,name TEXT UNIQUE NOT NULL,purpose TEXT NOT NULL,instructions TEXT NOT NULL,model TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS goals(id TEXT PRIMARY KEY,title TEXT NOT NULL,prompt TEXT NOT NULL,status TEXT NOT NULL,lead_agent_id TEXT NOT NULL,config_json TEXT NOT NULL,turn_count INTEGER NOT NULL DEFAULT 0,token_count INTEGER NOT NULL DEFAULT 0,started_at TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,completed_at TEXT);
CREATE TABLE IF NOT EXISTS participants(goal_id TEXT NOT NULL,agent_id TEXT NOT NULL,snapshot_json TEXT NOT NULL,thread_id TEXT,status TEXT NOT NULL DEFAULT 'idle',active_turn_id TEXT,last_event_at TEXT,PRIMARY KEY(goal_id,agent_id));
CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY,goal_id TEXT NOT NULL,title TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL,owner_agent_id TEXT,depends_json TEXT NOT NULL,criteria TEXT NOT NULL,evidence_required INTEGER NOT NULL DEFAULT 1,attempt INTEGER NOT NULL DEFAULT 0,claim_key TEXT UNIQUE,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,goal_id TEXT,sender_agent_id TEXT,recipient_agent_id TEXT NOT NULL,body TEXT NOT NULL,actionable INTEGER NOT NULL DEFAULT 1,status TEXT NOT NULL DEFAULT 'queued',idempotency_key TEXT UNIQUE,created_at TEXT NOT NULL,delivered_at TEXT);
CREATE TABLE IF NOT EXISTS turns(id TEXT PRIMARY KEY,goal_id TEXT,agent_id TEXT NOT NULL,thread_id TEXT NOT NULL,codex_turn_id TEXT,status TEXT NOT NULL,prompt TEXT NOT NULL,output TEXT NOT NULL DEFAULT '',usage_json TEXT,started_at TEXT NOT NULL,finished_at TEXT,uncertain INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,goal_id TEXT,agent_id TEXT,type TEXT NOT NULL,data_json TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence(id TEXT PRIMARY KEY,goal_id TEXT NOT NULL,task_id TEXT NOT NULL,turn_id TEXT NOT NULL,kind TEXT NOT NULL,command TEXT,output TEXT NOT NULL,exit_code INTEGER,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY,rpc_id TEXT NOT NULL,goal_id TEXT,agent_id TEXT NOT NULL,thread_id TEXT NOT NULL,turn_id TEXT,method TEXT NOT NULL,params_json TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at TEXT NOT NULL,resolved_at TEXT);
CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY,goal_id TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS idempotency(key TEXT PRIMARY KEY,result_json TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_agent_id,status);
CREATE INDEX IF NOT EXISTS idx_events_goal ON events(goal_id,id);
CREATE INDEX IF NOT EXISTS idx_turns_status ON turns(status);
`;

export class ProjectStore {
  constructor(root, config) {
    this.root = root; this.config = config; this.id = projectId(root);
    const dir = ensureDir(join(DATA_DIR, "projects", this.id));
    this.db = new DatabaseSync(join(dir, "state.sqlite")); this.db.exec(schema);
    this.syncRoster(config.agents || []);
  }
  syncRoster(agents) {
    const stmt = this.db.prepare(`INSERT INTO agents(id,name,purpose,instructions,model,enabled,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(name) DO UPDATE SET purpose=excluded.purpose,instructions=excluded.instructions,model=excluded.model,enabled=excluded.enabled,updated_at=excluded.updated_at`);
    for (const a of agents) { const ts=now(); stmt.run(a.id||id(),a.name,a.purpose||"",a.instructions||"",a.model||this.config.defaultModel,a.enabled===false?0:1,ts,ts); }
  }
  rows(sql,...args) { return this.db.prepare(sql).all(...args); }
  row(sql,...args) { return this.db.prepare(sql).get(...args); }
  event(type,data={},goalId=null,agentId=null) { this.db.prepare("INSERT INTO events(goal_id,agent_id,type,data_json,created_at) VALUES(?,?,?,?,?)").run(goalId,agentId,type,json(data),now()); }
  listAgents() { return this.rows("SELECT * FROM agents ORDER BY created_at").map(agent); }
  saveAgent(input) {
    if (!input.name?.trim()) throw new Error("Agent name is required");
    const existing=this.row("SELECT * FROM agents WHERE id=? OR name=?",input.id||"",input.name);
    const agentId=existing?.id||id(), ts=now();
    this.db.prepare(`INSERT INTO agents(id,name,purpose,instructions,model,enabled,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,purpose=excluded.purpose,instructions=excluded.instructions,model=excluded.model,enabled=excluded.enabled,updated_at=excluded.updated_at`).run(agentId,input.name,input.purpose||"",input.instructions||"",input.model||this.config.defaultModel,input.enabled===false?0:1,existing?.created_at||ts,ts);
    return agent(this.row("SELECT * FROM agents WHERE id=?",agentId));
  }
  createGoal(prompt,{title=prompt.slice(0,80),lead,participants,idempotencyKey}={}) {
    if (idempotencyKey) { const old=this.row("SELECT result_json FROM idempotency WHERE key=?",idempotencyKey); if(old) return parse(old.result_json); }
    const agents=this.listAgents().filter(a=>a.enabled); if(!agents.length) throw new Error("Project has no enabled agents");
    const leadAgent=agents.find(a=>a.id===lead||a.name===lead)||agents.find(a=>a.name==="coordinator")||agents[0];
    const selected=participants?.length?agents.filter(a=>participants.includes(a.id)||participants.includes(a.name)):agents;
    if(!selected.some(a=>a.id===leadAgent.id)) selected.unshift(leadAgent);
    const goalId=id(), ts=now(), limits={...this.config.limits};
    this.db.exec("BEGIN IMMEDIATE"); try {
      this.db.prepare("INSERT INTO goals(id,title,prompt,status,lead_agent_id,config_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").run(goalId,title,prompt,"queued",leadAgent.id,json({agents:selected,limits}),ts,ts);
      const s=this.db.prepare("INSERT INTO participants(goal_id,agent_id,snapshot_json,status) VALUES(?,?,?,'idle')"); for(const a of selected)s.run(goalId,a.id,json(a));
      const result={id:goalId,title,prompt,status:"queued",lead:leadAgent.name,participants:selected.map(a=>a.name)};
      if(idempotencyKey)this.db.prepare("INSERT INTO idempotency VALUES(?,?,?)").run(idempotencyKey,json(result),ts);
      this.db.exec("COMMIT"); this.event("goal.created",result,goalId); return result;
    } catch(e){this.db.exec("ROLLBACK");throw e;}
  }
  addParticipant(goalId,agentRef) { const a=this.findAgent(agentRef); const g=this.requireGoal(goalId); this.db.prepare("INSERT OR IGNORE INTO participants(goal_id,agent_id,snapshot_json,status) VALUES(?,?,?,'idle')").run(g.id,a.id,json(a)); this.event("participant.added",{agent:a.name},g.id,a.id); return a; }
  createTask(goalId,input) { this.requireGoal(goalId); const owner=input.owner?this.findAgent(input.owner):null; const task={id:id(),goalId,title:input.title,description:input.description||"",status:"pending",ownerAgentId:owner?.id||null,depends:input.depends||[],criteria:input.criteria||"Concrete test or inspection evidence",evidenceRequired:input.evidenceRequired!==false}; this.db.prepare("INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,0,NULL,?,?)").run(task.id,goalId,task.title,task.description,task.status,task.ownerAgentId,json(task.depends),task.criteria,task.evidenceRequired?1:0,now(),now()); this.event("task.created",task,goalId,owner?.id); return task; }
  claimTask(taskId,agentRef,claimKey) { const a=this.findAgent(agentRef); const t=this.row("SELECT * FROM tasks WHERE id=?",taskId); if(!t)throw new Error("Task not found"); const deps=parse(t.depends_json,[]); if(deps.some(d=>this.row("SELECT status FROM tasks WHERE id=?",d)?.status!=="verified")) throw new Error("Task dependencies are not verified"); const info=this.db.prepare("UPDATE tasks SET owner_agent_id=?,status='running',claim_key=?,attempt=attempt+1,updated_at=? WHERE id=? AND status IN ('pending','blocked')").run(a.id,claimKey||id(),now(),taskId); if(!info.changes)throw new Error("Task already claimed"); return this.task(taskId); }
  addEvidence(input) { const t=this.row("SELECT * FROM tasks WHERE id=? AND goal_id=?",input.taskId,input.goalId); const turn=this.row("SELECT * FROM turns WHERE id=? AND goal_id=?",input.turnId,input.goalId); if(!t||!turn)throw new Error("Evidence must reference current goal task and captured turn"); if(input.kind==="command" && (input.command==null||input.exitCode==null))throw new Error("Command evidence requires command and exitCode"); const e={id:id(),...input}; this.db.prepare("INSERT INTO evidence VALUES(?,?,?,?,?,?,?,?,?)").run(e.id,e.goalId,e.taskId,e.turnId,e.kind,e.command||null,e.output||"",e.exitCode??null,now()); return e; }
  verifyTask(taskId,leadRef) { const t=this.row("SELECT * FROM tasks WHERE id=?",taskId); if(!t)throw new Error("Task not found"); const g=this.requireGoal(t.goal_id), lead=this.findAgent(leadRef); if(g.lead_agent_id!==lead.id)throw new Error("Only this goal's lead can verify tasks"); if(t.evidence_required&&!this.row("SELECT 1 FROM evidence WHERE task_id=?",taskId))throw new Error("Concrete captured evidence is required"); this.db.prepare("UPDATE tasks SET status='verified',updated_at=? WHERE id=?").run(now(),taskId); this.event("task.verified",{taskId},g.id,lead.id); return this.task(taskId); }
  sendMessage({goalId=null,sender=null,recipient,body,actionable=true,idempotencyKey}) { const to=this.findAgent(recipient), from=sender?this.findAgent(sender):null; if(goalId){this.requireGoal(goalId); if(!this.row("SELECT 1 FROM participants WHERE goal_id=? AND agent_id=?",goalId,to.id))throw new Error("Recipient is not participating in this goal");} const key=idempotencyKey||id(); const old=this.row("SELECT * FROM messages WHERE idempotency_key=?",key); if(old)return message(old); const m={id:id(),goalId,senderAgentId:from?.id||null,recipientAgentId:to.id,body,actionable:!!actionable,status:"queued",idempotencyKey:key,createdAt:now()}; this.db.prepare("INSERT INTO messages VALUES(?,?,?,?,?,?,?,?,?,NULL)").run(m.id,m.goalId,m.senderAgentId,m.recipientAgentId,m.body,m.actionable?1:0,m.status,m.idempotencyKey,m.createdAt); this.event("message.queued",m,goalId,to.id); return m; }
  findAgent(ref) { const a=this.row("SELECT * FROM agents WHERE id=? OR name=?",ref,ref); if(!a)throw new Error(`Agent not found: ${ref}`); return agent(a); }
  requireGoal(goalId){const g=this.row("SELECT * FROM goals WHERE id=?",goalId);if(!g)throw new Error("Goal not found");return g;}
  task(taskId){const t=this.row("SELECT * FROM tasks WHERE id=?",taskId);return {...t,depends:parse(t.depends_json,[])};}
  status(){ return {project:{id:this.id,root:this.root,name:this.config.name||this.root.split("/").at(-1),paused:!!this.config.paused},agents:this.listAgents(),goals:this.rows("SELECT * FROM goals ORDER BY created_at DESC"),tasks:this.rows("SELECT * FROM tasks ORDER BY created_at DESC"),messages:this.rows("SELECT * FROM messages ORDER BY created_at DESC LIMIT 200").map(message),approvals:this.rows("SELECT * FROM approvals WHERE status='pending' ORDER BY created_at"),notes:this.rows("SELECT * FROM notes ORDER BY created_at DESC"),events:this.rows("SELECT * FROM events ORDER BY id DESC LIMIT 200").map(e=>({...e,data:parse(e.data_json,{})}))}; }
  close(){this.db.close();}
}

export class Registry {
  constructor(){ensureDir(DATA_DIR);this.path=join(DATA_DIR,"registry.json");this.tokenPath=join(DATA_DIR,"token");if(!existsSync(this.path))writeFileSync(this.path,json({projects:[]}));if(!existsSync(this.tokenPath)){writeFileSync(this.tokenPath,token(),{mode:0o600});}chmodSync(this.tokenPath,0o600);}
  authToken(){return readFileSync(this.tokenPath,"utf8").trim();}
  data(){return JSON.parse(readFileSync(this.path,"utf8"));}
  register(root){const data=this.data(), pid=projectId(root);const old=data.projects.find(p=>p.id===pid);if(!old)data.projects.push({id:pid,root,createdAt:now()});writeFileSync(this.path,json(data),{mode:0o600});return old||data.projects.at(-1);}
  list(){return this.data().projects;}
  find(value){return this.list().find(p=>p.id===value||p.root===value);}
}

function agent(a){return {...a,enabled:!!a.enabled};}
function message(m){return {...m,actionable:!!m.actionable};}
