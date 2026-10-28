import {researchResults} from './evidence.js';
export function bindItem(s,turn,item,task){
 if(!task||!item.id||!turn.codex_turn_id||!['commandExecution','webSearch'].includes(item.type))return;
 s.db.prepare('INSERT OR IGNORE INTO item_bindings(thread_id,remote_turn_id,item_id,task_id,attempt) VALUES(?,?,?,?,?)').run(turn.thread_id,turn.codex_turn_id,item.id,task.id,task.attempt);
}
export function ingestItem(s,turn,item){
 if(!item.id)return false;const binding=s.row('SELECT * FROM item_bindings WHERE thread_id=? AND remote_turn_id=? AND item_id=?',turn.thread_id,turn.codex_turn_id,item.id);if(!binding||s.row('SELECT 1 FROM evidence WHERE turn_id=? AND item_id=?',turn.id,item.id))return false;
 let evidence;if(item.type==='commandExecution'&&Number.isInteger(item.exitCode))evidence={kind:'command',command:item.command||'',output:item.aggregatedOutput||'',exitCode:item.exitCode};
 else if(item.type==='webSearch'&&researchResults(item.results))evidence={kind:'research',output:JSON.stringify(item.results)};else return false;
 s.addEvidence({goalId:turn.goal_id,taskId:binding.task_id,turnId:turn.id,itemId:item.id,attempt:binding.attempt,...evidence});return true;
}
