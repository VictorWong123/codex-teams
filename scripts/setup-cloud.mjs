#!/usr/bin/env node
// Deliberately imports only Node platform code: works before npm ci, offline.
import { installNativeSkill, nativeStatus } from '../src/native.js';

try{
 const options={scope:'user'},seen=new Set(),args=process.argv.slice(2);
 for(let i=0;i<args.length;i++){
  const flag=args[i],value=args[++i];
  if(!['--scope','--project'].includes(flag)||seen.has(flag)||!value||value.startsWith('--'))throw new Error('Usage: node scripts/setup-cloud.mjs [--scope user|project] [--project PATH]');
  seen.add(flag);options[flag.slice(2)]=value;
 }
 const installed=installNativeSkill(options);
 console.log(JSON.stringify({...nativeStatus(options),changed:installed.changed,
  next:'In the Cloud chat, read the installed skill and explicitly request codex-teams-native. Check native tools before delegating.',
  environment:'This filesystem only; publish prepared environment changes separately for new tasks.'},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
