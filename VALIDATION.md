# Release validation — 2026-10-16

Implementation started from exact handoff `2e69034980c79720136db6e9057c7a2c7493d5ca`. This document distinguishes portable Cloud checks from actual consumer Mac/model evidence. The accepted public implementation revision is `4f15f5ca2512d1938824b00f55a2a76c7e9219b4` (v0.1.2). Tarball checksums and final documentation commit/push evidence are reported with the release in the Cloud chat.

## Portable/mocked checks

- Syntax checks pass for every source/dashboard/script module.
- Forty-three substantive automated regressions cover validated arbitrary rosters/stable snapshots/model inheritance; goal/message/claim idempotency; task dependencies/current-attempt evidence; misleading/trivial commands; method-aware approval subsets; pre-response event buffering; stale/duplicate turn item isolation; informational delivery; dispatch recovery; terminal-goal isolation; time/token/turn caps and approval-aware accounting; missing/failed/unexpected member tools; Host/Origin/CSRF/scope/body limits; setup cancellation queue rollback; cross-goal agent/writable-workspace serialization; and nine mocked LaunchAgent control tests covering exact command selection, unloaded idempotency, ownership/path refusal, failure handling and portable bypass. Five alias/MCP tests additionally cover the primary `cteam` bin and compatible `codex-teams`, both-path collision preflight, matching relative npm links, preservation of unrelated files/links on uninstall, and unchanged normal MCP identity/tools.
- Portable tests were exercised on the user's required Node22.22.1 and current Node24 runtime. These mocked app-server tests do not establish model behavior.
- Independent mocked HTTP scenarios additionally exercised original-thread reopen, fresh-goal thread IDs, originating-goal notes, explicit active participant thread creation, goal-local pause, saturated concurrency and approval-wait exclusion.
- Chromium exercised roster/configuration saves, arbitrary agent fields/model/permissions, goals/standalone assignment, safe literal hostile text, mobile390px layout, expanded details retained across polls, dirty JSON retained and project-bound, project changes cancel agent drafts, saved/custom goal selection, persistent recovery inspection, archive search beyond latest500 retained after blur/polls/manual refresh, and Lock credential clearing. No script execution/XSS, overflow or browser errors were observed.

## Cloud auth-free Codex0.163 protocol checks —0 model turns

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
- This Cloud task independently confirmed `visibility:public` through the connected GitHub repository tool. Initial public implementation revision: `264b4c137374aca9d7c71017a7cd841a8f459853`.
- Credential-free public source retrieval/install passed using `git+https://github.com/VictorWong123/codex-teams.git#264b4c137374aca9d7c71017a7cd841a8f459853` in a fresh temporary npm prefix/cwd/cache and isolated HOME with empty npm configs. Global/system Git configs, credential helpers/extra headers, askpass, interactive authentication, GH/npm tokens and SSH agent were disabled/omitted for that child process. Explicit HTTPS Git retrieval matched public main. The required managed proxy/CA were preserved; this check does not claim to bypass the managed proxy or its policy.
- The installed public baseline passed CLI help/init/roster/config, MCP initialize/list17tools/status/roster/service/approvals and missing-cwd rejection, auth-block with0 model turns, actual Chromium dashboard/save/XSS/mobile checks, and portable service status/stop. Exact standalone command: `npm install -g 'git+https://github.com/VictorWong123/codex-teams.git#264b4c137374aca9d7c71017a7cd841a8f459853'`.
- The versioned `v0.1.0` release adds owned LaunchAgent-aware stop/start. Final commit/tag installation gates are reported in the release chat after the tag is pushed; baseline public install evidence does not claim to test a later tag. Launchctl command-selection regressions are mocked; actual consumer Mac v0.1.0 installation and owned stop/stays-down/start passed. The later v0.1.1 and v0.1.2 consumer results are recorded below.
- Earlier Cloud `gh` requests were Forbidden under the configured network policy. That historical limitation was resolved for this release by the owner's authorized visibility action; it is no longer a pending release requirement. Environment privacy remains **Only me**; no unrelated repository access or global network policy was changed.

## Actual consumer Mac acceptance — PASSED on v0.1.2

- Accepted commit: `4f15f5ca2512d1938824b00f55a2a76c7e9219b4`. Actual Mac used Node22.22.1, Codex0.163.0 and the consumer's own Codex-managed ChatGPT login. No API-key fallback or credential copying was used.
- `selfTest({live:true,turns:11,wallMinutes:14.7})` returned **PASSED**, with 5 model turns in 229.761 seconds. Flags for own ChatGPT authentication, lead verification, direct research message, captured test evidence, independent slugify assertions and npm test were all true.
- The researcher delivered findings directly to the developer. Research and implementation tasks were VERIFIED; the goal was completed. Three distinct real Codex threads were verified for coordinator, researcher and developer. The disposable Node fixture ran 31 tests with 0 failures; these are separate from the 43 portable Cloud regressions.
- Aggregate acceptance use across attempts was **6 model turns /247.496 seconds**, within the original12-turn/15-minute total. Cloud implementation/review used0 model turns.
- Actual Mac v0.1.2 LaunchAgent installation and owned stop/start passed. Both CLI aliases, fresh MCP initialize/list17tools and context rejection passed; unrelated parsed Codex configuration values including literal args=[] were preserved.
- Cleanup limitation: although the goal completed and both tasks were verified, shutdown marked the lead's last terminal turn `recovery_review`. This is a recorded cleanup marker; the evidence does **not** claim every terminal turn finished normally.

## Accepted release artifact

```sh
npm install -g https://github.com/VictorWong123/codex-teams/archive/refs/tags/v0.1.2.tar.gz
```

The tag is immutable and points to the accepted commit. The consumer installed the public commit HTTPS archive; this tag archive serves the same accepted source and avoids local Git SSH URL rewrites. Root separately verified the explicit `git+https://github.com/VictorWong123/codex-teams.git#4f15f5ca2512d1938824b00f55a2a76c7e9219b4` installation.

The separately audited npm-packed v0.1.2 tarball (not the GitHub source archive) contains 213 files and is 87,858 bytes. SHA-256: `14f0db14e7690694bb08f362544530a212cc96bd59583850f0b65eff40408882`. Package/source audit reported no findings. Existing release tags remain unchanged; this evidence update is documentation only.

## Remaining verification and limits

- Actual Mac uninstall/reinstall passed: `cteam uninstall` exited0; the main token and registry SHA-256 values stayed unchanged; unrelated parsed Codex configuration exactly matched the first backup, including node_repl.args=[]; `cteam install --launchagent` exited0 and restored integration. Sleep/wake behavior and unreported host checks are not claimed.
- The completed-goal lead-turn cleanup marker above remains a known limitation. No production behavior is changed by this evidence update.
- Windows remains unsupported/unvalidated, and no npm registry publication is claimed. Public GitHub installation and the audited package are available.

## v0.1.1 targeted hotfix

The first consumer-owned Mac live attempt lasted7 seconds and used0 model turns: the inventory guard correctly refused runtime-injected codex_apps/cua_repl tools absent from config/read. An auth-free real Mac probe proved explicit per-thread disabled transports remove both while retaining all8 scoped member tools; unknown extra sources still fail closed. The hotfix adds those known overrides without changing global app/plugin settings. The v0.1.2 consumer rerun subsequently passed as recorded above.

The Mac also exposed official Codex MCP registration normalizing an unrelated node_repl args=[] entry. The hotfix uses official0.163 registration/removal and validation in a private staged config, then splices only the owned MCP table into unchanged original bytes. Real0.163 isolated regressions verify exact unrelated comments/empty arrays, preserved concurrent edits and multiline closing quote delimiters3/4/5 of both kinds before recognized feature/sandbox sections. Positive test output is now required by the self-test npmTest field; a zero-test exit0 is no longer reported as a test pass. v0.1.0 remains immutable; patch release is0.1.1.

## v0.1.2 token-usage hotfix

The actual Mac v0.1.1 lead started its first model turn and read the local specification before a tokenUsage notification encountered initially NULL stored usage. The guard put the goal in recovery review; the real acceptance remained PENDING. Aggregate use at that checkpoint was1 turn/17.7 seconds, leaving at most11 turns/about14.7 minutes for the subsequently successful continuation. No Cloud model turns were used.

The patch makes explicit JSON null honor parser fallbacks, preserves a cumulative per-thread high-water token count across duplicate/stale updates and subsequent turns, and best-effort interrupts a known Codex turn before event-error tracking is dropped. Recorded payload regression uses totalTokens22014 and tests duplicates, stale lower totals, next-turn baselines, old-turn rejection and enforced token limits. An internal selfTest({turns,wallMinutes}) option is validated <=12/15 with fractional remaining minutes and an entry-relative deadline; the public default stays12/15. The v0.1.2 consumer rerun subsequently passed as recorded above.

## v0.1.3 installed-functionality QA candidate

Work is isolated on `qa/installed-functionality`, based on accepted documentation main `d291f86a2be96888d20e80b378731387e170aa77`. Candidate v0.1.3 has not replaced the accepted v0.1.2 install or moved any release tag. Consumer installed-host QA remains the release checkpoint. No Cloud model turns were consumed.

- Forty-nine automated regressions passed on Node22.22.1 and Node24 with the matching Codex0.163 executable and zero skipped tests. Six new tests exercise the actual MCP SDK and HTTP state transitions: caller-relative project context; task payload scope; invalid UUID/path routing; paused message retry response equality; partial roster edits; empty-note rejection; recovery/stop races; atomic reopen validation/idempotency; duplicate Add refusal; ID-first removal; missing-ID persistence; and immutable goal identities for claim, verify, interrupt and completion.
- Project overrides resolve against the caller's explicit absolute cwd. Nested task records cannot replace the bound project/goal. UUID path segments and exact service route lengths reject a traversal-shaped task identifier without reopening the stopped goal. Normal MCP still exposes17 tools.
- Goal-bound operations use original participant snapshots after live roster rename, disable or removal. Stable IDs take precedence over ID-like display names. Hand-authored roster entries without IDs receive persisted canonical IDs. Goal lead/task-owner labels and goal-scoped recipient choices use those snapshots.
- Recovery acknowledgement requires genuine uncertain review turns and a matching status/control generation after authoritative history returns. A concurrent human stop wins. Completed/stopped goals with the recorded cleanup marker can acknowledge that uncertainty while retaining their terminal status and completion timestamp, without messages or redispatch; only a subsequent explicit reopen starts work. Reopen validates before mutating and commits lifecycle/message effects atomically; repeated matching idempotency keys enqueue once. A seventh QA regression exercises both terminal marker states, acknowledgement, no-ambiguity refusal and original-thread reopen; all seven affected tests passed after this follow-up.
- Message creation and matching retries return the same camelCase public shape. The retry retains the same message ID and reads its current status; dashboard/status database rows retain their existing representation.
- Actual Chromium verified registry discovery: A/B→newC manual Refresh preserves selectedA, dirty config, goal prompt/criteria, lead and participant selections; an initially empty dashboard discovers/selects the first initialized project by polling without reload/relogin. Both cases had no page errors and fixtures were closed with zero model turns. Goal lead/task-owner labels also retained original snapshot names after live roster rename/removal.
- Independent finite Chromium checks passed all five reported form cases (16 checks, no page errors): explicitly empty participant selection persists; goal recipients include original disabled/removed participants while standalone choices use enabled live roster; whitespace goals send no request; duplicate Add preserves the existing agent; and Lock/reconnect resets drafts. Independent security/SDK probes passed recovery boundaries, context/payload validation and malicious identifier/suffix rejection. These are portable and mocked-service checks, not additional live-model acceptance.

Final candidate package/install checks and the consumer installed-host report will be recorded against the exact QA commit before release authorization.
