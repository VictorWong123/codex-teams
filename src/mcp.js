#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { api } from "./http-client.js";
import { initializeProject } from "./project.js";
import { resolveProject } from "./util.js";

const server=new McpServer({name:"codex-teams",version:"0.1.0"}), out=v=>({content:[{type:"text",text:JSON.stringify(v,null,2)}]});
const context={cwd:z.string().optional().describe("Calling Codex chat's working directory"),project:z.string().optional().describe("Explicit initialized project path")};
function p(i){if(!i.cwd&&!i.project)throw new Error("cwd or project is required; Codex Teams never uses a global current project");return resolveProject(i.cwd,i.project);}
server.registerTool("team_initialize",{description:"Initialize a persistent team for a project only when the user explicitly requests it",inputSchema:{project:z.string()}},async i=>out(initializeProject(i.project)));
server.registerTool("team_goal",{description:"Have the project team execute a goal. Call only when the user requests team execution.",inputSchema:{...context,prompt:z.string(),title:z.string().optional(),lead:z.string().optional(),participants:z.array(z.string()).optional(),idempotencyKey:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/goals",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_message",{description:"Message one configured agent; without goalId this starts a standalone assignment",inputSchema:{...context,recipient:z.string(),body:z.string(),goalId:z.string().optional(),actionable:z.boolean().default(true),idempotencyKey:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/messages",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_status",{description:"Show project team progress",inputSchema:context},async i=>{const x=p(i);return out(await api(`/api/status?project=${encodeURIComponent(x.root)}`));});
server.registerTool("team_control",{description:"Pause, resume, or stop a project's team",inputSchema:{...context,action:z.enum(["pause","resume","stop"]),goalId:z.string().optional()}},async i=>{const x=p(i);return out(await api("/api/control",{method:"POST",body:{...i,project:x.root}}));});
server.registerTool("team_interrupt",{description:"Interrupt one agent's active turn",inputSchema:{...context,goalId:z.string(),agent:z.string()}},async i=>{const x=p(i);return out(await api("/api/interrupt",{method:"POST",body:{...i,project:x.root}}));});
await server.connect(new StdioServerTransport());
