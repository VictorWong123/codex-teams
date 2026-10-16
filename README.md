# Codex Teams

A local MCP server, CLI and dashboard for persistent project teams. Each goal snapshots an editable roster and gives each participating agent an independent durable Codex app-server thread. The goal chooses its lead. Direct messages, owned tasks/dependencies, captured evidence and lead verification coordinate work; idle roster members use no model turns.

**Release status:** portable Linux package/CLI/MCP/dashboard and mocked security tests are verified. Real multi-agent model acceptance and actual Mac installation/LaunchAgent/login/restart remain **PENDING**. Cloud task authentication is not consumer authentication and was not used for model turns. Source visibility and npm registry publication are separate release actions; this package does not assume registry publication. See `VALIDATION.md` in the source repository for release evidence.

## Install

Requires Node **22.22.0 or later**, npm and **Codex CLI exactly 0.163.0**. Node's built-in SQLite may display an experimental warning on Node 22. Existing Codex-managed **ChatGPT login** is required only for model work. There is no API-key/provider fallback, shared account, token copying or credit purchase.

After the repository becomes public:

```sh
npm install -g github:VictorWong123/codex-teams
codex --version                 # codex-cli 0.163.0
codex login                     # your own supported ChatGPT login
codex-teams install             # backs up Codex config; adds one MCP + usage skill
codex-teams service start
codex-teams init /absolute/path/to/project
codex-teams dashboard
```

Alternatively install the release tarball with `npm install -g /path/to/codex-teams-0.1.0.tgz`. From a checkout: `npm ci && npm pack`, then globally install that tarball. The npm registry package name is not claimed as published. Restart Codex after adding the MCP entry/skill. Existing settings and unrelated MCP entries are preserved; conflicting owned paths or an unrelated entry named `codex-teams` cause installation to refuse before modifying configuration.

For macOS background startup, after the portable steps run:

```sh
codex-teams service stop
codex-teams install --launchagent
codex-teams service status
```

This installs one `~/Library/LaunchAgents/com.codex-teams.service.plist` with absolute Node, script and Codex executable paths. The user LaunchAgent starts at login and keeps the service alive while the Mac is awake. Closing the dashboard/chat does not stop work. Sleep/shutdown stops local execution; no Cloud hosting or wake guarantee is implied. Changing Node/package installation paths requires reinstalling the LaunchAgent. Actual `launchctl` operation must be checked on your Mac; Linux verification cannot establish it.

Linux supports the tested detached service and foreground `codex-teams service start --foreground`. There is no Linux boot integration. Windows installation/service behavior has not been validated and is unsupported for this release. The dashboard binds **127.0.0.1 only**. `dashboard` opens a credential URL fragment locally; treat the printed URL as private. It is removed from the address bar and kept in tab session storage; **Lock** clears it. Do not forward the port or expose it publicly.

## Use

Ordinary Codex requests never start teams automatically. Ask explicitly for team execution. Normal MCP tools require the calling chat's `cwd` or an explicit `project`; they never infer the daemon's cwd. The service must be running before CLI/MCP operations other than init/install. CLI finds the nearest `.codex-teams/team.json`; `--project /path/or/registered-id` overrides. Created worktree aliases resolve to the owning project.

```sh
cd /path/to/project
codex-teams roster list
codex-teams roster add editor --json '{"purpose":"Review clarity","instructions":"Inspect and message findings","permission":"read-only","model":"gpt-6.1-sol"}'
codex-teams roster edit editor --json '{"name":"clarity reviewer","instructions":"Check acceptance criteria"}'
codex-teams roster model 'clarity reviewer' --model gpt-6.1-sol
codex-teams roster model 'clarity reviewer' --model inherit
codex-teams roster disable 'clarity reviewer'
codex-teams roster remove 'clarity reviewer'
codex-teams config get
codex-teams config set --file /path/to/team.json
codex-teams goal 'Implement the feature and test its edge cases' --lead developer --participants developer,researcher
codex-teams status
codex-teams message researcher --goal GOAL_ID --body 'Investigate the parser; send findings directly to developer'
codex-teams message developer --body 'A standalone assignment with its own fresh goal'
codex-teams message developer --goal GOAL_ID --body 'FYI: preserve compatibility' --informational
codex-teams tasks list
codex-teams tasks create --goal GOAL_ID --json '{"title":"Investigate","owner":"researcher","criteria":"Concrete source findings","evidenceType":"research"}'
codex-teams notes add --json '{"goalId":"GOAL_ID","title":"Decision","body":"Reusable project knowledge"}'
codex-teams conversations --search parser
codex-teams conversations --sync --search parser
codex-teams participant editor --goal GOAL_ID
codex-teams reopen GOAL_ID --prompt 'Continue from the original conversation and inspect current state'
codex-teams interrupt --goal GOAL_ID --agent developer
codex-teams pause --goal GOAL_ID
codex-teams resume --goal GOAL_ID
codex-teams stop --goal GOAL_ID
codex-teams pause                 # all work in this project
codex-teams resume
codex-teams approvals
codex-teams approvals resolve APPROVAL_ID --json '{"decision":"decline"}'
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
codex-teams recovery inspect --goal GOAL_ID
# Inspect authoritative paginated Codex history, files, Git diff, task state and effects.
codex-teams recovery acknowledge --goal GOAL_ID --acknowledge-side-effects
# Create an explicit fresh message or revise a task after inspecting effects:
codex-teams tasks revise TASK_ID --json '{"instructions":"Continue only the remaining work"}'
codex-teams resume --goal GOAL_ID
```

Acknowledgement never retries held ambiguous deliveries/tasks. Known pre-dispatch cancellations restore only their exact queued message/task. Reopening completed goals reuses their original threads; new goals create fresh threads and receive saved notes with origin-goal references, not entire old transcripts. Conversation search uses persisted authoritative item/turn events; `--sync` explicitly hydrates paginated Codex history after login.

## Self-test and uninstall

```sh
codex-teams self-test             # isolated auth-blocked transport/version probe; zero model turns
codex-teams self-test --live      # your own logged-in machine ONLY; <=12 turns /15 wall minutes
```

The live command creates a disposable dependency-free Git project, submits the slugify goal through the CLI/service path, requires researcher→developer messaging, implementation/tests, captured evidence and lead verification, then independently checks the output. It writes a bounded report and preserves the disposable project for inspection. It refuses platform-managed Cloud authentication. A pending/blocked result is reported honestly; no API-key fallback is offered. The shared initial real-acceptance budget remains unused in this Cloud release (**0 turns**); coordinate later attempts against the same total budget.

```sh
codex-teams service stop
codex-teams uninstall
npm uninstall -g codex-teams
```

With LaunchAgent KeepAlive enabled, `service stop` alone restarts it; uninstall bootouts/removes only the owned LaunchAgent, CLI symlink, usage skill and matching MCP entry. Codex configuration is backed up before MCP edits. All project JSON, state databases, histories, notes, credentials and Git worktrees are preserved. Restart Codex to remove cached tools. No automatic purge exists. Optional state location override: `CODEX_TEAMS_DATA`; port override: `CODEX_TEAMS_PORT`; executable override: `CODEX_BIN`. Use consistent overrides when installing/starting/calling clients. Default state is `~/Library/Application Support/codex-teams` on macOS and `$XDG_STATE_HOME/codex-teams` or `~/.local/state/codex-teams` on Linux.

For source checks: `npm ci`, `npm run check`, `npm test`, `npm audit`, `npm pack --dry-run`. See `SECURITY.md` and `PROTOCOL.md`.
