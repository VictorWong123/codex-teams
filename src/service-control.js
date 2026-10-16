import { readFileSync, lstatSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

export const OWNED_MARKER='codex-teams-owned-v1';
const LABEL='com.codex-teams.service';

// Injectable OS boundary: tests exercise command selection without pretending
// that Linux can verify launchd behavior. Nothing removes the owned plist.
export function validateOwnedLaunchAgentPlist(plist,{read=path=>readFileSync(path,'utf8'),stat=lstatSync,canonical=realpathSync,runtime=process.execPath,serviceScript=join(import.meta.dirname,'service.js')}={}){
 let file;try{file=stat(plist);}catch(e){if(e.code==='ENOENT')return false;throw e;}if(file.isSymbolicLink()||!file.isFile()||canonical(plist)!==resolve(plist))throw new Error('Owned LaunchAgent plist must be a regular file at its canonical path; no service changes made');
 const contents=read(plist),xml=contents.replace(/<!--[\s\S]*?-->/g,'');
 const markers=[...xml.matchAll(/<key>\s*Comment\s*<\/key>\s*<string>([^<]*)<\/string>/g)];
 const labels=[...xml.matchAll(/<key>\s*Label\s*<\/key>\s*<string>([^<]*)<\/string>/g)];
 const argumentArrays=[...xml.matchAll(/<key>\s*ProgramArguments\s*<\/key>\s*<array>([\s\S]*?)<\/array>/g)];
 const decode=s=>s.replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&amp;','&');
 const argumentsList=argumentArrays.length===1?[...argumentArrays[0][1].matchAll(/<string>([^<]*)<\/string>/g)].map(m=>decode(m[1])):[];
 if(/<key>\s*(?:Program|BundleProgram)\s*<\/key>/.test(xml)||markers.length!==1||markers[0][1]!==OWNED_MARKER||labels.length!==1||labels[0][1]!==LABEL||argumentsList.length!==2||argumentsList[0]!==runtime||resolve(argumentsList[1])!==resolve(serviceScript))throw new Error(`Refusing to control an unowned or changed LaunchAgent: ${plist}; inspect and remove changed integration manually before reinstalling`);
 return true;
}
export function assertCanonicalLaunchAgentDestination(plist,{stat=lstatSync,canonical=realpathSync}={}){let parent=dirname(plist);while(true){try{const value=stat(parent);if(value.isSymbolicLink()||!value.isDirectory()||canonical(parent)!==resolve(parent))throw new Error('LaunchAgent destination must have canonical directory parents');return;}catch(e){if(e.code!=='ENOENT')throw e;const next=dirname(parent);if(next===parent)throw e;parent=next;}}}
export async function controlLaunchAgent(action,{
 platform=process.platform,home=homedir(),uid=process.getuid?.(),
 read=path=>readFileSync(path,'utf8'),stat=lstatSync,canonical=realpathSync,
 run=(args)=>spawnSync('/bin/launchctl',args,{encoding:'utf8'}),
 runtime=process.execPath,serviceScript=join(import.meta.dirname,'service.js'),beforeBootstrap=async()=>{}
}={}){
 if(!['start','stop','inspect'].includes(action))throw new Error('Unknown LaunchAgent action');
 if(platform!=='darwin')return {handled:false};
 const plist=join(home,'Library','LaunchAgents',`${LABEL}.plist`);
 const present=validateOwnedLaunchAgentPlist(plist,{read,stat,canonical,runtime,serviceScript});
 if(!present&&action!=='inspect')return {handled:false};
 if(!Number.isInteger(uid))throw new Error('Cannot determine LaunchAgent user domain');
 const domain=`gui/${uid}`,target=`${domain}/${LABEL}`;
 const command=args=>{const result=run(args);if(result.error)throw new Error(`launchctl ${args[0]} failed: ${result.error.message}`);return result;};
 const absent=result=>result.status===113||/could not find service|service not found|no such process/i.test(result.stderr||'');
 const inspect=()=>{
  const result=command(['print',target]);
  if(result.status!==0){if(absent(result))return false;throw new Error('Cannot inspect the owned LaunchAgent; no service changes made');}
  if(!present)throw new Error('An unrelated loaded job uses the reserved LaunchAgent label; refusing installation');
  const line=(result.stdout||'').split('\n').map(s=>s.trim()).find(s=>s.startsWith('path = '));
  const loadedPath=line?.slice(7).replace(/^"|"$/g,'');
  if(!loadedPath||resolve(loadedPath)!==resolve(plist))throw new Error('Loaded LaunchAgent ownership is ambiguous; refusing to control another job');
  return true;
 };
 const checked=args=>{const result=command(args);if(result.status!==0)throw new Error(`launchctl ${args[0]} failed; owned plist and data were preserved`);};
 const loaded=inspect();if(action==='inspect')return {handled:present,loaded,plist};
 if(action==='stop'){
  if(loaded){const result=command(['bootout',target]);if(result.status!==0&&inspect())throw new Error('launchctl bootout failed; the owned LaunchAgent is still loaded');}
  return {handled:true,stopped:true,launchAgent:true,plist};
 }
 if(!loaded){await beforeBootstrap();checked(['bootstrap',domain,plist]);}
 checked(['kickstart',target]);
 return {handled:true,running:true,launchAgent:true,plist};
}
