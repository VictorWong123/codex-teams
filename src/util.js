import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { DATA_DIR } from "./constants.js";
import { dirname, join, resolve } from "node:path";

export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const json = (value) => JSON.stringify(value);
export const parse = (value, fallback = null) => { try { return JSON.parse(value) ?? fallback; } catch { return fallback; } };
export function ensureDir(path) { mkdirSync(path, { recursive: true, mode: 0o700 }); return path; }
export function projectId(path) { return createHash("sha256").update(realpathSync(path)).digest("hex").slice(0, 16); }
export function token() { return randomBytes(32).toString("hex"); }
export function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }
export function resolveProject(start, override) {
  let current = override ? resolve(start || process.cwd(), override) : resolve(start || process.cwd());
  if (!statSync(current).isDirectory()) current = dirname(current);
  try{const reg=readJson(join(DATA_DIR,'registry.json'));const alias=reg.projects.find(p=>(p.aliases||[]).some(a=>current===a||current.startsWith(a+'/')));if(alias)return {root:alias.root,config:readJson(join(alias.root,'.codex-teams','team.json'))};}catch{}
  while (true) {
    try { return { root: current, config: readJson(join(current, ".codex-teams", "team.json")) }; } catch (e) { if(e.code!=="ENOENT")throw new Error(`Invalid team configuration at ${join(current,".codex-teams","team.json")}: ${e.message}`); }
    const parent = dirname(current);
    if (parent === current) throw new Error("No .codex-teams/team.json found; run cteam init in the project");
    current = parent;
  }
}

export function idSegment(value){if(typeof value!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(value))throw new Error('Expected a UUID identifier');return encodeURIComponent(value);}
