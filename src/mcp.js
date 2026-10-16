#!/usr/bin/env node
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { api } from "./http-client.js";
import { Registry } from "./db.js";
import { initializeProject } from "./project.js";
import { resolveProject } from "./util.js";

if(process.env.CODEX_TEAMS_MEMBER_CONTEXT==='1')throw new Error('Human MCP is unavailable to team members');
const server=new McpServer({name:"codex-teams",version:"0.1.1"}), out=v=>({content:[{type:"text",text:JSON.stringify(v,null,2)}]});
const context={cwd:z.string().optional().describe("Calling Codex chat's working directory"),project:z.string().optional().describe("Explicit initialized project path")};
function p(i){if(!i.cwd&&!i.project)throw new Error("cwd or project is required; Codex Teams never uses a global current project");const registered=i.project&&new Registry().find(i.project);return resolveProject(i.cwd,registered?.root||i.project);}
server.registerTool("team_initialize",{description:"Initialize a persistent team for a project only when the user explicitly requests it",inputSchema:{project:z.string()}},async i=>out(initializeProject(i.project)));
server.registerTool("team_goal",{description:"Have the project team execute a goal. Call only when the user requests team execution.",inputSchema:{...context,prompt:z.string(),title:z.string().optional(),lead:z.string().optional(),participants:z.array(z.string()).optional(),idempotencyKey:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/goals",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_message",{description:"Message one configured agent; without goalId this starts a standalone assignment",inputSchema:{...context,recipient:z.string(),body:z.string(),goalId:z.string().optional(),actionable:z.boolean().default(true),idempotencyKey:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/messages",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_status",{description:"Show project team progress",inputSchema:context},async i=>{const x=p(i);return out(await api(`/api/status?project=${encodeURIComponent(x.root)}`));});
server.registerTool("team_control",{description:"Pause, resume, or stop a project's team",inputSchema:{...context,action:z.enum(["pause","resume","stop"]),goalId:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/control",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_interrupt",{description:"Interrupt one agent's active turn",inputSchema:{...context,goalId:z.string(),agent:z.string()}},async i=>{const x=p(i);return out(await api("/api/interrupt",{method:"POST",body:{...i,project:x.root}}));});

function humanTool(name,description,schema,fn){server.registerTool(name,{description,inputSchema:{...context,...schema}},async input=>{const x=p(input);return out(await fn(input,x.root));});}
humanTool('team_config','Read or replace validated canonical team.json',{config:z.record(z.unknown()).optional()},(i,project)=>i.config?api('/api/config',{method:'POST',body:{project,config:i.config}}):api(`/api/config?project=${encodeURIComponent(project)}`));
humanTool('team_roster','Add/edit an arbitrary roster agent; enabled:false disables it',{agent:z.object({id:z.string().optional(),name:z.string(),purpose:z.string().optional(),instructions:z.string().optional(),model:z.string().nullable().optional(),permission:z.enum(['inherit','read-only']).optional(),enabled:z.boolean().optional()})},(i,project)=>api('/api/agents',{method:'POST',body:{project,agent:i.agent}}));
humanTool('team_reopen','Reopen a goal using its original durable participant threads',{goalId:z.string(),prompt:z.string().optional()},(i,project)=>api(`/api/goals/${i.goalId}/reopen`,{method:'POST',body:{project,prompt:i.prompt}}));
humanTool('team_add_participant','Add a roster agent to an active goal and initialize its independent thread',{goalId:z.string(),agent:z.string()},(i,project)=>api(`/api/goals/${i.goalId}/participants`,{method:'POST',body:{project,agent:i.agent}}));
humanTool('team_tasks','List shared tasks; optionally create, claim, verify or revise',{action:z.enum(['list','create','claim','verify','revise']).default('list'),taskId:z.string().optional(),goalId:z.string().optional(),agent:z.string().optional(),task:z.record(z.unknown()).optional()},async(i,project)=>i.action==='list'?(await api(`/api/status?project=${encodeURIComponent(project)}`)).tasks:api(i.action==='create'?'/api/tasks':`/api/tasks/${i.taskId}/${i.action}`,{method:'POST',body:{project,goalId:i.goalId,agent:i.agent,...i.task}}));
humanTool('team_notes','List project notes or save a source-goal note',{goalId:z.string().optional(),title:z.string().optional(),body:z.string().optional()},async(i,project)=>i.body?api('/api/notes',{method:'POST',body:{...i,project}}):(await api(`/api/status?project=${encodeURIComponent(project)}`)).notes);
humanTool('team_conversations','Search captured conversation history; sync paginated Codex history explicitly',{search:z.string().default(''),sync:z.boolean().default(false)},async(i,project)=>{if(i.sync)await api('/api/history',{method:'POST',body:{project}});return api(`/api/conversations?project=${encodeURIComponent(project)}&search=${encodeURIComponent(i.search)}`);});
humanTool('team_approvals','List human approvals or submit a method-specific response',{approvalId:z.string().optional(),response:z.record(z.unknown()).optional()},async(i,project)=>i.approvalId?api(`/api/approvals/${i.approvalId}/resolve`,{method:'POST',body:{project,response:i.response}}):(await api(`/api/status?project=${encodeURIComponent(project)}`)).approvals);
humanTool('team_recovery','Inspect authoritative history or explicitly acknowledge side effects; never blindly replay',{goalId:z.string(),action:z.enum(['inspect','acknowledge']),acknowledgeSideEffects:z.boolean().default(false)},(i,project)=>api('/api/recovery',{method:'POST',body:{...i,project}}));
server.registerTool('team_service',{description:'Start, inspect or stop the local background service when explicitly requested',inputSchema:{action:z.enum(['start','status','stop'])}},async i=>{const {stdout}=await promisify(execFile)(process.execPath,[join(import.meta.dirname,'cli.js'),'service',i.action],{timeout:15000,maxBuffer:100000});return out(JSON.parse(stdout));});
server.registerTool('team_dashboard',{description:'Get the private local dashboard URL for the human user; treat the credential fragment as private',inputSchema:{}},async()=>{const {stdout}=await promisify(execFile)(process.execPath,[join(import.meta.dirname,'cli.js'),'dashboard','--no-open'],{timeout:5000,maxBuffer:10000});return out({url:stdout.trim(),private:true});});
await server.connect(new StdioServerTransport());
