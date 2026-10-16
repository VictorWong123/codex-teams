import { homedir } from 'node:os';
import { join } from 'node:path';
export const DEFAULT_MODEL = 'gpt-6.1-sol';
export const DEFAULT_LIMITS = { globalConcurrency: 2, projectConcurrency: 2, turns: 30, minutes: 30, tokens: null, stallMinutes: 5 };
export const STARTER_AGENTS = [
 {name:'coordinator',purpose:'Decompose goals, assign tasks, and verify captured evidence.',instructions:'Coordinate using shared tasks. Require captured evidence before completion.',enabled:true,permission:'read-only'},
 {name:'researcher',purpose:'Research and share sourced findings.',instructions:'Research assigned questions and directly message useful findings to teammates.',enabled:true,permission:'read-only'},
 {name:'developer',purpose:'Implement changes and test them.',instructions:'Implement assigned tasks, run tests, and report exact evidence. Preserve unrelated work.',enabled:true,permission:'inherit'}
];
export const PROTOCOL_VERSION = '0.163.0';
export const SERVICE_PORT = Number(process.env.CODEX_TEAMS_PORT || 47831);
export const DATA_DIR = process.env.CODEX_TEAMS_DATA || (process.platform==='darwin' ? join(homedir(),'Library','Application Support','codex-teams') : join(process.env.XDG_STATE_HOME || join(homedir(),'.local','state'),'codex-teams'));
