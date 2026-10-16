#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { idSegment } from "./util.js";
import { api } from "./http-client.js";

const scope={project:must("CODEX_TEAMS_PROJECT"),goal:must("CODEX_TEAMS_GOAL"),agent:must("CODEX_TEAMS_AGENT"),token:must("CODEX_TEAMS_SCOPE_TOKEN")};
const server=new McpServer({name:"codex-teams-member",version:"0.1.3"});
const out=v=>({content:[{type:"text",text:JSON.stringify(v,null,2)}]});
server.registerTool("team_status",{description:"See this goal's agents, tasks, and your messages",inputSchema:{}},async()=>out(await api(`/api/status?project=${scope.project}`,{scope})));
server.registerTool("create_task",{description:"Create a shared task with completion criteria",inputSchema:{title:z.string(),description:z.string().default(""),owner:z.string().optional(),depends:z.array(z.string()).default([]),criteria:z.string(),evidenceType:z.enum(["test","research"]).default("test")}},async input=>out(await api("/api/tasks",{method:"POST",scope,body:{...input,project:scope.project}})));
server.registerTool("claim_task",{description:"Claim a ready shared task atomically",inputSchema:{taskId:z.string().uuid(),claimKey:z.string().optional()}},async input=>out(await api(`/api/tasks/${idSegment(input.taskId)}/claim`,{method:"POST",scope,body:{...input,project:scope.project}})));
server.registerTool("revise_task",{description:"Goal lead: request correction and dispatch the task again",inputSchema:{taskId:z.string().uuid(),instructions:z.string()}},async input=>out(await api(`/api/tasks/${idSegment(input.taskId)}/revise`,{method:"POST",scope,body:{...input,project:scope.project}})));
server.registerTool("verify_task",{description:"Lead only: verify a task that has captured evidence",inputSchema:{taskId:z.string().uuid()}},async input=>out(await api(`/api/tasks/${idSegment(input.taskId)}/verify`,{method:"POST",scope,body:{project:scope.project}})));
server.registerTool("message_agent",{description:"Send a direct persisted message; actionable messages wake an idle recipient",inputSchema:{recipient:z.string(),body:z.string(),actionable:z.boolean().default(true),idempotencyKey:z.string().optional()}},async input=>out(await api("/api/messages",{method:"POST",scope,body:{...input,project:scope.project}})));
server.registerTool("save_project_note",{description:"Save a reusable finding or decision with this goal as its source",inputSchema:{title:z.string(),body:z.string()}},async input=>out(await api("/api/notes",{method:"POST",scope,body:{...input,project:scope.project}})));
server.registerTool("complete_goal",{description:"Lead only: complete the goal after every task is verified and evidence exists",inputSchema:{}},async()=>out(await api(`/api/goals/${idSegment(scope.goal)}/complete`,{method:"POST",scope,body:{project:scope.project}})));
await server.connect(new StdioServerTransport());
function must(name){if(!process.env[name])throw new Error(`${name} is required`);return process.env[name];}
