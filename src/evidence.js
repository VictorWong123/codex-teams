import {readFileSync} from 'node:fs';
import {join} from 'node:path';
// Conservative executable recognition. Shell syntax, comments, interpolation and
// compound commands are rejected; run the test command as its own tool call.
export function commandWords(command){if(typeof command!=='string'||/[\n\r`$#;&|<>]/.test(command))return null;const out=[];let word='',quote=null,started=false;for(const c of command){if(quote){if(c===quote)quote=null;else word+=c;started=true;}else if(c==='"'||c==="'"){quote=c;started=true;}else if(/\s/.test(c)){if(started){out.push(word);word='';started=false;}}else if(c==='\\')return null;else{word+=c;started=true;}}if(quote)return null;if(started)out.push(word);return out;}
export function applicableCommand(command,type){let a=commandWords(command);if(!a?.length||a.slice(1).some(v=>/^(?:--?(?:help|version|list|list-tests|collect-only|showconfig|dry-run|ignore-scripts)|-[hVv])(?:=|$)/i.test(v)))return false;const exe=a[0].split('/').at(-1);if(['bash','sh','zsh'].includes(exe)){if(a.length!==3||!['-c','-lc'].includes(a[1]))return false;return applicableCommand(a[2],type);}if(type==='research')return ['rg','cat','git','find'].includes(exe)&&a.length>1&&a.slice(1).every(v=>!v.includes('\n'));if(['npm','pnpm','yarn','bun'].includes(exe))return a[1]==='test'||a[1]==='run'&&a[2]==='test';if(exe==='node')return a[1]==='--test';if(['pytest','jest','vitest','mocha'].includes(exe))return true;return ['cargo','go'].includes(exe)&&a[1]==='test';}
export function passingTestOutput(output){if(typeof output!=='string'||/\[(?:no tests to run|no test files)\]/i.test(output))return false;return /(?:#|ℹ)\s*pass\s+[1-9]\d*\b/.test(output)&&/(?:#|ℹ)\s*fail\s+0\b/.test(output)||/\b[1-9]\d*\s+passed\b/.test(output)&&!/(?:\b[1-9]\d*\s+(?:failed|failing)\b|\bFAIL(?:ED)?\b)/.test(output)||/\b[1-9]\d*\s+passing\b/.test(output)&&!/[1-9]\d*\s+failing/.test(output)||/^ok\s+\S+/m.test(output)&&!/^FAIL/m.test(output);}
export function researchResults(results){if(!Array.isArray(results)||!results.length||!/https?:\/\//.test(JSON.stringify(results)))return false;const visit=value=>{if(!value||typeof value!=='object')return false;return Object.entries(value).some(([key,v])=>['text','content','snippet','title'].includes(key)&&typeof v==='string'&&v.trim().length>=20||v&&typeof v==='object'&&visit(v));};return results.some(visit);}
const reportOnly = /^(?:--?(?:help|version|dry-run|list(?:-tests|FilesOnly)?|showConfig|watch|ignore-scripts|init|clean|noCheck)|-[hVvw])(?:=|$)/i;
function validationTool(words,type){
 if(!words?.length||words.slice(1).some(w=>reportOnly.test(w)||['help','version','init','info','configtest','watch','serve'].includes(w)))return false;
 const executable=words[0].split('/').at(-1),args=words.slice(1);
 if(type==='typecheck'){
  if(['tsc','vue-tsc'].includes(executable)){
   const noEmit=args.indexOf('--noEmit');
   return noEmit>=0&&args[noEmit+1]!=='false'&&!args.some(w=>/^--noEmit=|^--noCheck/i.test(w));
  }
  return executable==='svelte-check';
 }
 if(type!=='build')return false;
 if(executable==='tsc')return !args.some(w=>/^--noEmit(?:=|$)/i.test(w));
 if(['vite','next','astro','nuxt'].includes(executable))return args[0]==='build';
 return ['webpack','rollup','tsup','esbuild'].includes(executable)&&!args.includes('--help');
}
export function validationCommand(command,type,workspace){
 const words=commandWords(command);if(!words?.length)return false;
 const executable=words[0].split('/').at(-1);
 if(['bash','sh','zsh'].includes(executable))return words.length===3&&['-c','-lc'].includes(words[1])&&validationCommand(words[2],type,workspace);
 if(type==='typecheck'&&executable==='tsc')return validationTool(words,type);
 if(!['npm','pnpm','yarn','bun'].includes(executable)||words.length!==3||words[1]!=='run'||words[2]!==type)return false;
 try{return validationTool(commandWords(JSON.parse(readFileSync(join(workspace,'package.json'),'utf8')).scripts?.[type]),type);}catch{return false;}
}
