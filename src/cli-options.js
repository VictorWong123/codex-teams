// Validate the complete invocation before clients create registries or send requests.
const definitions = {
 help: ['', [], 0, 1], init: ['', ['project'], 0, 1],
 status: ['', ['project','goal','format','watch'], 0, 0],
 config: ['get set', ['project','json','file'], 0, 0],
 roster: ['list add edit disable remove model', ['project','json','file','model'], 0, 1],
 goal: ['', ['project','prompt','lead','participants','key','json','file','text-file','stdin','spec','preview','baseline'], 0, Infinity],
 reopen: ['', ['project','prompt','key'], 1, 1],
 message: ['', ['project','body','goal','informational','key','text-file','stdin'], 1, Infinity],
 tasks: ['list create claim verify revise', ['project','goal','agent','json','file'], 0, 1],
 notes: ['list add edit archive unarchive', ['project','json','file','search','page','cursor','limit'], 0, 1],
 conversations: ['', ['project','search','sync','goal','agent','cursor','limit','page'], 0, 0],
 participant: ['', ['project','goal','baseline'], 1, 1],
 pause: ['', ['project','goal'], 0, 0], resume: ['', ['project','goal'], 0, 0], stop: ['', ['project','goal'], 0, 0],
 interrupt: ['', ['project','goal','agent'], 0, 0],
 approvals: ['list resolve', ['project','json','file'], 0, 1],
 recovery: ['inspect acknowledge', ['project','goal','acknowledge-side-effects'], 0, 0],
 service: ['start status stop config', ['foreground','json','file'], 0, 0],
 dashboard: ['', ['no-open'], 0, 0], install: ['', ['launchagent'], 0, 0], uninstall: ['', [], 0, 0],
 'self-test': ['', ['live'], 0, 0], 'verify-install': ['', [], 0, 0],
 native: ['instructions install status', ['scope','project'], 0, 0],
 doctor: ['', ['project','json'], 0, 0], projects: ['list activate', ['acknowledge'], 0, 1],
 handoff: ['', ['project','goal','format'], 0, 0],
 storage: ['', ['json'], 0, 0], backup: ['', ['destination'], 0, 0], restore: ['', ['source','destination'], 0, 0],
};
const booleans = new Set(['help','foreground','launchagent','no-open','informational','acknowledge-side-effects','live','sync','watch','stdin','preview','page','acknowledge']);
export function parseArgs(args) {
 const literalIndex=args.indexOf('--'),helpIndex=args.findIndex(a=>a==='--help'||a==='-h');if(helpIndex>=0&&(literalIndex<0||helpIndex<literalIndex)){const cmd=args.find(a=>Object.hasOwn(definitions,a))||'help';return {cmd,words:[cmd],flags:{help:true},help:true};}
 const flags={}, words=[]; let literal=false,literalFrom=Infinity;
 for(let i=0;i<args.length;i++) {
  const arg=args[i]; if(!literal&&arg==='--'){literal=true;literalFrom=words.length;continue;}
  if(!literal&&(arg==='-h'||arg==='--help')){flags.help=true;continue;}
  if(!literal&&arg.startsWith('-')) {
   if(!arg.startsWith('--'))throw new Error(`Unknown option ${arg}`);
   const equal=arg.indexOf('='), name=arg.slice(2,equal<0?undefined:equal);
   if(name==='disabled')throw new Error('Use roster disable NAME instead of --disabled');
   if(Object.hasOwn(flags,name))throw new Error(`Repeated option --${name}`);
   const bool=booleans.has(name)||(name==='json'&&['doctor','storage'].includes(words[0]));
   if(bool){if(equal>=0)throw new Error(`--${name} takes no value`);flags[name]=true;}
   else {const value=equal>=0?arg.slice(equal+1):args[++i];if(value===undefined||value.startsWith('--')||value==='')throw new Error(`--${name} requires a value`);flags[name]=value;}
  } else words.push(arg);
 }
 const cmd=words[0]||'help';const definition=definitions[cmd];if(!definition)throw new Error(`Unknown command ${cmd}; run cteam help`);
 if(flags.help||cmd==='help')return {cmd,words,flags,help:true};
 let [subs,allowed,min,max]=definition, positional=words.slice(1),sub;
 if(cmd==='goal'&&positional[0]==='budget'&&literalFrom>1){sub=positional.shift();allowed=['project','goal','turns','minutes','tokens'];min=max=0;}
 else if(subs){sub=positional.shift()||(['config','roster','tasks','notes','approvals','projects'].includes(cmd)?subs.split(' ')[0]:null);if(!subs.split(' ').includes(sub))throw new Error(`${cmd} requires one of: ${subs}`);}
 const variants={config:{get:['project'],set:['project','json','file']},roster:{list:['project'],disable:['project'],remove:['project'],model:['project','model']},tasks:{list:['project'],claim:['project','agent','json','file'],verify:['project','agent','json','file'],revise:['project','json','file']},notes:{list:['project','search','page','cursor','limit'],archive:['project'],unarchive:['project'],edit:['project','json','file'],add:['project','json','file']},approvals:{list:['project'],resolve:['project','json','file']},service:{status:[],stop:[],start:['foreground'],config:['json','file']},native:{instructions:[],install:['scope','project'],status:['scope','project']},projects:{list:[],activate:['acknowledge']}};allowed=variants[cmd]?.[sub]||allowed;
 for(const key of Object.keys(flags))if(!allowed.includes(key))throw new Error(`Unknown option --${key} for ${cmd}${sub?' '+sub:''}`);
 if(positional.length<min||positional.length>max)throw new Error(`Unexpected or missing arguments for ${cmd}`);
 const requireFlag=name=>{if(!flags[name])throw new Error(`--${name} is required`);};
 const requireId=()=>{if(positional.length!==1)throw new Error(`${cmd} ${sub} requires one name or ID`);};
 if(cmd==='roster'&&sub!=='list')requireId();
 if(['roster','tasks','notes','approvals'].includes(cmd)&&sub==='list'&&positional.length)throw new Error(`${cmd} list takes no arguments`);
 if(cmd==='roster'&&sub==='model')requireFlag('model');
 if(cmd==='tasks'&&sub==='create'&&positional.length||cmd==='notes'&&sub==='add'&&positional.length)throw new Error('Unexpected positional argument');
 if(cmd==='tasks'&&!['list','create'].includes(sub)||cmd==='notes'&&['edit','archive','unarchive'].includes(sub)||cmd==='approvals'&&sub==='resolve')requireId();
 if(['interrupt','participant','recovery','handoff'].includes(cmd)||cmd==='goal'&&sub==='budget')requireFlag('goal');
 if(cmd==='interrupt')requireFlag('agent');
 if(cmd==='projects'&&sub==='activate'){requireId();requireFlag('acknowledge');}
 if(cmd==='projects'&&sub==='list'&&positional.length)throw new Error('projects list takes no arguments');
 if(cmd==='native'&&['install','status'].includes(sub))requireFlag('scope');
 if(cmd==='backup'||cmd==='restore')requireFlag('destination');if(cmd==='restore')requireFlag('source');
 if(flags.json&&flags.file)throw new Error('Choose --json or --file');
 if(cmd==='config'&&sub==='set'&&!flags.json&&!flags.file)throw new Error('config set requires --json or --file');
 if(cmd==='goal'&&sub==='budget'&&!['turns','minutes','tokens'].some(k=>flags[k]!==undefined))throw new Error('Supply a budget increment');
 for(const key of ['turns','minutes','tokens','limit'])if(flags[key]!==undefined){const value=Number(flags[key]);if(!Number.isFinite(value)||value<=0||key!=='minutes'&&!Number.isSafeInteger(value)||key==='limit'&&value>200)throw new Error(`Invalid --${key} value`);}
 if(flags.baseline&&flags.baseline!=='HEAD')throw new Error('--baseline must be HEAD');
 if(flags.format&&!['text','json'].includes(flags.format))throw new Error('--format must be text or json');
 if(cmd==='goal'&&sub!=='budget'||cmd==='message') {
  const text=cmd==='goal'?flags.prompt:flags.body, count=[!!text,!!flags['text-file'],!!flags.stdin,!!flags.spec,cmd==='goal'?positional.length>0:positional.length>1].filter(Boolean).length;
  if(count>1||count&&(flags.json||flags.file))throw new Error('Choose exactly one prompt source');
  if(!count&&!flags.json&&!flags.file)throw new Error('Prompt or message text is required');
 }
 return {cmd,sub,words:subs?[cmd,sub,...positional]:words,flags,help:false};
}
export function commandHelp(cmd='help') {
 const names=cmd==='help'?Object.keys(definitions):[cmd];
 return 'cteam 0.1.5-rc.1 (codex-teams compatible) — explicit team execution; use --project PATH_OR_ID for project commands\n'+names.map(name=>{const [subs,options]=definitions[name]||definitions.help;return `${name}${subs?' ['+subs.split(' ').join('|')+']':''}${options.length?'  '+options.map(o=>'--'+o).join(' '):''}`;}).join('\n')+'\nUse --help with any command. Use -- before literal prompt text.\ngoal budget --goal ID [--turns N] [--minutes N] [--tokens N]';
}
