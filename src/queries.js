import {revision} from './workflows.js';
const collections={conversations:['turns','started_at',['prompt','output']],events:['events','created_at',['type','data_json']],messages:['messages','created_at',['body']],evidence:['evidence','created_at',['command','output']],goals:['goals','created_at',['title','prompt']],tasks:['tasks','created_at',['title','description']],notes:['notes','created_at',['title','body']]};
export function page(s,kind,query={}) {
 const def=collections[kind];if(!def)throw new Error('Unknown collection');const [table,time,search]=def,limit=Number(query.limit||50);if(!Number.isInteger(limit)||limit<1||limit>200)throw new Error('limit must be 1–200');
 const clauses=[],params=[],columns=s.rows(`PRAGMA table_info(${table})`).map(c=>c.name),filters={project:s.id,kind,goal:query.goal||null,agent:query.agent||null,status:query.status||null,search:query.search||''};
 if(query.goal){clauses.push(`${table==='goals'?'id':'goal_id'}=?`);params.push(query.goal);}
 if(query.agent){const column=columns.includes('agent_id')?'agent_id':columns.includes('owner_agent_id')?'owner_agent_id':null;if(!column)throw new Error('Agent filtering is unavailable for this collection');clauses.push(`${column}=?`);params.push(query.agent);}
 if(query.status){if(!columns.includes('status'))throw new Error('Status filtering is unavailable for this collection');clauses.push('status=?');params.push(query.status);}
 if(query.search){clauses.push('('+search.map(c=>`${c} LIKE ? ESCAPE '\\'`).join(' OR ')+')');params.push(...search.map(()=>'%'+query.search.replace(/[\\%_]/g,'\\$&')+'%'));}
 if(query.cursor){let c;try{c=JSON.parse(Buffer.from(query.cursor,'base64url').toString());}catch{throw new Error('Invalid cursor');}if(c.filter!==revision(filters)||typeof c.time!=='string'||!['string','number'].includes(typeof c.id))throw new Error('Cursor does not match filters');clauses.push(`(${time}<? OR (${time}=? AND id<?))`);params.push(c.time,c.time,c.id);}
 const rows=s.rows(`SELECT * FROM ${table}${clauses.length?' WHERE '+clauses.join(' AND '):''} ORDER BY ${time} DESC,id DESC LIMIT ?`,...params,limit+1),more=rows.length>limit,items=rows.slice(0,limit),last=items.at(-1);
 return {items,nextCursor:more?Buffer.from(JSON.stringify({filter:revision(filters),time:last[time],id:last.id})).toString('base64url'):null};
}
export function goalSummary(s,goalId) {
 const goal=s.requireGoal(goalId),cfg=JSON.parse(goal.config_json),participants=s.rows('SELECT * FROM participants WHERE goal_id=?',goalId),tasks=s.rows('SELECT * FROM tasks WHERE goal_id=?',goalId),approvals=s.rows("SELECT * FROM approvals WHERE goal_id=? AND status='pending'",goalId);
 return {goal,limits:cfg.limits,baseline:cfg.baseline||null,participants,tasks,approvals,blocker:approvals.length?'approval':!['queued','running','completed'].includes(goal.status)?goal.status:tasks.some(t=>t.status==='pending'&&JSON.parse(t.depends_json).some(id=>tasks.find(x=>x.id===id)?.status!=='verified'))?'dependencies':null};
}
export function handoff(s,goalId) {
 const summary=goalSummary(s,goalId);return {...summary,evidence:s.rows('SELECT * FROM evidence WHERE goal_id=? ORDER BY created_at,id',goalId),workspaces:summary.participants.map(p=>({agent:JSON.parse(p.snapshot_json).name,path:p.workspace,branch:p.workspace&&p.workspace!==s.root?`codex-teams/${goalId}/${p.agent_id}`:null,base:summary.baseline?.sha||null})),integration:'Inspect each listed workspace and branch, review the diff and captured evidence, then integrate only the changes you approve. No automatic merge or cleanup is performed.',cost:'unknown'};
}
export function queueReason(s,g,o){
 if(s.config.paused)return 'Project paused';
 if(!['queued','running'].includes(g.status))return g.status;
 if(s.row("SELECT 1 FROM approvals WHERE goal_id=? AND status='pending'",g.id))return 'Waiting for human approval';
 const active=[...o.active.values()];if(active.some(a=>a.goal===g.id))return 'Participant running';
 if(active.length>=o.registry.concurrency())return 'Waiting for service capacity';
 if(active.filter(a=>a.project===s.id).length>=s.config.limits.projectConcurrency)return 'Waiting for project capacity';
 if(s.row("SELECT 1 FROM participants WHERE goal_id=? AND status IN ('running','starting')",g.id))return 'Waiting for busy participant';
 const tasks=s.rows("SELECT * FROM tasks WHERE goal_id=? AND status='pending'",g.id);
 if(tasks.length&&tasks.every(t=>JSON.parse(t.depends_json).some(id=>s.task(id)?.status!=='verified')))return 'Waiting for dependencies';
 return g.status==='queued'||tasks.length?'Ready for scheduling':'Waiting for an actionable message or lead review';
}
