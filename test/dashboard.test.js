import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),script=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const flush=()=>new Promise(r=>setTimeout(r,30));
function fixture(){
 const dom=new JSDOM(html,{url:'http://localhost/#fake',runScripts:'outside-only'}),w=dom.window,calls=[];
 const state={project:{name:'Test'},config:{agents:[{id:'a',name:'Agent',enabled:true}],specifications:[],limits:{}},goals:[],participants:[],tasks:[],evidence:[],messages:[],notes:[],events:[],turns:[],approvals:[{id:'approval',agent_id:'a',method:'item/commandExecution/requestApproval',params_json:'{}'}]};
 let interval,post=async()=>({});w.setInterval=fn=>{interval=fn;};w.confirm=()=>true;w.structuredClone=structuredClone;
 w.fetch=async(url,opts)=>{calls.push({url,...opts});const value=opts.method==='POST'?await post(JSON.parse(opts.body)):url.includes('/projects')?[{id:'p',root:'/project'}]:state;return {ok:true,json:async()=>value};};w.eval(script);
 return {w,state,calls,poll:()=>interval(),setPost:fn=>post=fn,close:()=>w.close()};
}
test('dashboard suppresses repeated clicks and retains submission key after ambiguous failure',async()=>{
 const f=fixture();try{await flush();const form=f.w.document.getElementById('goal-form');f.w.document.getElementById('goal-prompt').value='Build';let reject;f.setPost(()=>new Promise((_,r)=>reject=r));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await flush();assert.equal(f.calls.filter(c=>c.method==='POST').length,1);reject(new Error('lost response'));await flush();f.setPost(async()=>({}));form.dispatchEvent(new f.w.Event('submit',{cancelable:true}));await flush();const posts=f.calls.filter(c=>c.method==='POST').map(c=>JSON.parse(c.body));assert.equal(posts[0].idempotencyKey,posts[1].idempotencyKey);assert.equal(f.w.document.getElementById('goal-prompt').value,'');}finally{f.close();}
});
test('approval draft survives blur and multiple polling cycles',async()=>{
 const f=fixture();try{await flush();let answer=f.w.document.querySelector('#approvals textarea');answer.value='draft';answer.dispatchEvent(new f.w.Event('input'));answer.blur();f.poll();await flush();f.poll();await flush();assert.equal(f.w.document.querySelector('#approvals textarea').value,'draft');}finally{f.close();}
});
