# Release validation — 2026-10-16

Implementation started from exact handoff `2e69034980c79720136db6e9057c7a2c7493d5ca`. This document distinguishes portable Cloud checks from actual consumer Mac/model evidence. The accepted release is v0.1.3: actual Mac live QA exercised `f596621f41966717e53aac558d4acd044c261e3d`; terminal recovery follow-up `85c6fc4480368f8431001dd432a54461becc54b1` passed portable checks and fresh public-archive installation. Its separate Mac terminal-recovery check remains unreported. Tarball checksums and final documentation commit/push evidence are reported with the release in the Cloud chat.

## Portable/mocked checks

- Syntax checks pass for every source/dashboard/script module.
- The historical v0.1.2 checkpoint passed43 substantive automated regressions covering validated arbitrary rosters/stable snapshots/model inheritance; goal/message/claim idempotency; task dependencies/current-attempt evidence; misleading/trivial commands; method-aware approval subsets; pre-response event buffering; stale/duplicate turn item isolation; informational delivery; dispatch recovery; terminal-goal isolation; time/token/turn caps and approval-aware accounting; missing/failed/unexpected member tools; Host/Origin/CSRF/scope/body limits; setup cancellation queue rollback; cross-goal agent/writable-workspace serialization; and nine mocked LaunchAgent control tests covering exact command selection, unloaded idempotency, ownership/path refusal, failure handling and portable bypass. Its five alias/MCP tests cover the primary `cteam` bin and compatible `codex-teams`, both-path collision preflight, matching relative npm links, preservation of unrelated files/links on uninstall, and unchanged normal MCP identity/tools.
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

## Historical v0.1.2 release artifact

```sh
npm install -g https://github.com/VictorWong123/codex-teams/archive/refs/tags/v0.1.2.tar.gz
```

The tag is immutable and points to the accepted commit. The consumer installed the public commit HTTPS archive; this tag archive serves the same accepted source and avoids local Git SSH URL rewrites. Root separately verified the explicit `git+https://github.com/VictorWong123/codex-teams.git#4f15f5ca2512d1938824b00f55a2a76c7e9219b4` installation.

The separately audited npm-packed v0.1.2 tarball (not the GitHub source archive) contains 213 files and is 87,858 bytes. SHA-256: `14f0db14e7690694bb08f362544530a212cc96bd59583850f0b65eff40408882`. Package/source audit reported no findings. The v0.1.2 tag remains unchanged; this historical artifact is separate from v0.1.3 below.

## Remaining verification and limits

- Actual Mac uninstall/reinstall passed: `cteam uninstall` exited0; the main token and registry SHA-256 values stayed unchanged; unrelated parsed Codex configuration exactly matched the first backup, including node_repl.args=[]; `cteam install --launchagent` exited0 and restored integration. Sleep/wake behavior and unreported host checks are not claimed.
- Completed goals can retain a lead-turn cleanup review marker. The v0.1.3 follow-up permits explicit acknowledgement without resurrecting a terminal goal, then a separate explicit reopen; portable checks passed and its separate Mac check remains unreported.
- Windows remains unsupported/unvalidated, and no npm registry publication is claimed. Public GitHub installation and the audited package are available.

## v0.1.1 targeted hotfix

The first consumer-owned Mac live attempt lasted7 seconds and used0 model turns: the inventory guard correctly refused runtime-injected codex_apps/cua_repl tools absent from config/read. An auth-free real Mac probe proved explicit per-thread disabled transports remove both while retaining all8 scoped member tools; unknown extra sources still fail closed. The hotfix adds those known overrides without changing global app/plugin settings. The v0.1.2 consumer rerun subsequently passed as recorded above.

The Mac also exposed official Codex MCP registration normalizing an unrelated node_repl args=[] entry. The hotfix uses official0.163 registration/removal and validation in a private staged config, then splices only the owned MCP table into unchanged original bytes. Real0.163 isolated regressions verify exact unrelated comments/empty arrays, preserved concurrent edits and multiline closing quote delimiters3/4/5 of both kinds before recognized feature/sandbox sections. Positive test output is now required by the self-test npmTest field; a zero-test exit0 is no longer reported as a test pass. v0.1.0 remains immutable; patch release is0.1.1.

## v0.1.2 token-usage hotfix

The actual Mac v0.1.1 lead started its first model turn and read the local specification before a tokenUsage notification encountered initially NULL stored usage. The guard put the goal in recovery review; the real acceptance remained PENDING. Aggregate use at that checkpoint was1 turn/17.7 seconds, leaving at most11 turns/about14.7 minutes for the subsequently successful continuation. No Cloud model turns were used.

The patch makes explicit JSON null honor parser fallbacks, preserves a cumulative per-thread high-water token count across duplicate/stale updates and subsequent turns, and best-effort interrupts a known Codex turn before event-error tracking is dropped. Recorded payload regression uses totalTokens22014 and tests duplicates, stale lower totals, next-turn baselines, old-turn rejection and enforced token limits. An internal selfTest({turns,wallMinutes}) option is validated <=12/15 with fractional remaining minutes and an entry-relative deadline; the public default stays12/15. The v0.1.2 consumer rerun subsequently passed as recorded above.

## v0.1.3 installed-functionality QA — PASSED

QA was isolated on `qa/installed-functionality`, based on documentation main `d291f86a2be96888d20e80b378731387e170aa77`. The owner authorized merging the accepted QA branch after the actual Mac checks below. Existing release tags are not moved. No Cloud model turns were consumed.

- Fifty automated regressions passed on Node22.22.1 and Node24 with the matching Codex0.163 executable and zero skipped tests. Seven new tests exercise the actual MCP SDK and HTTP state transitions: caller-relative project context; task payload scope; invalid UUID/path routing; paused message retry response equality; partial roster edits; empty-note rejection; recovery/stop races; atomic reopen validation/idempotency; duplicate Add refusal; ID-first removal; missing-ID persistence; and immutable goal identities for claim, verify, interrupt and completion.
- Project overrides resolve against the caller's explicit absolute cwd. Nested task records cannot replace the bound project/goal. UUID path segments and exact service route lengths reject a traversal-shaped task identifier without reopening the stopped goal. Normal MCP still exposes17 tools.
- Goal-bound operations use original participant snapshots after live roster rename, disable or removal. Stable IDs take precedence over ID-like display names. Hand-authored roster entries without IDs receive persisted canonical IDs. Goal lead/task-owner labels and goal-scoped recipient choices use those snapshots.
- Recovery acknowledgement requires genuine uncertain review turns and a matching status/control generation after authoritative history returns. A concurrent human stop wins. Completed/stopped goals with the recorded cleanup marker can acknowledge that uncertainty while retaining their terminal status and completion timestamp, without messages or redispatch; only a subsequent explicit reopen starts work. Reopen validates before mutating and commits lifecycle/message effects atomically; repeated matching idempotency keys enqueue once. A seventh QA regression exercises both terminal marker states, acknowledgement, no-ambiguity refusal and original-thread reopen; all seven affected tests passed after this follow-up.
- Message creation and matching retries return the same camelCase public shape. The retry retains the same message ID and reads its current status; dashboard/status database rows retain their existing representation.
- Actual Chromium verified registry discovery: A/B→newC manual Refresh preserves selectedA, dirty config, goal prompt/criteria, lead and participant selections; an initially empty dashboard discovers/selects the first initialized project by polling without reload/relogin. Both cases had no page errors and fixtures were closed with zero model turns. Goal lead/task-owner labels also retained original snapshot names after live roster rename/removal.
- Independent finite Chromium checks passed all five reported form cases (16 checks, no page errors): explicitly empty participant selection persists; goal recipients include original disabled/removed participants while standalone choices use enabled live roster; whitespace goals send no request; duplicate Add preserves the existing agent; and Lock/reconnect resets drafts. Independent security/SDK probes passed recovery boundaries, context/payload validation and malicious identifier/suffix rejection. These are portable and mocked-service checks, not additional live-model acceptance.

Actual installed Mac acceptance at `f596621f41966717e53aac558d4acd044c261e3d`:

- `selfTest({live:true,turns:6,wallMinutes:10})` returned **PASSED**:4 model turns /156.17 seconds. Flags for own ChatGPT authentication, direct research message, captured test evidence, lead verification, independent slugify assertions and npm test were all true. The goal completed and both tasks were VERIFIED.
- Fresh MCP/CLI testing passed16 regressions; actual Chrome passed6 reported dashboard bug cases, including registry discovery and draft preservation. Service stop/start retained the same3 thread IDs without duplicate execution. Configuration and the main token were preserved. Persisted IDs after service restart do not establish sleep/wake or authoritative resumed-thread behavior.
- Shared use across all actual attempts is **10 model turns /403.666 seconds** (earlier6/247.496 plus4/156.17), below the original12-turn/15-minute total. No API-key fallback, copied credentials or Cloud model turns were used.

Final terminal-cleanup follow-up `85c6fc4480368f8431001dd432a54461becc54b1` passed50/50 full portable regressions on both Node22.22.1 and Node24 with zero skipped tests. Independent finite security probes confirmed completed/stopped uncertainty acknowledgement preserves terminal status before explicit reopen. A fresh credential-free public HTTPS commit-archive installation passed CLI/MCP checks with0 model turns. These checks are distinct from the actual Mac live run on `f596621`; the follow-up's separate Mac terminal-recovery check remains unreported.

Primary accepted installation:

```sh
npm install -g https://github.com/VictorWong123/codex-teams/archive/refs/tags/v0.1.3.tar.gz
```

The annotated v0.1.3 tag object is `0232b5b330d1b3309ef3249d94ddcc3b8c093a8f`, targeting `8919d295d4cf14323444207efa72771c14bb0f45`. Later documentation commits do not move that tag. Existing tags are immutable. The separately packed follow-up artifact contains213 files and is91,518 bytes; SHA-256 `8f930fb042b262ff8e1220fbffcdef95d8c26efda46fdc38845bfd29a9f1504b`. This checksum describes that npm-packed artifact, not the GitHub source archive. Package audit reported no findings.


## Installed terminal-only workflow — PASSED

Eight focused check groups passed against the installed v0.1.3 package from a fresh public-tag prefix using independent CLI processes only. No browser, MCP client or direct-HTTP test script was used. The detached service stayed alive after its starting CLI exited and across subsequent client exits.

The check initialized a project; configured three arbitrary roles with free-text purposes/instructions, permissions and inherited/override models; selected a goal lead/participants; verified immutable snapshots and goal retries; sent actionable/informational messages with matching retry responses; exercised task claims/dependency blocking/missing-evidence rejection; saved notes/searched conversations; used goal controls and explicit project selection from another cwd; and explicitly stopped the daemon, after which service status reported `ok:false`.

The project remained paused during orchestration checks; all goals were stopped before project resume. A trap Codex executable was never invoked: **0 Codex processes, authentication/provider calls or model turns**. This verifies headless configuration, transport and lifecycle behavior without claiming another live code build. The separate actual Mac CLI-driven model acceptance remains the f596621 evidence above.

## v0.1.4 public distribution check

This release follows source revision `c031fe1966bb8ae6d7cc3118fcdc1207d0e9b585`. Product behavior is unchanged; runtime version identifiers are bumped to 0.1.4. Public docs now link the exact versioned GitHub archive, show Mac/Linux/Windows status, explain the free MIT distribution and account requirements, and include the pinned Codex prerequisite command. Package metadata links to public documentation and issue reporting. The CLI alias regression now compares the reported version with the manifest rather than a stale literal.

Current Linux validation:

- `npm ci`, `npm run check`, and all **50 tests passed with zero skips** on Node **22.22.1** and **24.19.0**, using `CODEX_BIN` for Codex **0.163.0**. The default Cloud Codex 0.159.2 is incompatible and would skip three real configuration-preservation checks.
- `npm audit` reported **zero known vulnerabilities**. The MCP SDK remains pinned to current compatible 1.32.1; Zod remains on 3.25.76 rather than silently migrating to the incompatible version 4 API.
- An independent focused review found no exploitable release blocker within the documented single-user trust model. A scan of 307 historical source blobs found no high-confidence private-key/GitHub-token/API-key/AWS-key pattern matches; this is a limited scan, not a guarantee that arbitrary secrets can never exist.
- npm packaging uses the existing files allowlist. Source file permissions were normalized before packing to readable 0644 and executable 0755; packed contents were inspected for private state and permission errors. Protocol type filenames mentioning sessions/tokens are schemas, not credentials.
- A fresh temporary global-prefix install of the packed artifact passed CLI help, project initialization, detached service startup, health/version checks, status, dashboard HTTP response, a real SDK MCP handshake with 17 tools and `team_status`, HTTP unauthenticated rejection (401), cross-origin rejection (403), and owned daemon shutdown. A trap Codex executable was never invoked: **zero Codex processes or model turns**. HTTP dashboard checks do not constitute a new browser interaction test.
- The isolated self-test with matching Codex reached the expected missing-ChatGPT-authentication limit and remained **PENDING**, with zero model turns. No authentication was copied or requested. Previous actual Mac acceptance remains recorded under v0.1.3; no new Mac, live model, sleep/wake or Windows validation is claimed.

Public distribution is the immutable Git tag archive at `https://github.com/VictorWong123/codex-teams/archive/refs/tags/v0.1.4.tar.gz`, with documentation at `https://github.com/VictorWong123/codex-teams#readme`. The npm registry name `codex-teams` belongs to a different repository (`skrabe/codex-teams`); do not install that bare package name to obtain this project. No npm registry publication is claimed. Windows is **coming soon**, currently unsupported. Release hosting and docs are free; consumer model work still requires the consumer's own supported account.

## Security maintenance — 2026-10-27

Fresh verification began at v0.1.4 (`4c7578b8ac19fe0af5950d5b5127f963a0045178`). All original 50 tests and syntax checks passed on Node 24.19.0 with Codex 0.163.0, zero skips. The prior dependency audit result is historical: a new audit reported high advisories for body-parser (GHSA-27r3-jxmh-p828) and Zod (GHSA-mrhx-c7xc-m3w5), and moderate/low advisories for fast-uri. These are dependency findings; this review does not establish exploitability of every affected code path in this application.

The maintenance branch updates Zod to 4.6.7, body-parser to 2.4.0 and fast-uri to 3.1.9. Zod 4 records explicitly define string keys. Partial roster edits discard defaults for omitted fields before merging, preventing a purpose-only edit from changing permission, enabled state or instructions. Regression coverage exercises these behaviors through the actual MCP SDK, config round trips, valid user-input approvals and unknown-question rejection.

All 51 tests pass with zero skips; syntax checks pass; npm audit reports zero known vulnerabilities. Independent focused reviews of HTTP authentication, member scope, CSRF, dashboard rendering and the migration found no actionable exploitable issue in the reviewed scope. This is not a guarantee that the software has no security issues.

A packed installation in a fresh local prefix passed CLI help/init, detached service startup, dashboard HTTP, unauthenticated rejection (401), cross-origin rejection (403), actual MCP handshake/list of 17 tools/status, and service shutdown. The check selected a non-model executable and consumed zero model turns. No new interactive browser or macOS test is claimed.

The updated Cloud network policy permits chatgpt.com and the Codex endpoint responds through the proxy. Live self-test still returns PENDING before model dispatch because platform-managed Cloud authentication is not consumer-owned authentication. The isolated auth probe also returns PENDING as expected. No credentials were copied, restrictions bypassed or API fallback used. Earlier recorded Mac acceptance remains separate historical evidence; no new live acceptance is claimed.

The GitHub repository is public and already supplies MIT licensing and first-party README/SECURITY/PROTOCOL documentation. This maintenance branch does not change existing release tags or publish a new release.

## 0.1.5-rc.1 verification candidate

Prepared on `qa/cloud-local-release`, based on merged main `aa014dc3d895b19484242e71cf43edaf5c4bb5b4`. No final release tag, main merge or hosted-plugin publication is part of this candidate.

All 56 tests passed with zero skips on Linux under Node 22.22.1 and 24.19.0, with matching Codex 0.163.0 for the existing auth-free protocol/config tests. Syntax checks passed. npm audit reported zero known vulnerabilities. The portable verifier regression additionally proves original-state preservation and handles symlinked temporary paths, which previously caused false failures and matter for macOS portability.

A clean npm-prefix installation of the candidate tarball passed `cteam verify-install`: invocation detector self-test, CLI/version, isolated initialization, native skill installation/idempotence in two projects, loopback service, 401/403 rejection, dashboard/CSP, actual MCP handshake/version/17 tools/context isolation, no application invocation of Codex and cleanup. It consumed zero model turns. Package allowlist inspection found no matched runtime/credential-state paths. These are bounded checks, not proof of absence of all secrets or security defects. Final targeted source review found no actionable issue after temporary-path and timeout fixes.

Native lifecycle probes in the current host chat used two bounded assignments: one worker ran an intentional exit-23 command and accurately returned FAILED without retry; another signaled readiness and was interrupted, after which the native host listed it as interrupted. No subsequent assignment was dispatched after that probe budget. This verifies explicit failure reporting and observed interruption; it does not simulate a model crash, establish hard budget enforcement or prove cross-chat recovery.

Actual new-host plugin activation, Mac installer/LaunchAgent behavior and a second account remain PENDING. The candidate provides `RELEASE_CHECKLIST.md` with exact commands/prompts and evidence boundaries so those checks can be run without sharing authentication. Native mode remains experimental; no broader account entitlement or persistent background behavior is claimed. Historical local live acceptance and the disposable Cloud to-do acceptance remain separate evidence.
