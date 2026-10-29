import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),script=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const flush=()=>new Promise(r=>setTimeout(r,30));
function fixture(){
 const dom=new JSDOM(html,{url:'http://localhost/#fake',runScripts:'outside-only'}),w=dom.window,calls=[];
 const state={project:{name:'Test'},config:{agents:[{id:'a',name:'Agent',enabled:true}],specifications:[],limits:{}},goals:[],participants:[],tasks:[],evidence:[],messages:[],notes:[],events:[],turns:[],approvals:[{id:'approval',agent_id:'a',method:'item/tool/requestUserInput',params_json:JSON.stringify({questions:[{id:'q',question:'Answer'}]})}]};
 let interval,post=async()=>({}),get;w.setInterval=fn=>{interval=fn;};w.confirm=()=>true;w.structuredClone=structuredClone;
 w.fetch=async(url,opts)=>{calls.push({url,...opts});const value=opts.method==='POST'?await post(JSON.parse(opts.body)):get?get(url):url.includes('/projects')?[{id:'p',root:'/project'}]:url.includes('/read/')?{items:[],nextCursor:null}:state;return {ok:true,json:async()=>value};};w.eval(script);
 return {w,state,calls,poll:()=>interval(),setPost:fn=>post=fn,setGet:fn=>get=fn,close:()=>w.close()};
}
test('a delayed old-project summary cannot replace cards or send actions to the new project',async()=>{
 const f=fixture();try{
  let hold=false,held=false,release,entered;const waiting=new Promise(r=>entered=r);
  f.setGet(url=>{
   const id=new URL(url,'http://localhost').searchParams.get('project'),label=id==='other'?'B':'A',agent=label.toLowerCase()+'-agent',goal={id:label+'-goal',title:label,status:'paused',lead_agent_id:agent,config_json:'{"limits":{}}'};
   if(url.includes('/projects'))return [{id:'p',root:'/A'},{id:'other',root:'/B'}];
   if(url.includes('/read/'))return {items:url.includes('/read/goals')?[goal]:[],nextCursor:null};
   if(url.includes('/summary')){const value={participants:[],tasks:[],approvals:[]};if(hold&&!held&&id==='p'){held=true;entered();return new Promise(r=>release=()=>r(value));}return value;}
   return {...structuredClone(f.state),project:{name:label},config:{...f.state.config,agents:[{id:agent,name:label+' agent',enabled:true}]},approvals:[]};
  });
  await flush();const oldDisable=[...f.w.document.querySelectorAll('#agents button')].find(b=>b.textContent==='Disable');hold=true;f.poll();await waiting;const selector=f.w.document.getElementById('project');selector.value='other';selector.dispatchEvent(new f.w.Event('change'));await flush();
  assert.equal(f.w.document.querySelector('#agents h3').textContent,'B agent');oldDisable.click();await flush();assert.equal(f.calls.filter(c=>c.method==='POST').length,0);release();await flush();assert.equal(f.w.document.querySelector('#agents h3').textContent,'B agent');
  [...f.w.document.querySelectorAll('#agents button')].find(b=>b.textContent==='Disable').click();await flush();const post=JSON.parse(f.calls.find(c=>c.method==='POST').body);assert.equal(post.project,'other');assert.equal(post.agent.id,'b-agent');
 }finally{f.close();}
});
test('a delayed summary cannot hide approvals after selecting a different goal in the same project',async()=>{
 const f=fixture();try{
  const goals=['one','two'].map(id=>({id,title:id,status:'paused',lead_agent_id:'a',config_json:'{"limits":{}}'}));let hold=false,held=false,release,entered;const waiting=new Promise(r=>entered=r);
  f.setGet(url=>{
   if(url.includes('/projects'))return [{id:'p',root:'/A'}];
   if(url.includes('/read/'))return {items:url.includes('/read/goals')?goals:[],nextCursor:null};
   if(url.includes('/summary')){const goal=new URL(url,'http://localhost').searchParams.get('goal'),value={participants:[],tasks:[],approvals:[{id:goal,goal_id:goal,agent_id:'a',method:'item/tool/requestUserInput',params_json:JSON.stringify({questions:[{id:'q',question:'Question '+goal}]})}]};if(hold&&!held&&goal==='one'){held=true;entered();return new Promise(r=>release=()=>r(value));}return value;}
   return structuredClone(f.state);
  });
  await flush();const selector=f.w.document.getElementById('selected-goal');selector.value='one';selector.dispatchEvent(new f.w.Event('change'));await flush();hold=true;f.poll();await waiting;selector.value='two';selector.dispatchEvent(new f.w.Event('change'));await flush();assert.match(f.w.document.getElementById('approvals').textContent,/Question two/);
  release();await flush();assert.equal(selector.value,'two');assert.match(f.w.document.getElementById('approvals').textContent,/Question two/);
 }finally{f.close();}
});
test('dashboard suppresses repeated clicks and retains submission key after ambiguous failure',async()=>{
 const f=fixture();try{await flush();const form=f.w.document.getElementById('goal-form');f.w.document.getElementById('goal-prompt').value='Build';let reject;f.setPost(()=>new Promise((_,r)=>reject=r));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await flush();assert.equal(f.calls.filter(c=>c.method==='POST').length,1);reject(new Error('lost response'));await flush();f.setPost(async()=>({}));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await flush();const posts=f.calls.filter(c=>c.method==='POST').map(c=>JSON.parse(c.body));assert.equal(posts[0].idempotencyKey,posts[1].idempotencyKey);assert.equal(f.w.document.getElementById('goal-prompt').value,'');}finally{f.close();}
});
test('approval draft survives blur and multiple polling cycles',async()=>{
 const f=fixture();try{await flush();let answer=f.w.document.querySelector('#approvals input');answer.value='draft';answer.dispatchEvent(new f.w.Event('input'));answer.blur();f.poll();await flush();f.poll();await flush();assert.equal(f.w.document.querySelector('#approvals input').value,'draft');}finally{f.close();}
});
test('configuration draft retains its original revision across external updates',async()=>{
 const f=fixture();try{f.state.configRevision='original';await flush();const input=f.w.document.getElementById('config');input.value=JSON.stringify({...f.state.config,defaultModel:'my-change'});input.dispatchEvent(new f.w.Event('input'));f.state.config={...f.state.config,defaultModel:'external'};f.state.configRevision='new';f.poll();await flush();f.w.document.getElementById('config-form').dispatchEvent(new f.w.Event('submit',{cancelable:true}));await flush();const payload=JSON.parse(f.calls.find(c=>c.method==='POST').body);assert.equal(payload.expectedRevision,'original');assert.equal(payload.config.defaultModel,'my-change');}finally{f.close();}
});
test('permission checkbox drafts survive polling and unknown elicitation schemas have no accept control',async()=>{
 const f=fixture();try{f.state.approvals=[{id:'p',agent_id:'a',method:'item/permissions/requestApproval',params_json:JSON.stringify({permissions:{network:{enabled:true}}})},{id:'u',agent_id:'a',method:'mcpServer/elicitation/request',params_json:JSON.stringify({requestedSchema:{type:'object',properties:{text:{type:'string',pattern:'abc'}}}})}];await flush();const input=f.w.document.querySelector('#approvals input');input.checked=true;input.dispatchEvent(new f.w.Event('input'));f.poll();await flush();assert.equal(f.w.document.querySelector('#approvals input').checked,true);assert.ok(![...f.w.document.querySelectorAll('#approvals button')].some(b=>b.textContent==='Submit requested information'));}finally{f.close();}
});
test('switching project clears selected goal before requesting the next summary',async()=>{
 const f=fixture();try{const goal={id:'goal-a',title:'A',status:'paused',lead_agent_id:'a',config_json:'{"limits":{}}'};f.setGet(url=>url.includes('/projects')?[{id:'p',root:'/A'},{id:'other',root:'/B'}]:url.includes('/read/goals')?{items:url.includes('project=p')?[goal]:[],nextCursor:null}:url.includes('/read/')?{items:[],nextCursor:null}:url.includes('/summary')?{participants:[],tasks:[],approvals:[]}:f.state);await flush();const selected=f.w.document.getElementById('selected-goal');selected.value='goal-a';selected.dispatchEvent(new f.w.Event('change'));await flush();const message=f.w.document.getElementById('message-goal');message.value='goal-a';message.dispatchEvent(new f.w.Event('change'));await flush();const project=f.w.document.getElementById('project');project.value='other';project.dispatchEvent(new f.w.Event('change'));await flush();assert.equal(f.calls.some(c=>c.url.includes('/summary?goal=goal-a')&&c.url.includes('project=other')),false);assert.equal(selected.value,'');}finally{f.close();}
});
test('selected goal does not hide recipients for a different message goal',async()=>{
 const f=fixture();try{const goals=['one','two'].map(id=>({id,title:id,status:'paused',lead_agent_id:'a',config_json:'{"limits":{}}'}));f.state.approvals=[];f.setGet(url=>url.includes('/projects')?[{id:'p',root:'/A'}]:url.includes('/read/goals')?{items:goals,nextCursor:null}:url.includes('/read/')?{items:[],nextCursor:null}:url.includes('/summary')?{participants:[{goal_id:url.includes('goal=two')?'two':'one',agent_id:'a',snapshot_json:JSON.stringify({id:'a',name:url.includes('goal=two')?'Second goal agent':'First goal agent'})}],tasks:url.includes('goal=two')?[{id:'task-two',goal_id:'two',title:'Dependency in second goal'}]:[],approvals:[]}:f.state);await flush();const selected=f.w.document.getElementById('selected-goal');selected.value='one';selected.dispatchEvent(new f.w.Event('change'));await flush();const message=f.w.document.getElementById('message-goal');message.value='two';message.dispatchEvent(new f.w.Event('change'));await flush();assert.equal(f.w.document.getElementById('recipient').options[0].textContent,'Second goal agent');const taskGoal=f.w.document.getElementById('task-goal');taskGoal.value='two';taskGoal.dispatchEvent(new f.w.Event('change'));await flush();assert.match(f.w.document.getElementById('task-depends').textContent,/Dependency in second goal/);}finally{f.close();}
});
test('polling marks disconnection and restores independent expansion and surviving button focus',async()=>{
 const f=fixture();try{const notes=['n1','n2'].map(id=>({id,title:'Same title',goal_id:'g',body:'text'}));f.setGet(url=>url.includes('/projects')?[{id:'p',root:'/A'}]:url.includes('/read/notes')?{items:notes,nextCursor:null}:url.includes('/read/')?{items:[],nextCursor:null}:f.state);await flush();const details=f.w.document.querySelectorAll('#notes details');details[0].open=true;const button=f.w.document.querySelector('#approvals button');button.focus();f.poll();await flush();assert.equal(f.w.document.activeElement,button);assert.equal(f.w.document.querySelectorAll('#notes details')[0].open,true);assert.equal(f.w.document.querySelectorAll('#notes details')[1].open,false);f.setGet(()=>{throw new Error('offline');});f.poll();await flush();assert.match(f.w.document.getElementById('connection').textContent,/Disconnected/);}finally{f.close();}
});
