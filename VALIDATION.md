# Release validation — 2026-10-16

Implementation started from exact handoff `2e69034980c79720136db6e9057c7a2c7493d5ca`. This document distinguishes portable evidence from unperformed consumer-host/model acceptance. The public implementation revision is `264b4c137374aca9d7c71017a7cd841a8f459853`. Tarball checksums and final documentation commit/push evidence are reported with the release in the Cloud chat.

## Portable/mocked checks

- Syntax checks pass for every source/dashboard/script module.
- Thirty-five substantive automated regressions cover validated arbitrary rosters/stable snapshots/model inheritance; goal/message/claim idempotency; task dependencies/current-attempt evidence; misleading/trivial commands; method-aware approval subsets; pre-response event buffering; stale/duplicate turn item isolation; informational delivery; dispatch recovery; terminal-goal isolation; time/token/turn caps and approval-aware accounting; missing/failed/unexpected member tools; Host/Origin/CSRF/scope/body limits; setup cancellation queue rollback; cross-goal agent/writable-workspace serialization; and nine mocked LaunchAgent control tests covering exact command selection, unloaded idempotency, ownership/path refusal, failure handling and portable bypass. Five alias/MCP tests additionally cover the primary `cteam` bin and compatible `codex-teams`, both-path collision preflight, matching relative npm links, preservation of unrelated files/links on uninstall, and unchanged normal MCP identity/tools.
- Portable tests were exercised on the user's required Node22.22.1 and current Node24 runtime. These mocked app-server tests do not establish model behavior.
- Independent mocked HTTP scenarios additionally exercised original-thread reopen, fresh-goal thread IDs, originating-goal notes, explicit active participant thread creation, goal-local pause, saturated concurrency and approval-wait exclusion.
- Chromium exercised roster/configuration saves, arbitrary agent fields/model/permissions, goals/standalone assignment, safe literal hostile text, mobile390px layout, expanded details retained across polls, dirty JSON retained and project-bound, project changes cancel agent drafts, saved/custom goal selection, persistent recovery inspection, archive search beyond latest500 retained after blur/polls/manual refresh, and Lock credential clearing. No script execution/XSS, overflow or browser errors were observed.

## Actual Codex0.163 protocol checks, zero model turns

- Generated and retained matching request/response definitions and dependency closure.
- Auth-free production path `prepareParticipant → config/read → thread/start → mcpServerStatus/list` with synthetic isolated Codex home disabled every inherited human MCP alias and exposed exactly the connected scoped member tool set.
- Actual `mcpServer/tool/call` to member `team_status` returned the correct isolated project/goal. No `turn/start`, OAuth credential reads/copies, API keys or platform account authentication were used.
- Isolated unauthenticated account check reported model work blocked while configuration/dashboard/health remained usable. The bundled default self-test produced PENDING with0 model turns.
- Actual Codex `skills/list` discovered the installed global usage skill exactly once, enabled, user scope.

## Packaging/security review

- MCP SDK updated from vulnerable1.21.1 to1.32.1. `npm audit` returned zero known advisories across all severities after update.
- Packed tarball installed globally into a clean temporary npm prefix and ran from a fresh cwd, without source node_modules assumptions. CLI init/config/roster/service/dashboard routes, MCP initialize/list/call and explicit context rejection passed. The final implementation tarball was repacked and reinstalled after code freeze.
- Real isolated Codex configuration install/reinstall/uninstall preserved existing model/settings/unrelated MCP, refused an unrelated CLI collision before mutation, registered/removed only owned CLI/skill/MCP, and preserved a histories sentinel. These are portable installer checks, not a macOS LaunchAgent test.
- Independent read-only security, frontend and test reviews returned actionable findings to the sole implementation owner. Fixed cross-goal idempotency disclosure, stale-turn evidence/completion injection, inherited human MCP exposure, invalid disabled MCP transports, control/setup races, lost informational delivery, preturn queue loss, stale-attempt evidence, false evidence from claims/help/query-only searches, terminal cross-goal failures, goal-global pause and frontend draft/search/recovery issues. Final targeted review probes passed.
- Source/reachable history and files allowlist reviewed for credentials/private keys/session state/user-home literals; no credentials or runtime state were identified. Private state/logs/databases/node_modules/scratch are excluded. Runtime directories stay private; distributable file modes are normalized.
- npm registry readiness was checked read-only: `npm whoami` returned ENEEDAUTH. No npm registry publication is claimed or attempted. A public GitHub source installation and packed tarball satisfy distribution authorization.

## Public source visibility

- On2026-10-16 the authorized owner made only `VictorWong123/codex-teams` public from the initiating chat. `gh repo edit … --visibility public --accept-visibility-change-consequences` exited0; `gh repo view` reported PUBLIC; an unauthenticated repository API read reported `private:false`.
- This Cloud task independently confirmed `visibility:public` through the connected GitHub repository tool. Public implementation revision: `264b4c137374aca9d7c71017a7cd841a8f459853`.
- Credential-free public source retrieval/install passed using `git+https://github.com/VictorWong123/codex-teams.git#264b4c137374aca9d7c71017a7cd841a8f459853` in a fresh temporary npm prefix/cwd/cache and isolated HOME with empty npm configs. Global/system Git configs, credential helpers/extra headers, askpass, interactive authentication, GH/npm tokens and SSH agent were disabled/omitted for that child process. Explicit HTTPS Git retrieval matched public main. The required managed proxy/CA were preserved; this check does not claim to bypass the managed proxy or its policy.
- The installed public baseline passed CLI help/init/roster/config, MCP initialize/list17tools/status/roster/service/approvals and missing-cwd rejection, auth-block with0 model turns, actual Chromium dashboard/save/XSS/mobile checks, and portable service status/stop. Exact standalone command: `npm install -g 'git+https://github.com/VictorWong123/codex-teams.git#264b4c137374aca9d7c71017a7cd841a8f459853'`.
- The versioned `v0.1.0` release adds owned LaunchAgent-aware stop/start. Final commit/tag installation gates are reported in the release chat after the tag is pushed; baseline public install evidence does not claim to test a later tag. Launchctl selection is mocked; real Mac operation remains pending.
- Earlier Cloud `gh` requests were Forbidden under the configured network policy. That historical limitation was resolved for this release by the owner's authorized visibility action; it is no longer a pending release requirement. Environment privacy remains **Only me**; no unrelated repository access or global network policy was changed.

## Pending, not passed

- **0 real model turns consumed.** Consumer-owned ChatGPT-authenticated slugify acceptance remains PENDING, capped at12 turns/15 wall minutes total. Cloud's inherited task authentication was deliberately not used. Use `cteam self-test --live` on the awake consumer machine; inspect its report and disposable project.
- Actual Mac installation, login reuse, Codex restart, launchctl startup/restart/uninstall and sleep behavior remain PENDING. Linux evidence cannot establish these.
