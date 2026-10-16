# Codex Teams

A local MCP server, CLI and dashboard for persistent project teams. Each goal snapshots an editable roster and gives each participating agent an independent durable Codex app-server thread. The goal chooses its lead. Direct messages, owned tasks/dependencies, captured evidence and lead verification coordinate work; idle roster members use no model turns.

**Release status:** v0.1.3 passed installed Mac QA and the consumer-owned ChatGPT slugify workflow: 4 model turns in 156.17 seconds, direct researcher→developer delivery, verified tasks and captured/independent test evidence. Cloud passed 50 portable/security regressions with no model turns. Across all acceptance attempts, 10 turns /403.666 seconds stayed within the original12-turn/15-minute budget. The final terminal-cleanup recovery follow-up passed portable checks; its separate Mac check remains unreported. See [validation](VALIDATION.md#v013-installed-functionality-qa--passed) for exact revisions and limits, including unreported sleep/wake behavior. The [source repository](https://github.com/VictorWong123/codex-teams) is public; the npm registry package is not published.

The primary command is **`cteam`**. **`codex-teams`** remains a compatible alias. The package/repository, MCP entry/tool names, configuration and environment variables retain their existing Codex Teams names.

## Install

Requires Node **22.22.0 or later**, npm and **Codex CLI exactly 0.163.0**. Node's built-in SQLite may display an experimental warning on Node 22. Existing Codex-managed **ChatGPT login** is required only for model work. There is no API-key/provider fallback, shared account, token copying or credit purchase.

Install the public, acceptance-tested release through its immutable HTTPS tag archive (avoids local Git SSH URL rewrites):

```sh
npm install -g https://github.com/VictorWong123/codex-teams/archive/refs/tags/v0.1.3.tar.gz
codex --version                 # codex-cli 0.163.0
codex login status              # reuse your own existing ChatGPT login
cteam install             # backs up Codex config; adds one MCP + usage skill
cteam service start
cteam init /absolute/path/to/project
```

The dashboard is optional: run `cteam dashboard` only if you want the browser view. If you are not already logged in, use `codex login` with your own supported ChatGPT account before requesting model work.

Credential-free public HTTPS installation, clean-prefix CLI/MCP/dashboard checks and package audits passed. Live Mac acceptance exercised `f596621f41966717e53aac558d4acd044c261e3d`; terminal recovery follow-up `85c6fc4480368f8431001dd432a54461becc54b1` additionally passed the full portable suite and fresh public-archive installation. Existing release tags remain unchanged. See `VALIDATION.md` for artifact/checksum and test boundaries.

Alternatively install the release tarball with `npm install -g /path/to/codex-teams-0.1.3.tgz`. From a checkout: `npm ci && npm pack`, then globally install that tarball. The npm registry package name is not claimed as published. Restart Codex after adding the MCP entry/skill. Existing settings and unrelated MCP entries are preserved; either conflicting CLI alias (`cteam` or `codex-teams`) or an unrelated MCP entry named `codex-teams` cause installation to refuse before modifying configuration. Supported Codex registration is validated in a private staging config; only the owned MCP table is merged into the original text, preserving unrelated empty arrays/comments. Concurrent config edits detected before commit cause a safe retry.

For macOS background startup, after the portable steps run:

```sh
cteam service stop
cteam install --launchagent
cteam service status
```

This installs one `~/Library/LaunchAgents/com.codex-teams.service.plist` with absolute Node, script and Codex executable paths. The user LaunchAgent starts at login and keeps the service alive while the Mac is awake. `cteam service stop` bootouts only the owned job so KeepAlive cannot immediately restart it; the plist stays installed. `cteam service start` bootstraps the owned plist when unloaded or kickstarts the owned loaded job without forcing an active service restart. A separately detached instance is shut down before bootstrap to avoid a port conflict. Ownership checks cover a canonical regular plist, the marker, exact label, expected Node runtime/service script and loaded plist path, and reject executable overrides; changed integration paths require reinstalling. Closing the dashboard/chat does not stop work. Sleep/shutdown stops local execution; no Cloud hosting or wake guarantee is implied. Changing Node/package installation paths requires reinstalling the LaunchAgent. Real `launchctl` stop/start behavior passed on the consumer Mac for v0.1.3; each new installation should still verify its own startup. Linux checks alone cannot establish it.

On the Mac, these are the reversible manual equivalents for the owned integration (real consumer Mac controls passed on v0.1.3):

```sh
launchctl bootout "gui/$(id -u)/com.codex-teams.service"
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.codex-teams.service.plist"
launchctl kickstart "gui/$(id -u)/com.codex-teams.service"
```

Linux supports the tested detached service and foreground `cteam service start --foreground`. There is no Linux boot integration. Windows installation/service behavior has not been validated and is unsupported for this release. The dashboard binds **127.0.0.1 only**. `dashboard` opens a credential URL fragment locally; treat the printed URL as private. It is removed from the address bar and kept in tab session storage; **Lock** clears it. Do not forward the port or expose it publicly.

## Use

The CLI and MCP are first-class clients of the same local service. You can configure roles, submit goals, message agents and control work entirely from a terminal or a Codex chat using MCP. A browser is never required. Each participating agent gets its own durable Codex thread for that goal.

For a headless build, choose an existing project directory and add any role names you want. Initialize each project once; skip `cteam init` below if it is already initialized:

```sh
cteam service start
cteam init /absolute/path/to/project
cd /absolute/path/to/project
cteam roster add design-lead --json '{"purpose":"Plan and verify the build","instructions":"Break the goal into owned tasks. Inspect the builder workspace and captured tests before verifying completion.","model":"gpt-6.1-sol","permission":"read-only"}'
cteam roster add source-scout --json '{"purpose":"Research the project","instructions":"Inspect relevant project sources and directly message concrete findings to builder.","model":"gpt-6.1-sol","permission":"read-only"}'
cteam roster add builder --json '{"purpose":"Implement and test","instructions":"Implement assigned tasks, run focused tests and report captured evidence to design-lead.","model":"gpt-6.1-sol","permission":"inherit"}'
cteam goal 'Build the requested feature, add edge-case tests and have the lead verify the result' --lead design-lead --participants design-lead,source-scout,builder
```

Copy the returned goal `id` into `GOAL_ID` below. Only the selected participants join this goal; the starter roster remains available for other work. Model work uses your existing Codex-managed ChatGPT login.

```sh
cteam message source-scout --goal GOAL_ID --body 'Inspect the relevant interfaces and send findings directly to builder'
cteam status
```

The service is detached by default. CLI commands return while agents work; exiting the CLI terminal does not stop that service while the host is awake. Use goal controls when needed, and `service stop` to stop the local daemon:

```sh
cteam pause --goal GOAL_ID
cteam resume --goal GOAL_ID
cteam stop --goal GOAL_ID
cteam service stop
```

Ordinary Codex requests never start teams automatically. Ask explicitly for team execution. Normal MCP tools require the calling chat's `cwd` or an explicit `project`; they never infer the daemon's cwd. The service must be running before CLI/MCP operations other than init/install. CLI finds the nearest `.codex-teams/team.json`; `--project /path/or/registered-id` overrides. Created worktree aliases resolve to the owning project.

```sh
cd /path/to/project
cteam roster list
cteam roster add editor --json '{"purpose":"Review clarity","instructions":"Inspect and message findings","permission":"read-only","model":"gpt-6.1-sol"}'
cteam roster edit editor --json '{"name":"clarity reviewer","instructions":"Check acceptance criteria"}'
cteam roster model 'clarity reviewer' --model gpt-6.1-sol
cteam roster model 'clarity reviewer' --model inherit
cteam roster disable 'clarity reviewer'
cteam roster remove 'clarity reviewer'
cteam config get
cteam config set --file /path/to/team.json
cteam goal 'Implement the feature and test its edge cases' --lead developer --participants developer,researcher
cteam status
cteam message researcher --goal GOAL_ID --body 'Investigate the parser; send findings directly to developer'
cteam message developer --body 'A standalone assignment with its own fresh goal'
cteam message developer --goal GOAL_ID --body 'FYI: preserve compatibility' --informational
cteam tasks list
cteam tasks create --goal GOAL_ID --json '{"title":"Investigate","owner":"researcher","criteria":"Concrete source findings","evidenceType":"research"}'
cteam notes add --json '{"goalId":"GOAL_ID","title":"Decision","body":"Reusable project knowledge"}'
cteam conversations --search parser
cteam conversations --sync --search parser
cteam participant editor --goal GOAL_ID
cteam reopen GOAL_ID --prompt 'Continue from the original conversation and inspect current state'
cteam interrupt --goal GOAL_ID --agent developer
cteam pause --goal GOAL_ID
cteam resume --goal GOAL_ID
cteam stop --goal GOAL_ID
cteam pause                 # all work in this project
cteam resume
cteam approvals
cteam approvals resolve APPROVAL_ID --json '{"decision":"decline"}'
```

The dashboard supports the same roster/configuration/specification edits, participants/lead selection, goals, messages, conversations, tasks/dependencies, evidence, notes, limits/usage, activity, interruption, goal/project controls and human approval responses. The dashboard can create tasks, request corrections and verify captured evidence as the goal lead, and displays criteria, dependencies and ownership. Save reusable goals in canonical JSON `specifications: [{"name":"…","prompt":"…","criteria":"…"}]`.

Normal MCP tools: `team_initialize`, `team_goal`, `team_message`, `team_status`, `team_control`, `team_interrupt`, `team_config`, `team_roster`, `team_reopen`, `team_add_participant`, `team_tasks`, `team_notes`, `team_conversations`, `team_approvals`, `team_recovery`, `team_service`, `team_dashboard`. Member MCP exposes only scoped status, task creation/claim/revision/verification, messages, notes and completion; identity is bound to service credentials. Members cannot approve human requests. Inherited MCP servers are disabled per member thread; their on-disk settings are preserved.

## Configuration, permissions and evidence

`.codex-teams/team.json` is validated canonical JSON. Agent names/purposes/instructions are arbitrary, stable IDs survive renames, `enabled:false` keeps an agent out of future goals, and missing/null `model` inherits `defaultModel` (`gpt-6.1-sol` initially). Explicit agent models override it. Active goal snapshots stay unchanged by roster/model edits. Starter lead/researcher have explicit `permission:"read-only"`; developer has `"inherit"`. Permission follows this editable field, never a role name. Other Codex permissions/approval settings and managed restrictions remain inherited. API keys are removed from child environment; `account/read` must confirm ChatGPT before every model turn, and provider/model fallback is rejected.

One writer uses the original project workspace. If a goal has multiple writable participants, each new writable participant gets a Git worktree/branch under the state directory. Git must support worktrees and the project needs a commit. The dashboard/status shows every participant workspace; the lead must inspect/test the actual developer workspace. **No automatic merge or worktree deletion** occurs. Integrate reviewed branches yourself, preserving dirty/unrelated work. Adding an agent to a goal updates that goal's roster snapshot and initializes a thread without running a model turn; missing login leaves explicit thread initialization blocked.

Messages persist before dispatch; actionable messages wake idle recipients and queue behind active turns. Informational messages are included in the recipient's next real prompt and never cause acknowledgment loops. Ready owned tasks dispatch after dependencies are verified. One turn runs per participant. Idempotency keys bind message scope/sender/payload; claims bind task/agent/attempt. Goals have turn/time/token caps, global/project concurrency, approval-aware active-time accounting, inactivity and repeated-exchange blocking. Time/token caps interrupt active work; turn caps allow the last permitted turn to finish and block the next. Reported tokens are advisory; money/cost is **unknown**.

Implementation tasks default to `evidenceType:"test"`: captured successful supported test commands need a positive passing test summary. Run commands separately (`npm test`, `node --test`, `pytest`, `cargo test`, `go test`, supported common JS runners); shell pipelines, comments, substitutions, compound commands and help/version/dry-run output are rejected as completion evidence. Research tasks use `evidenceType:"research"` with captured source-reading commands or nonempty actual returned search results containing sources and substantive text. Final model text and trivial `true`/`echo` do not satisfy evidence. Evidence binds to the current task attempt; corrections invalidate prior-attempt verification. The selected lead must inspect applicability and call verification. This is an audit gate, not a proof that arbitrary code/tests are correct or a security boundary against a malicious same-user model.

## Approvals and recovery

Approvals are human-only and method-aware. Command/file responses use `{"decision":"accept|decline|cancel"}`. Permissions use `{"permissions":{},"scope":"turn"}` (only requested subsets can be granted); input requests use `{"answers":{"question-id":{"answers":["text"]}}}`; elicitation uses `{"action":"decline","content":null,"_meta":null}`. Inspect full request parameters before responding. Unsupported request methods fail closed. Unanswered requests remain blocked; restarted/interrupted requests expire.

Restart marks running/dispatching/starting ambiguities as **recovery_review** and blocks scheduling. No ambiguous side effect, dispatching message or claimed task is blindly repeated. To reconcile:

```sh
cteam recovery inspect --goal GOAL_ID
# Inspect authoritative paginated Codex history, files, Git diff, task state and effects.
cteam recovery acknowledge --goal GOAL_ID --acknowledge-side-effects
# Create an explicit fresh message or revise a task after inspecting effects:
cteam tasks revise TASK_ID --json '{"instructions":"Continue only the remaining work"}'
cteam resume --goal GOAL_ID
```

Acknowledgement never retries held ambiguous deliveries/tasks. Known pre-dispatch cancellations restore only their exact queued message/task. Reopening completed goals reuses their original threads; new goals create fresh threads and receive saved notes with origin-goal references, not entire old transcripts. Conversation search uses persisted authoritative item/turn events; `--sync` explicitly hydrates paginated Codex history after login.

## Self-test and uninstall

```sh
cteam self-test             # isolated auth-blocked transport/version probe; zero model turns
cteam self-test --live      # your own logged-in machine ONLY; <=12 turns /15 wall minutes
```

The live command creates a disposable dependency-free Git project, submits the slugify goal through the CLI/service path, requires researcher→developer messaging, implementation/tests, captured evidence and lead verification, then independently checks the output. It writes a bounded report and preserves the disposable project for inspection. It refuses platform-managed Cloud authentication. A pending/blocked result is reported honestly; no API-key fallback is offered. Cloud used no model turns. Consumer acceptance across all attempts used **10 aggregate model turns /403.666 seconds**, including the earlier failed1-turn attempt, successful5-turn v0.1.2 rerun and successful4-turn v0.1.3 QA, within the shared12-turn/15-minute budget. No further acceptance turns are needed. An internal harness can request a strictly smaller allowance; no CLI budget-widening flags are exposed.

```sh
cteam service stop
cteam uninstall
npm uninstall -g codex-teams
```

`service stop` unloads the owned LaunchAgent and also shuts down any separately detached service. `service start` reverses that stop without rewriting configuration. Uninstall bootouts/removes only the owned LaunchAgent, both matching CLI symlinks, usage skill and matching MCP entry. Codex configuration is backed up before MCP edits. All project JSON, state databases, histories, notes, credentials and Git worktrees are preserved. Restart Codex to remove cached tools. No automatic purge exists. Optional state location override: `CODEX_TEAMS_DATA`; port override: `CODEX_TEAMS_PORT`; executable override: `CODEX_BIN`. Use consistent overrides when installing/starting/calling clients. Default state is `~/Library/Application Support/codex-teams` on macOS and `$XDG_STATE_HOME/codex-teams` or `~/.local/state/codex-teams` on Linux.

For source checks: `npm ci`, `npm run check`, `npm test`, `npm audit`, `npm pack --dry-run`. See `SECURITY.md` and `PROTOCOL.md`.
