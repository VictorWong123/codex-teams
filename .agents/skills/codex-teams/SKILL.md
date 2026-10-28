---
name: codex-teams
description: Choose and use Codex Teams when explicitly requested, including native teams in Codex Cloud and the persistent runner on a user-managed computer. Do not start teams for ordinary requests.
---
<!-- codex-teams-owned-v1 -->

# Choose the execution mode first

Honor an explicit mode choice. Check the current workspace and tools; a local
installation on another machine does not establish Cloud availability. Do not
start both runners for the same goal or transfer an existing goal silently.

## Managed Codex Cloud or an explicit native chat request

Use the active chat's native subagents. Read the complete native workflow before
delegating: run `cteam native instructions` if this environment has that command,
or read `plugins/codex-teams-native/skills/codex-teams-native/SKILL.md` from the
Codex Teams checkout. If the separately installed `codex-teams-native` skill is
available, read it instead. Resolve paths in the current environment, not the Mac.

Check actual spawn, messaging/follow-up, wait/status and interruption tools and a
usable project workspace. Missing capabilities mean UNSUPPORTED. A CLI status
report or installed skill cannot establish native tool availability. Follow the
native workflow's finite budgets, single writer, evidence checks and cleanup.

No service, MCP registration, separate login, API key or nested Codex app-server
is needed for native mode. Never copy credentials, change managed authentication,
weaken sandbox/approval controls, or create a remote bridge to the local service.
If the workflow is missing, report the setup step: from a reviewed Codex Teams
checkout, `node scripts/setup-cloud.mjs` installs it for this machine's user only.
It does not launch agents or publish an environment.

## Persistent runner on a user-managed machine

Use this when the user selects persistent CLI/MCP/dashboard goals. The service
and project must be on that machine, with the user's own supported ChatGPT login.
Use `cteam service start`; always supply the calling chat cwd or an explicit
project override to team tools. Initialize projects explicitly. Use `team_status`
before resuming goals. Each participant has its own durable Codex thread; inspect
evidence and human approval controls. Never copy credentials, fall back to API
keys, autoapprove, or expose the loopback service publicly. Follow the README for
installation, recovery and stopping. `codex-teams` remains a CLI alias for `cteam`.

## A request for 24/7 operation

Explain the separate hosting requirement. Native teams run within an active
task; they do not schedule the next task or guarantee execution after it ends.
The persistent service needs an awake user-managed host; installing it in a
managed Cloud task does not establish continuous hosting. Neither mode promises
unlimited usage. Do not enable paid hosting, bypass limits, create retry loops,
or claim unattended recovery from a skill installation. Report the supported
setup and remaining hosting/lifecycle requirements explicitly.
