# Codex Teams implementation and Cloud handoff

## Contract

Build the smallest complete global Codex agent-team orchestrator: persistent,
editable project teams; separate durable Codex conversations per agent per goal;
explicit messages and shared task coordination; global CLI and user MCP; a local
dashboard; a background macOS service; safe persistence and recovery.

Original implementation was explicitly local. The user subsequently requested
continuing development in Codex Cloud so their Mac can sleep. Continue portable
implementation and verification remotely. Final installation and real macOS
service/authentication verification require the Mac to be awake and accessible.
Do not claim Cloud installation changes the Mac.

## Starting state

- Private canonical repository: `https://github.com/VictorWong123/codex-teams`.
- Initial scaffold commit: `d490d21d9661c00952eb008e63a08034300242dc`.
- Scaffold is untested and incomplete. It is NOT a working installation.
- Dependencies already locked: `@modelcontextprotocol/sdk` 1.21.1 and `zod` 3.25.76.
- The original Mac has Codex CLI 0.163.0, Node 22.22.1, npm, Git, launchctl,
  and `~/.local/bin` on PATH. Built-in `node:sqlite` works but is experimental.
- Original CLI reports `Logged in using ChatGPT`; configured model is
  `gpt-6.1-sol`. Do not upload or copy its authentication files or tokens.
- No real Codex model turn, global MCP registration, LaunchAgent installation,
  dashboard validation, or tests have happened yet.
- Earlier npm install reported one high advisory. Investigate and resolve
  supported dependency updates before installation; do not blindly force upgrades.

## Team and conversation model

- Project teams persist until removed. Roles are free text, never an enum.
- Editable agents have stable IDs, name, purpose, instructions, enabled state,
  and default model. Starter templates: coordinator, researcher, developer.
- Default model Sol (`gpt-6.1-sol`), with project and per-agent overrides.
- Dashboard supports add/edit/disable/remove agents and participant selection.
- Each goal chooses its lead agent. Coordination is an assignment, not a fixed role.
- Snapshot participant configuration when a goal starts. Later roster edits affect
  future goals. Adding an agent to an active goal explicitly creates its thread.
- Each agent gets one independent durable app-server thread per goal. Subtasks
  and messages reuse it; reopen resumes it; new goals get fresh threads.
- Completed conversations remain searchable. Save reusable project notes with
  originating goal references; new goals get notes, not whole old transcripts.
- Messaging an agent without a selected goal creates a standalone assignment.
- Idle roster entries consume no model turns.

## Integration and architecture

- Use real Codex app-server stdio JSONL JSON-RPC (wire omits `jsonrpc`). Do not
  replace with mock agents or one parent chat/subagent simulation.
- Official docs: `https://learn.chatgpt.com/docs/app-server` and
  `https://learn.chatgpt.com/docs/codex-sdk`. App-server fits streamed events,
  conversation histories, approval requests, and account information.
- Generate matching protocol definitions from CLI 0.163.0. Check version
  compatibility; do not silently upgrade or assume future schemas match.
- Initialize once, acknowledge initialized, create/resume distinct threads,
  start/interrupt turns, persist authoritative item/turn events, paginate history.
- Reuse Codex-managed ChatGPT auth. Reject API-key/other separately billed auth
  and provider fallback before a model turn. Never read/copy OAuth credentials.
- One service owns scheduling/database access/app-server children. CLI and MCP
  are thin clients; disconnecting initiating clients must not stop work.
- Use Node ESM, built-in HTTP/SQLite/test runner, official MCP SDK and minimal
  required peers; plain HTML/CSS/JS dashboard. Avoid unnecessary frameworks.
- Global project registry; separate databases per project for configuration,
  snapshots, goals, agents, threads, tasks, messages, deliveries, approvals,
  evidence, usage, and events. User state stays outside source repositories.
- `.codex-teams/team.json` contains project roster/defaults/limits.
- CLI resolves nearest initialized project from cwd; `--project <path-or-id>`
  overrides. Worktree aliases map to owning project.
- Normal Codex MCP calls require chat `cwd` or explicit project override. Never
  use MCP daemon cwd or a single global current project as implicit context.
- Separate authenticated member tools bind identity/project/goal to service-issued
  credentials. Do not trust a model-provided sender ID. Members cannot call human
  approval APIs or control unrelated projects.

## Coordination, permissions, reliability

- Lead decomposes goal into tasks with criteria, dependencies, owners; scheduler
  dispatches ready tasks; lead verifies outcomes and requests corrections.
- All participants can message directly, share findings, request help, and report
  blockers. Persist first. Actionable messages wake idle recipients; active
  recipients get queued delivery after their turn. Informational messages do not
  start endless acknowledgments.
- One turn at a time per agent. Transactional task claims, unique task attempts,
  idempotency keys, and delivery IDs prevent duplicate dispatch and effects.
- Completion requires captured command/test evidence or concrete research
  artifacts plus lead verification. Model-supplied claims alone cannot pass.
- Preserve inherited Codex permissions/managed restrictions; narrow researchers
  to read-only. Never autoapprove, bypass sandbox, or widen permissions silently.
- Persist and surface method-aware command/file/permissions/input/elicitation
  requests to human CLI/dashboard. Unanswered approvals remain blocked.
- Use worktrees for simultaneous editing agents; no silent automatic merge,
  dirty worktree deletion, or unrelated file changes. Communication ignores branches.
- Recovery reconciles saved turn IDs/history with Codex before scheduling.
  Ambiguous dispatches and interrupted side effects enter recovery review,
  never blindly repeat actions.
- Default global/project concurrency 2/2, per-goal 30 turns and 30 active minutes.
  Configurable token cap; count reported usage safely; show unknown costs as unknown.
- Detect 5-minute inactivity excluding approval waits, and three repeated
  actionable exchanges without progress. Interrupt/mark blocked visibly.
- Pause interrupts active work and keeps queues. Resume reconciles first. Stop
  cancels current goal/pending dispatch, retains history.
- Do not buy credits, automatically consume account resets, or imply subscription
  includes API spending. Rate-limit/account usage is advisory where supported.

## Dashboard, CLI, installation

- Dashboard: projects, agent cards (purpose/model/status/assignment), live activity,
  conversations, tasks/dependencies, messages, evidence, limits/usage, approvals.
- Controls: roster changes, select participants/lead, submit goals, message any
  agent, add participant to active goal, interrupt, pause/resume, stop, approve/deny.
- Loopback binding only; authenticate local clients; Origin checks and CSRF
  protection; safely render untrusted text. Never expose master secrets to agents.
- CLI/MCP equivalents: init, configuration/roster, goal submit/reopen, message,
  status, tasks/conversations/notes, interrupt, pause/resume, stop, approval response.
- CLI at `~/.local/bin/codex-teams`, one LaunchAgent with absolute runtime paths.
  Support service start/status/stop and dashboard open.
- Back up existing Codex config and register one MCP entry using supported
  `codex mcp add`; verify existing entries/settings survive. Do not replace config.
- Install concise discoverable global skill instructions: use team tools only
  when user requests team execution; supply chat cwd/override; no auto-start.
- Safe uninstall removes only owned CLI/MCP/skill/LaunchAgent, preserving data,
  project configuration, and worktrees unless user explicitly purges.
- Document exact install/start/shutdown/uninstall/recovery commands and manual
  `codex login`/Codex restart steps if necessary.

## Known scaffold defects: fix first

1. Active thread mapping is populated after `turn/start` response. App-server may
   emit events/approvals before response: register mapping first and reconcile IDs.
2. Recovery only checks `running`, omitting `dispatching`/starting ambiguity.
3. Member http-client reads/sends master token. Use separate scoped authentication;
   reject member credentials on human APIs even without scope headers.
4. Approval handler always returns `{decision}`. Permission requests need
   `{permissions, scope}`, input requests need `{answers}`, elicitation needs
   `{action, content}`. Validate by method and safely handle unsupported requests.
5. Effective read-only researcher restrictions were not yet applied.
6. Time budget currently counts wall time including pause/blocked waits.
7. The core has not had syntax/runtime tests. Inspect other defects rather than
   trusting the scaffold. CLI, dashboard, installer, docs, tests are missing.

## Acceptance evidence

- Mocked tests first: scheduling/dependencies, serialization/idempotency,
  actionable vs informational delivery, event ordering, crash boundaries,
  approvals, scope/auth rejection, limits/stalls/loops, multi-project isolation.
- Test renamed starter roles, fourth arbitrary agent and different model;
  fresh goals vs reopened threads, snapshots and saved notes across goals.
- Verify CLI outside repo; MCP from fresh client; service restart retains threads;
  closing clients/dashboard does not end work; safe config install/uninstall.
- Real acceptance: disposable dependency-free Node Git project. Goal: named
  `slugify(text)` export in `slugify.js`, Node tests, `npm test`. Criteria:
  `Hello World` -> `hello-world`; `  Hello,   World!  ` -> `hello-world`;
  `one---two__three` -> `one-two-three`; empty/punctuation-only -> empty;
  non-string throws TypeError. Researcher explicitly messages developer;
  developer implements/tests; lead inspects diff and verifies captured test evidence.
- Real run cap: 12 model turns and 15 minutes TOTAL. No real turns consumed yet.
  If Cloud cannot support ChatGPT-authenticated nested app-server, do not add API
  credentials or fake a pass; retain real Mac run as clearly documented pending.
- Review final implementation with applicable frontend/security/test reviewers;
  owner fixes actionable findings. Distinguish mocked checks from real runs.
- Report precise limitations. Mac install/service/auth tests cannot be claimed
  from Cloud. Do not leave unrelated servers or temporary artifacts running.
