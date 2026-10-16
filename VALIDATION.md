# Release validation — 2026-10-16

Implementation started from exact handoff `2e69034980c79720136db6e9057c7a2c7493d5ca`. This document distinguishes portable evidence from unperformed consumer-host/model acceptance. Final commit, tarball checksum, source visibility and push evidence are reported with the release in the Cloud chat.

## Portable/mocked checks

- Syntax checks pass for every source/dashboard/script module.
- Twenty-one substantive automated regressions cover validated arbitrary rosters/stable snapshots/model inheritance; goal/message/claim idempotency; task dependencies/current-attempt evidence; misleading/trivial commands; method-aware approval subsets; pre-response event buffering; stale/duplicate turn item isolation; informational delivery; dispatch recovery; terminal-goal isolation; time/token/turn caps and approval-aware accounting; missing/failed/unexpected member tools; Host/Origin/CSRF/scope/body limits; setup cancellation queue rollback; and cross-goal agent/writable-workspace serialization.
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
- Packed tarball installed globally into a clean temporary npm prefix and ran from a fresh cwd, without source node_modules assumptions. CLI init/config/roster/service/dashboard routes, MCP initialize/list/call and explicit context rejection passed. Final repack/reinstall is performed after code freeze.
- Real isolated Codex configuration install/reinstall/uninstall preserved existing model/settings/unrelated MCP, refused an unrelated CLI collision before mutation, registered/removed only owned CLI/skill/MCP, and preserved a histories sentinel. These are portable installer checks, not a macOS LaunchAgent test.
- Independent read-only security, frontend and test reviews returned actionable findings to the sole implementation owner. Fixed cross-goal idempotency disclosure, stale-turn evidence/completion injection, inherited human MCP exposure, invalid disabled MCP transports, control/setup races, lost informational delivery, preturn queue loss, stale-attempt evidence, false evidence from claims/help/query-only searches, terminal cross-goal failures, goal-global pause and frontend draft/search/recovery issues. Final targeted review probes passed.
- Source/reachable history and files allowlist reviewed for credentials/private keys/session state/user-home literals; no credentials or runtime state were identified. Private state/logs/databases/node_modules/scratch are excluded. Runtime directories stay private; distributable file modes are normalized.
- npm registry readiness was checked read-only: `npm whoami` returned ENEEDAUTH. No npm registry publication is claimed or attempted. A public GitHub source installation and packed tarball satisfy distribution authorization.

## Pending, not passed

- **0 real model turns consumed.** Consumer-owned ChatGPT-authenticated slugify acceptance remains PENDING, capped at12 turns/15 wall minutes total. Cloud's inherited task authentication was deliberately not used. Use `codex-teams self-test --live` on the awake consumer machine; inspect its report and disposable project.
- Actual Mac installation, login reuse, Codex restart, launchctl startup/restart/uninstall and sleep behavior remain PENDING. Linux evidence cannot establish these.
- Public repository visibility is separate from pushed source. Cloud `gh` API attempts were Forbidden by configured network policy; connected GitHub tools did not expose a visibility mutation. If still private after push, an authorized GitHub owner must make only `VictorWong123/codex-teams` public (Settings → General → Danger Zone, or `gh repo edit VictorWong123/codex-teams --visibility public --accept-visibility-change-consequences`). Cloud environment privacy remains Only me. Exact final visibility is reported in the release chat.
