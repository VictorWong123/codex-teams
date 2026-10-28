import {now,id,json,parse} from './util.js';
export function extendBudget(s,goalId,increments) {
 const goal=s.requireGoal(goalId),cfg=parse(goal.config_json,{}),before={...cfg.limits},after={...before};let changed=false;
 if(cfg.acceptanceCap||cfg.budgetLocked)throw new Error('This goal has a separately imposed budget cap');
 for(const key of ['turns','minutes','tokens'])if(increments[key]!==undefined){const n=increments[key];if(typeof n!=='number'||!Number.isFinite(n)||n<=0||(key!=='minutes'&&!Number.isSafeInteger(n)))throw new Error('Budget increments must be positive numbers (integer turns/tokens)');if(key==='tokens'&&before.tokens===null)throw new Error('Unlimited token budget cannot be extended');after[key]+=n;if(!Number.isFinite(after[key])||after[key]>(key==='tokens'?Number.MAX_SAFE_INTEGER:10000))throw new Error('Budget exceeds supported maximum');changed=true;}
 if(!changed)throw new Error('Supply at least one budget increment');cfg.limits=after;
 s.db.exec('BEGIN IMMEDIATE');try{s.db.prepare('UPDATE goals SET config_json=?,updated_at=? WHERE id=?').run(json(cfg),now(),goalId);s.event('goal.budget_extended',{before,after},goalId);s.db.exec('COMMIT');}catch(e){s.db.exec('ROLLBACK');throw e;}
 return {before,after,consumed:{turns:goal.turn_count,minutes:goal.active_ms/60000,tokens:goal.token_count},resumeRequired:true};
}
export function updateNote(s,noteId,action,input={}) {
 const old=s.row('SELECT * FROM notes WHERE id=?',noteId);if(!old)throw new Error('Note not found');
 const next={...old};if(action==='edit'){if(typeof input.title!=='string'||!input.title.trim()||typeof input.body!=='string'||!input.body.trim())throw new Error('Note title/body required');next.title=input.title;next.body=input.body;}else if(action==='archive')next.archived=1;else if(action==='unarchive')next.archived=0;else throw new Error('Unknown note action');
 s.db.exec('BEGIN IMMEDIATE');try{s.db.prepare('INSERT INTO note_revisions(note_id,title,body,archived,changed_at) VALUES(?,?,?,?,?)').run(old.id,old.title,old.body,old.archived,now());s.db.prepare('UPDATE notes SET title=?,body=?,archived=?,updated_at=? WHERE id=?').run(next.title,next.body,next.archived,now(),old.id);s.event('note.'+action,{noteId},old.goal_id);s.db.exec('COMMIT');}catch(e){s.db.exec('ROLLBACK');throw e;}return s.row('SELECT * FROM notes WHERE id=?',noteId);
}
