export const DEFAULT_MODEL = "gpt-6.1-sol";
export const DEFAULT_LIMITS = { globalConcurrency: 2, projectConcurrency: 2, turns: 30, minutes: 30, tokens: null };
export const STARTER_AGENTS = [
  { name: "coordinator", purpose: "Break goals into tasks, assign work, and verify evidence.", instructions: "Coordinate the team. Require concrete evidence before declaring a goal complete.", model: DEFAULT_MODEL, enabled: true },
  { name: "researcher", purpose: "Investigate approaches and share sourced findings.", instructions: "Research the assigned question and message useful findings to teammates.", model: DEFAULT_MODEL, enabled: true },
  { name: "developer", purpose: "Implement focused changes and test them.", instructions: "Implement assigned tasks, preserve unrelated work, and report exact test evidence.", model: DEFAULT_MODEL, enabled: true }
];
export const PROTOCOL_VERSION = "0.163";
export const SERVICE_PORT = Number(process.env.CODEX_TEAMS_PORT || 47831);
export const DATA_DIR = process.env.CODEX_TEAMS_DATA || `${process.env.HOME}/Library/Application Support/codex-teams`;
