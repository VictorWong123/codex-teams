import { constants, lstatSync, fstatSync, mkdirSync, openSync, closeSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export const nativeSkillPath=resolve(import.meta.dirname,'../plugins/codex-teams-native/skills/codex-teams-native/SKILL.md');
export function nativeInstructions(){return readFileSync(nativeSkillPath,'utf8');}

function scopeRoot({scope,project,home=homedir()}={}){
 if(!['user','project'].includes(scope))throw new Error('Choose --scope user or --scope project');
 if(scope==='project'&&!project)throw new Error('Project scope requires an explicit --project path');
 if(scope==='user'&&project)throw new Error('--project requires --scope project');
 const root=realpathSync(resolve(scope==='user'?home:project));
 if(!lstatSync(root).isDirectory())throw new Error('Skill scope root must be a directory');
 return root;
}

// Filesystem evidence only: no login, environment inference or host-tool probe.
export function nativeStatus(options={}){
 const root=scopeRoot(options),parts=['.agents','skills','codex-teams-native','SKILL.md'];
 const report={mode:'native',scope:options.scope,path:join(root,...parts),installation:'missing',execution:'not-started',capability:'check-in-chat',lifecycle:'active-task-only'};
 let path=root;
 for(let i=0;i<parts.length;i++){
  path=join(path,parts[i]);let stat;
  try{stat=lstatSync(path);}catch(e){if(e.code==='ENOENT')return report;throw e;}
  if(stat.isSymbolicLink()||(i<parts.length-1?!stat.isDirectory():!stat.isFile()))return {...report,installation:'unsafe-path'};
 }
 const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const stat=fstatSync(fd),content=nativeInstructions();
  if(!stat.isFile())return {...report,installation:'unsafe-path'};
  report.installation=stat.size===Buffer.byteLength(content)&&readFileSync(fd,'utf8')===content?'current':'different';
 }finally{closeSync(fd);}
 return report;
}

// Installs instructions only. Host capabilities must be checked in the chat.
export function installNativeSkill(options={}){
 const root=scopeRoot(options);
 let dir=root;
 for(const part of ['.agents','skills','codex-teams-native']){
  dir=join(dir,part);
  try{mkdirSync(dir,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}
  const stat=lstatSync(dir);
  if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error(`Refusing non-directory or symlink skill path: ${dir}`);
 }
 const path=join(dir,'SKILL.md'),content=nativeInstructions();let fd;
 try{fd=openSync(path,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);}
 catch(e){
  if(e.code!=='EEXIST')throw e;
  const stat=lstatSync(path);
  if(!stat.isFile()||stat.isSymbolicLink())throw new Error('Refusing nonregular or symlinked skill file');
  if(readFileSync(path,'utf8')!==content)throw new Error('Existing skill differs; preserve it and review the update manually');
  return {installed:true,changed:false,path,execution:'not-started',capability:'check-in-chat'};
 }
 try{writeFileSync(fd,content);}finally{closeSync(fd);}
 return {installed:true,changed:true,path,execution:'not-started',capability:'check-in-chat'};
}
