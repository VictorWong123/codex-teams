import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DEFAULT_LIMITS, DEFAULT_MODEL, STARTER_AGENTS } from "./constants.js";
import { Registry } from "./db.js";

export function initializeProject(path=process.cwd(),options={}){
  const root=realpathSync(resolve(path)), dir=join(root,".codex-teams"), file=join(dir,"team.json");
  if(existsSync(file)&&!options.force)throw new Error("Team is already initialized; use roster commands to edit it");
  mkdirSync(dir,{recursive:true});
  const config={version:1,name:options.name||root.split("/").at(-1),defaultModel:DEFAULT_MODEL,paused:false,limits:{...DEFAULT_LIMITS},agents:structuredClone(STARTER_AGENTS)};
  writeFileSync(file,`${JSON.stringify(config,null,2)}\n`);
  return {project:new Registry().register(root),config};
}
