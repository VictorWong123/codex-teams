export function migrate(db) {
 const version=db.prepare('PRAGMA user_version').get().user_version;
 if(version>1)throw new Error('State was written by a newer Codex Teams version');
 if(version===1)return;
 db.exec('BEGIN IMMEDIATE');
 try {
  const columns=[['agents','permission',"TEXT NOT NULL DEFAULT 'inherit'"],['goals','active_ms','INTEGER NOT NULL DEFAULT 0'],['goals','control_version','INTEGER NOT NULL DEFAULT 0'],['participants','workspace','TEXT'],['tasks','verification_requested','INTEGER NOT NULL DEFAULT 0'],['tasks','evidence_type',"TEXT NOT NULL DEFAULT 'test'"],['evidence','attempt','INTEGER NOT NULL DEFAULT 0'],['notes','archived','INTEGER NOT NULL DEFAULT 0'],['notes','updated_at','TEXT'],['evidence','item_id','TEXT']];
  for(const [table,column,type] of columns)if(!db.prepare(`PRAGMA table_info(${table})`).all().some(c=>c.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  db.exec(`CREATE TABLE note_revisions(id INTEGER PRIMARY KEY, note_id TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, archived INTEGER NOT NULL, changed_at TEXT NOT NULL);
   CREATE TABLE item_bindings(thread_id TEXT NOT NULL, remote_turn_id TEXT NOT NULL, item_id TEXT NOT NULL, task_id TEXT NOT NULL, attempt INTEGER NOT NULL, PRIMARY KEY(thread_id,remote_turn_id,item_id));
   CREATE UNIQUE INDEX evidence_item ON evidence(turn_id,item_id) WHERE item_id IS NOT NULL;
   CREATE INDEX turns_page ON turns(started_at,id);
   PRAGMA user_version=1;`);
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
}
