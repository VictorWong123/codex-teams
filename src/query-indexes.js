// Additive, nonunique indexes: no row changes or schema-version bump. Keeping
// these separate from required schema lets older version-1 backups still restore.
export function ensureQueryIndexes(db){
 db.exec(`
  CREATE INDEX IF NOT EXISTS tasks_goal_status ON tasks(goal_id,status);
  CREATE INDEX IF NOT EXISTS approvals_goal_status ON approvals(goal_id,status);
  CREATE INDEX IF NOT EXISTS approvals_thread_turn_status ON approvals(thread_id,turn_id,status);
  CREATE INDEX IF NOT EXISTS evidence_goal ON evidence(goal_id);
  CREATE INDEX IF NOT EXISTS evidence_task_attempt ON evidence(task_id,attempt);
  CREATE INDEX IF NOT EXISTS turns_thread_remote ON turns(thread_id,codex_turn_id);
 `);
}
