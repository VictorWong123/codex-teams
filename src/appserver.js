import { spawn, spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { EventEmitter } from "node:events";
import { PROTOCOL_VERSION } from "./constants.js";

export class AppServer extends EventEmitter {
  constructor({codex=process.env.CODEX_BIN||"codex",env={}}={}) { super(); this.codex=codex; this.env=env; this.seq=0; this.pending=new Map(); this.child=null; }
  checkVersion(){const v=spawnSync(this.codex,["--version"],{encoding:"utf8"});if(v.status!==0)throw new Error(`Codex unavailable: ${v.stderr}`);if(v.stdout.trim()!==`codex-cli ${PROTOCOL_VERSION}`)throw new Error(`Unsupported Codex version; expected exactly ${PROTOCOL_VERSION}, got ${v.stdout.trim()}`);}
  async start(){
    this.checkVersion(); const env={...process.env,...this.env,CODEX_TEAMS_MEMBER_CONTEXT:'1'}; delete env.OPENAI_API_KEY; delete env.CODEX_API_KEY;
    this.child=spawn(this.codex,["app-server","--listen","stdio://"],{stdio:["pipe","pipe","pipe"],env});
    this.child.stderr.on("data",()=>{});
    this.child.on("error",e=>{for(const p of this.pending.values())p.reject(e);this.pending.clear();});
    createInterface({input:this.child.stdout}).on("line",line=>{try{this.handle(JSON.parse(line));}catch(e){this.emit("log",`Invalid app-server line: ${e.message}`);}});
    this.child.on("exit",(code)=>{for(const {reject,timer} of this.pending.values()){clearTimeout(timer);reject(new Error(`app-server exited ${code}`));}this.pending.clear();this.emit("exit",code);});
    await this.request("initialize",{clientInfo:{name:"codex-teams",title:"Codex Teams",version:"0.1.1"},capabilities:{experimentalApi:true}});
    this.notify("initialized",{});
    const account=await this.request("account/read",{refreshToken:false});
    if(account.account?.type!=="chatgpt"){await this.stop();throw new Error("Codex Teams requires existing ChatGPT authentication. Run `codex login`; API-key and separately billed provider authentication are refused.");}
    return account;
  }
  handle(msg){if(msg.id!==undefined&&(msg.result!==undefined||msg.error)){const p=this.pending.get(String(msg.id));if(!p)return;this.pending.delete(String(msg.id));clearTimeout(p.timer);msg.error?p.reject(new Error(msg.error.message||JSON.stringify(msg.error))):p.resolve(msg.result);return;}if(msg.id!==undefined&&msg.method){this.emit("request",msg);return;}if(msg.method)this.emit("notification",msg);}
  request(method,params){const req={id:String(++this.seq),method,params};return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(req.id);reject(new Error(`app-server request timed out: ${method}`));},30000);timer.unref();this.pending.set(req.id,{resolve,reject,timer});try{this.write(req);}catch(e){clearTimeout(timer);this.pending.delete(req.id);reject(e);}});}
  notify(method,params){this.write({method,params});}
  respond(id,result){this.write({id,result});}
  respondError(id,message){this.write({id,error:{code:-32000,message}});}
  write(value){if(!this.child?.stdin.writable)throw new Error("app-server is not running");this.child.stdin.write(`${JSON.stringify(value)}\n`);}
  async stop(){if(!this.child)return;this.child.stdin.end();await Promise.race([new Promise(r=>this.child.once("exit",r)),new Promise(r=>setTimeout(r,1000))]);if(!this.child.killed)this.child.kill();this.child=null;}
}
