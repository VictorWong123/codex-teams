import {schema} from './db.js';
import {migrate} from './migrations.js';
import {constants,openSync,closeSync,fstatSync,readSync,writeSync,realpathSync,mkdirSync,readFileSync,writeFileSync,readdirSync,lstatSync,existsSync,renameSync,rmSync} from 'node:fs';
import {dirname,basename,sep,join,resolve,relative,isAbsolute} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {createHash,randomUUID} from 'node:crypto';
import {DATA_DIR} from './constants.js';
import {validateConfig} from './config.js';
const hash=data=>createHash('sha256').update(data).digest('hex');
function regular(path){if(!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink())throw new Error('Backup files must be regular files');return readFileSync(path);}
// Bound database I/O memory to one chunk, including verification of copied bytes.
function digestFile(path,destination){
 const input=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);let output;
 try{if(!fstatSync(input).isFile())throw new Error('Backup files must be regular files');if(destination)output=openSync(destination,'wx',0o600);const hash=createHash('sha256'),buffer=Buffer.allocUnsafe(64*1024);let size;
  while((size=readSync(input,buffer,0,buffer.length,null))>0){hash.update(buffer.subarray(0,size));if(output!==undefined){let written=0;while(written<size)written+=writeSync(output,buffer,written,size-written);}}
  return hash.digest('hex');
 }finally{closeSync(input);if(output!==undefined)closeSync(output);}
}
export function storageUsage(root=DATA_DIR){const entries=[];function walk(path){for(const e of readdirSync(path,{withFileTypes:true})){if(e.isSymbolicLink())continue;const file=join(path,e.name);if(e.isDirectory())walk(file);else if(e.isFile())entries.push({path:relative(root,file),bytes:lstatSync(file).size});}}if(existsSync(root))walk(root);return {totalBytes:entries.reduce((n,e)=>n+e.bytes,0),files:entries};}
export function createBackup(registry,openProject,destination){
 destination=join(realpathSync(dirname(resolve(destination))),basename(destination));if(existsSync(destination))throw new Error('Backup destination must not exist');
 const rel=relative(realpathSync(DATA_DIR),destination);if(!(rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel)))throw new Error('Backup destination must be outside active state');
 mkdirSync(destination,{recursive:false,mode:0o700});const files=[];
 const save=(name,data)=>{const file=join(destination,name);writeFileSync(file,data,{mode:0o600,flag:'wx'});files.push({name,sha256:hash(data)});};
 try{registry.mutate(data=>{
  save('registry.json',JSON.stringify(data));
  for(const project of data.projects){const s=openProject(project);try{const name=project.id+'.sqlite';s.db.prepare('VACUUM INTO ?').run(join(destination,name));files.push({name,sha256:digestFile(join(destination,name))});save(project.id+'.config.json',JSON.stringify(s.config));}finally{s.close();}}
 });save('README.txt','Credentials, source workspaces and Codex-managed threads are NOT included. Restore projects remain inactive until reviewed.');
 writeFileSync(join(destination,'manifest.json.tmp'),JSON.stringify({version:1,createdAt:new Date().toISOString(),files}),{mode:0o600,flag:'wx'});renameSync(join(destination,'manifest.json.tmp'),join(destination,'manifest.json'));return {destination,complete:true,files:files.length};
 }catch(e){writeFileSync(join(destination,'INCOMPLETE'),'Backup failed; do not restore.',{mode:0o600});throw e;}
}
export function restoreBackup(source,destination){
 source=resolve(source);destination=resolve(destination);if(existsSync(destination))throw new Error('Restore destination must not exist');
 const manifest=JSON.parse(regular(join(source,'manifest.json')));if(manifest.version!==1||!Array.isArray(manifest.files)||existsSync(join(source,'INCOMPLETE')))throw new Error('Unsupported or incomplete backup');
 const contents=new Map();for(const entry of manifest.files){if(typeof entry.name!=='string'||!/^(registry\.json|README\.txt|[a-f0-9]+\.(sqlite|config\.json))$/.test(entry.name)||contents.has(entry.name))throw new Error('Invalid backup path');const path=join(source,entry.name);if(digestFile(path)!==entry.sha256)throw new Error('Backup checksum mismatch');contents.set(entry.name,{path,sha256:entry.sha256});}
 const metadata=name=>{const entry=contents.get(name);if(!entry)throw new Error('Incomplete project backup');const bytes=regular(entry.path);if(hash(bytes)!==entry.sha256)throw new Error('Backup checksum mismatch');return bytes;};
 const registry=JSON.parse(metadata('registry.json'));if(!Array.isArray(registry.projects))throw new Error('Invalid registry');
 const stage=destination+'.restoring-'+randomUUID();mkdirSync(stage,{mode:0o700});
 try{mkdirSync(join(stage,'projects'));mkdirSync(join(stage,'restored-configs'));
  for(const p of registry.projects){if(p.id!==hash(p.root).slice(0,16)||!/^[a-f0-9]+$/.test(p.id)||typeof p.root!=='string'||!isAbsolute(p.root))throw new Error('Invalid project association');const config=metadata(p.id+'.config.json'),bytes=contents.get(p.id+'.sqlite');if(!config||!bytes)throw new Error('Incomplete project backup');validateConfig(JSON.parse(config));mkdirSync(join(stage,'projects',p.id));const file=join(stage,'projects',p.id,'state.sqlite');if(digestFile(bytes.path,file)!==bytes.sha256)throw new Error('Backup checksum mismatch');const db=new DatabaseSync(file);try{if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok'||db.prepare('PRAGMA user_version').get().user_version!==1)throw new Error('Invalid or unsupported state database');validateSchema(db);db.exec("UPDATE goals SET status='paused',control_version=control_version+1 WHERE status NOT IN ('completed','stopped','recovery_review');");}finally{db.close();}writeFileSync(join(stage,'restored-configs',p.id+'.json'),config,{mode:0o600});p.inactive=true;}
  writeFileSync(join(stage,'registry.json'),JSON.stringify(registry),{mode:0o600});if(existsSync(destination))throw new Error('Restore destination appeared during restore');renameSync(stage,destination);return {destination,projects:registry.projects.length,inactive:true,nextAction:'Start with CODEX_TEAMS_DATA pointing to this directory. Review original roots and restored-configs before explicitly activating projects.'};
 }catch(e){rmSync(stage,{recursive:true,force:true});throw e;}
}

function validateSchema(db){const expected=new DatabaseSync(':memory:');try{expected.exec(schema);migrate(expected);const tables=expected.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);const actual=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);if(JSON.stringify(actual)!==JSON.stringify(tables)||db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('trigger','view')").get())throw new Error('Unsupported state schema');for(const table of tables){const columns=connection=>connection.prepare('PRAGMA table_info('+table+')').all().map(({name,type,notnull,pk,dflt_value})=>({name,type,notnull,pk,dflt_value})).sort((a,b)=>a.name.localeCompare(b.name));if(JSON.stringify(columns(db))!==JSON.stringify(columns(expected)))throw new Error('Unsupported columns in '+table);for(const index of expected.prepare('PRAGMA index_list('+table+')').all()){const actualIndex=db.prepare('PRAGMA index_list('+table+')').all().find(i=>i.name===index.name);if(!actualIndex||actualIndex.unique!==index.unique||actualIndex.partial!==index.partial)throw new Error('Missing or invalid state index');const definition=connection=>connection.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND name=?").get(index.name)?.sql?.replace(/\s+/g,' ').trim().toLowerCase();if(definition(db)!==definition(expected))throw new Error('Invalid state index definition');const fields=connection=>connection.prepare('PRAGMA index_info('+index.name+')').all().map(i=>i.name);if(JSON.stringify(fields(db))!==JSON.stringify(fields(expected)))throw new Error('Invalid state index fields');}}}finally{expected.close();}}
