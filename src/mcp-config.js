import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,renameSync,rmSync,statSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
const SERVER='codex-teams';
function snapshot(path){try{return {text:readFileSync(path,'utf8'),mode:statSync(path).mode&0o777};}catch(e){if(e.code==='ENOENT')return {text:null,mode:0o600};throw e;}}
function headerKeys(text){const parts=text.match(/(?:"(?:\\.|[^"\\])*"|'[^']*'|[A-Za-z0-9_-]+)(?:\s*\.|\s*$)/g);if(!parts)return null;try{return parts.map(s=>{s=s.replace(/\s*\.\s*$/,'').trim();return s.startsWith('"')?JSON.parse(s):s.startsWith("'")?s.slice(1,-1):s;});}catch{return null;}}
// Recognize table boundaries without treating headers inside multiline strings
// or arrays as TOML tables. Full validity is checked by the official Codex CLI.
function sections(text){const lines=text.match(/[^\n]*(?:\n|$)/g).filter(Boolean),out=[];let quote=null,depth=0,offset=0;
 for(const line of lines){if(!quote&&depth===0){const match=line.trim().match(/^\[([^\n]+)\]\s*(?:#.*)?$/);if(match){if(out.length)out.at(-1).end=offset;out.push({start:offset,end:text.length,keys:headerKeys(match[1])});}}
  for(let i=0;i<line.length;i++){const c=line[i];if(quote){if(quote.length===3&&c===quote[0]){let end=i;while(line[end]===c)end++;if(end-i>=3)quote=null;i=end-1;}else if(quote.length===1&&c===quote){quote=null;}else if(quote.includes('"')&&c==='\\')i++;continue;}if(c==='#')break;if(c==='"'||c==="'"){if(line.slice(i,i+3)===c.repeat(3)){quote=c.repeat(3);i+=2;}else quote=c;continue;}if(c==='['||c==='{')depth++;if(c===']'||c==='}')depth--;}
  offset+=line.length;
 }return out;}
function owned(section){return section.keys?.[0]==='mcp_servers'&&section.keys?.[1]===SERVER;}
function scopedBody(text,block){const body=text.slice(block.start,block.end),lines=body.match(/[^\n]*(?:\n|$)/g).filter(Boolean);let keep=body.length;while(lines.length&&/^[ \t]*(?:#[^\n]*)?\n?$/.test(lines.at(-1)))keep-=lines.pop().length;return {body:body.slice(0,keep),end:block.start+keep};}
export function replaceOwnedMcpSection(original,registered){let result=original;const blocks=sections(original).filter(owned);for(const block of blocks.reverse()){const {end}=scopedBody(original,block);result=result.slice(0,block.start)+result.slice(end);}
 const additions=sections(registered).filter(owned).map(block=>scopedBody(registered,block).body).join('');if(additions)result+=(result&&!result.endsWith('\n')?'\n':'')+additions;return result;}
export function updateMcpConfiguration({configPath,codex=process.env.CODEX_BIN||'codex',remove=false,command=process.execPath,args,execute}={}){
 const before=snapshot(configPath),stage=mkdtempSync(join(tmpdir(),'cteam-codex-config-'));let lock,tmp;
 const run=execute||((argv,env)=>{const r=spawnSync(codex,argv,{env,encoding:'utf8'});if(r.status!==0)throw new Error(`Codex MCP ${argv[1]} validation failed; original configuration preserved`);return r.stdout;});
 const env={...process.env,CODEX_HOME:stage};
 try{
  writeFileSync(join(stage,'config.toml'),before.text||'',{mode:0o600});
  run(remove?['mcp','remove',SERVER]:['mcp','add',SERVER,'--',command,...args],env);
  const registered=readFileSync(join(stage,'config.toml'),'utf8');
  const candidate=replaceOwnedMcpSection(before.text||'',registered);
  writeFileSync(join(stage,'config.toml'),candidate,{mode:0o600});
  const entries=JSON.parse(run(['mcp','list','--json'],env));const entry=entries.find(e=>e.name===SERVER),transport=entry?.transport||entry;
  if(remove?entry:!transport||transport.command!==command||JSON.stringify(transport.args)!==JSON.stringify(args))throw new Error('Scoped MCP configuration validation failed; original configuration preserved');
  mkdirSync(dirname(configPath),{recursive:true,mode:0o700});
  const lockPath=`${configPath}.cteam-lock`,fd=openSync(lockPath,'wx',0o600);closeSync(fd);lock=lockPath;
  if(snapshot(configPath).text!==before.text)throw new Error('Codex configuration changed concurrently; no changes committed. Retry after reviewing the edit');
  const tmpPath=`${configPath}.cteam-${process.pid}.tmp`,tmpFd=openSync(tmpPath,'wx',before.mode);tmp=tmpPath;try{writeFileSync(tmpFd,candidate);}finally{closeSync(tmpFd);}
  // No awaited/external operation between this comparison and atomic rename.
  if(snapshot(configPath).text!==before.text)throw new Error('Codex configuration changed concurrently; no changes committed. Retry after reviewing the edit');
  renameSync(tmp,configPath);tmp=null;return {preservedUnrelatedText:true};
 }finally{if(tmp)try{unlinkSync(tmp);}catch{}if(lock)try{unlinkSync(lock);}catch{}rmSync(stage,{recursive:true,force:true});}
}
