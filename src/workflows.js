import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const revision=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function sourceBaseline(root,choice) {
 if(choice!==undefined&&choice!=='HEAD')throw new Error('baseline must be HEAD');
 const run=args=>spawnSync('git',args,{cwd:root,encoding:'utf8'});
 const head=run(['rev-parse','--verify','HEAD']);if(head.status!==0)return {sha:null,dirty:false,accepted:false};
 const status=run(['status','--porcelain']);if(status.status!==0)throw new Error('Unable to inspect Git working tree');
 if(choice!==undefined&&choice!=='HEAD')throw new Error('baseline must be HEAD');
 return {sha:head.stdout.trim(),dirty:!!status.stdout.trim(),accepted:choice==='HEAD'};
}
export const starterSpecifications=[
 {name:'Bug fix',prompt:'Investigate and fix the reported defect. Preserve unrelated behavior.',criteria:'Reproduce the defect, add a regression test, and capture passing tests.'},
 {name:'Read-only review',prompt:'Review the requested code without changing files. Report actionable findings with source references.',criteria:'Each finding identifies its impact and concrete supporting sources.'},
 {name:'Small feature',prompt:'Implement the requested small feature with focused scope.',criteria:'Capture passing tests for the requested behavior and report limitations.'},
];
export function resolveGoal(config,input) {
 let prompt=input.prompt;
 if(input.spec){if(prompt!==undefined)throw new Error('Choose prompt or spec');const matches=config.specifications.filter(s=>s.name===input.spec);if(matches.length!==1)throw new Error('Specification must identify exactly one saved entry');prompt=matches[0].prompt+(matches[0].criteria?'\n\nCompletion criteria: '+matches[0].criteria:'');}
 if(typeof prompt!=='string'||!prompt.trim())throw new Error('Goal prompt is required');
 const enabled=config.agents.filter(a=>a.enabled),find=ref=>enabled.find(a=>a.id===ref||a.name===ref);
 const lead=input.lead?find(input.lead):enabled[0];if(!lead)throw new Error('Selected lead is not enabled');
 const selected=input.participants?input.participants.map(ref=>{const a=find(ref);if(!a)throw new Error('Unknown or disabled participant');return a;}):enabled;
 const participants=[...new Set([lead.id,...selected.map(a=>a.id)])];
 return {...input,prompt,lead:lead.id,participants};
}
