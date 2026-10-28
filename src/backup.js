import {mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync,existsSync,renameSync,rmSync} from 'node:fs';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {DATA_DIR} from './constants.js';
import {validateConfig} from './config.js';
const hash=data=>createHash('sha256').update(data).digest('hex');
function regular(path){if(!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink())throw new Error('Backup files must be regular files');return readFileSync(path);}
export function storageUsage(root=DATA_DIR){const entries=[];function walk(path){for(const e of readdirSync(path,{withFileTypes:true})){if(e.isSymbolicLink())continue;const file=join(path,e.name);if(e.isDirectory())walk(file);else if(e.isFile())entries.push({path:relative(root,file),bytes:lstatSync(file).size});}}if(existsSync(root))walk(root);return {totalBytes:entries.reduce((n,e)=>n+e.bytes,0),files:entries};}
export function createBackup(registry,openProject,destination){
 destination=resolve(destination);if(existsSync(destination))throw new Error('Backup destination must not exist');
 const rel=relative(DATA_DIR,destination);if(!rel.startsWith('..')&&!isAbsolute(rel))throw new Error('Backup destination must be outside active state');
 mkdirSync(destination,{recursive:false,mode:0o700});const files=[];
 const save=(name,data)=>{const file=join(destination,name);writeFileSync(file,data,{mode:0o600,flag:'wx'});files.push({name,sha256:hash(data)});};
 try{registry.mutate(data=>{
  save('registry.json',JSON.stringify(data));
  for(const project of data.projects){const s=openProject(project);try{const name=project.id+'.sqlite';s.db.prepare('VACUUM INTO ?').run(join(destination,name));files.push({name,sha256:hash(regular(join(destination,name)))});save(project.id+'.config.json',JSON.stringify(s.config));}finally{s.close();}}
 });save('README.txt','Credentials, source workspaces and Codex-managed threads are NOT included. Restore projects remain inactive until reviewed.');
 writeFileSync(join(destination,'manifest.json.tmp'),JSON.stringify({version:1,createdAt:new Date().toISOString(),files}),{mode:0o600,flag:'wx'});renameSync(join(destination,'manifest.json.tmp'),join(destination,'manifest.json'));return {destination,complete:true,files:files.length};
 }catch(e){writeFileSync(join(destination,'INCOMPLETE'),'Backup failed; do not restore.',{mode:0o600});throw e;}
}
export function restoreBackup(source,destination){
 source=resolve(source);destination=resolve(destination);if(existsSync(destination))throw new Error('Restore destination must not exist');
 const manifest=JSON.parse(regular(join(source,'manifest.json')));if(manifest.version!==1||!Array.isArray(manifest.files)||existsSync(join(source,'INCOMPLETE')))throw new Error('Unsupported or incomplete backup');
 const contents=new Map();for(const entry of manifest.files){if(typeof entry.name!=='string'||!/^(registry\.json|README\.txt|[a-f0-9]+\.(sqlite|config\.json))$/.test(entry.name)||contents.has(entry.name))throw new Error('Invalid backup path');const bytes=regular(join(source,entry.name));if(hash(bytes)!==entry.sha256)throw new Error('Backup checksum mismatch');contents.set(entry.name,bytes);}
 const registry=JSON.parse(contents.get('registry.json'));if(!Array.isArray(registry.projects))throw new Error('Invalid registry');
 const stage=destination+'.restoring-'+randomUUID();mkdirSync(stage,{mode:0o700});
 try{mkdirSync(join(stage,'projects'));mkdirSync(join(stage,'restored-configs'));
  for(const p of registry.projects){if(p.id!==hash(p.root).slice(0,16)||!/^[a-f0-9]+$/.test(p.id)||typeof p.root!=='string'||!isAbsolute(p.root))throw new Error('Invalid project association');const config=contents.get(p.id+'.config.json'),bytes=contents.get(p.id+'.sqlite');if(!config||!bytes)throw new Error('Incomplete project backup');validateConfig(JSON.parse(config));mkdirSync(join(stage,'projects',p.id));const file=join(stage,'projects',p.id,'state.sqlite');writeFileSync(file,bytes,{mode:0o600});const db=new DatabaseSync(file);try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA user_version').get().user_version!==1)throw new Error('Invalid or unsupported state database');for(const table of ['goals','participants','tasks','notes','evidence','turns','events','approvals','messages','item_bindings','note_revisions'])if(!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table))throw new Error('Missing state table '+table);const required={goals:['id','status','config_json','control_version','active_ms','turn_count'],participants:['goal_id','agent_id','snapshot_json','thread_id','workspace','active_turn_id'],tasks:['id','goal_id','attempt','evidence_type'],notes:['id','goal_id','title','body','archived'],evidence:['id','goal_id','task_id','turn_id','attempt','item_id'],turns:['id','goal_id','thread_id','codex_turn_id','status'],item_bindings:['thread_id','remote_turn_id','item_id','task_id','attempt']};for(const [table,columns]of Object.entries(required)){const actual=db.prepare('PRAGMA table_info('+table+')').all().map(c=>c.name);if(columns.some(c=>!actual.includes(c)))throw new Error('Unsupported columns in '+table);}db.exec("UPDATE goals SET status='paused',control_version=control_version+1 WHERE status NOT IN ('completed','stopped','recovery_review');");}finally{db.close();}writeFileSync(join(stage,'restored-configs',p.id+'.json'),config,{mode:0o600});p.inactive=true;}
  writeFileSync(join(stage,'registry.json'),JSON.stringify(registry),{mode:0o600});if(existsSync(destination))throw new Error('Restore destination appeared during restore');renameSync(stage,destination);return {destination,projects:registry.projects.length,inactive:true,nextAction:'Start with CODEX_TEAMS_DATA pointing to this directory. Review original roots and restored-configs before explicitly activating projects.'};
 }catch(e){rmSync(stage,{recursive:true,force:true});throw e;}
}
