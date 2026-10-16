import { z } from 'zod';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { id } from './util.js';
import { DEFAULT_LIMITS, DEFAULT_MODEL } from './constants.js';
const text=z.string().max(100000);
export const agentSchema=z.object({id:z.string().uuid().optional(),name:z.string().trim().min(1).max(100),purpose:text.default(''),instructions:text.default(''),model:z.string().min(1).max(200).nullable().optional(),enabled:z.boolean().default(true),permission:z.enum(['inherit','read-only']).default('inherit')}).strict();
export const configSchema=z.object({version:z.literal(1),name:z.string().min(1).max(200),defaultModel:z.string().min(1).default(DEFAULT_MODEL),paused:z.boolean().default(false),limits:z.object({globalConcurrency:z.number().int().min(1).max(16).default(2),projectConcurrency:z.number().int().min(1).max(16).default(2),turns:z.number().int().min(1).max(10000).default(30),minutes:z.number().positive().max(10000).default(30),tokens:z.number().int().positive().nullable().default(null),stallMinutes:z.number().positive().max(60).default(5)}).strict().default(DEFAULT_LIMITS),specifications:z.array(z.object({name:z.string().min(1),prompt:text.min(1),criteria:text.default('')})).default([]),agents:z.array(agentSchema).max(100)}).strict();
export function validateConfig(input){const c=configSchema.parse(input);const names=new Set(),ids=new Set();for(const a of c.agents){a.id ||= id();if(names.has(a.name)||ids.has(a.id))throw new Error('Duplicate agent name or ID');names.add(a.name);ids.add(a.id);}return c;}
export function loadConfig(root){return validateConfig(JSON.parse(readFileSync(join(root,'.codex-teams','team.json'),'utf8')));}
export function saveConfig(root,input){const c=validateConfig(input),file=join(root,'.codex-teams','team.json'),tmp=`${file}.${process.pid}.tmp`;writeFileSync(tmp,`${JSON.stringify(c,null,2)}\n`,{mode:0o600});renameSync(tmp,file);return c;}
