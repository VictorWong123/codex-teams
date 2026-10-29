# Codex Teams improvement backlog

## Implementation status — 2026-10-28

All 19 numbered items are integrated on `main`, together
with reviewed worktree handoff, supported-version upgrade guidance, and three
opt-in starter specifications. The investigation below remains as historical
rationale; its line references and original QA checkpoint are not current.

| Items | Delivered behavior | Regression evidence |
| --- | --- | --- |
| 1 | Strict command/subcommand options, literal text, safe help | CLI parser and existing installed CLI checks |
| 2–3, 16 | Pending/retry safeguards, stable drafts/focus/details, scoped accessible actions | DOM interaction and actual Chromium tests |
| 4 | Read-only doctor and categorized authenticated diagnostics | Read-only configuration test, existing no-model installation verifier |
| 5 | Recorded SHA, explicit dirty-root exclusions, stable isolated worktrees | Disposable Git changing-HEAD regression |
| 6 | Audited positive budget extensions, separate resume, locked acceptance caps | Usage/status preservation and authorization tests |
| 7 | Method-specific approvals; unsupported elicitation forms fail closed | Approval subset/schema tests and browser controls |
| 8 | Durable item/task-attempt bindings and deduplicated recovery ingestion | Captured/replayed item and stale-attempt tests |
| 9–11 | Selected-goal progress/handoff, cursor history, attention/stale state | 601-record paging, project-switch, focus and disconnection tests |
| 12–13 | Project discovery, literal multiline input, specifications and preview | Parser, preview, MCP inventory/context checks |
| 14–15 | Note revisions/archive/search, basic settings, dependency selectors, stale-save rejection | Provenance/prompt and stale-configuration tests |
| 17 | Storage reporting, consistent backup, validated inactive restore | Live WAL, corrupt/schema-invalid archive, restored activation tests |
| 18 | Separate build/typecheck requirements, including silent typechecks | Runner rejection and successful silent validation tests |
| 19 | Persisted service concurrency and round-robin dispatch | Deterministic project/goal fairness regression |

Compatibility: existing JSON status and notes-list responses remain available.
New paginated reads are opt-in for CLI/MCP; dashboard history uses bounded pages.
Legacy recovery items without reliable attribution are inspection-only. Backups
exclude credential files and source workspaces; they still contain private user
data. Restored original roots must be reviewed before activation.

The historical v0.1.3 installed-Mac checkpoint is complete. The current candidate's
separate Mac, fresh-host/account and publication checks remain pending; see
`RELEASE_CHECKLIST.md`. No new live model acceptance budget was consumed.
Notifications, automatic retention, automatic integration/cleanup, and native
cross-chat durability remain deferred.

Prepared 2026-10-27 from local source revision `f596621f41966717e53aac558d4acd044c261e3d`.

## Scope and confidence

Three parallel, read-only investigations covered CLI/MCP workflows, core reliability, and dashboard usability. The main investigation covered product requirements, installation, and recorded validation. This is a planning document for later implementation, not authorization to implement every suggestion.

Findings below distinguish observed source behavior from inferred user impact. No builds, tests, browser sessions, installs, live Codex turns, or external API research were performed. Line references identify this revision and will drift. This docs-only investigation ran locally; implementation and verification should follow the project's existing Cloud execution instructions.

The intended users are developers and people primarily building through prompts. Priorities favor knowing what is happening, preserving work, recovering safely, and getting a useful result without learning internal IDs or JSON shapes. User benefit and priority are product judgments, not user-research results.

## What already exists

Do not rebuild configurable rosters, arbitrary roles, per-agent models/permissions, participant snapshots, durable conversations, direct messages, task dependencies, captured evidence, lead verification, notes, saved specifications, conversation search, recovery controls, or CLI/MCP/dashboard access. These are implemented.

Preserve scoped member credentials, human-only approvals, loopback/Origin/CSRF protections, ChatGPT-only authentication, fail-closed tool inventory, task-attempt evidence, budget limits, and ambiguous-dispatch recovery. See [security model](SECURITY.md), [implementation contract](IMPLEMENTATION_SPEC.md), and [release validation](VALIDATION.md). Old scaffold defects in the contract are historical, not evidence that those defects still exist.

## Recommended sequence

1. Close the existing v0.1.3 installed-host QA checkpoint before calling the candidate release accepted. README lines 5–7 and VALIDATION lines 76–88 distinguish it from accepted v0.1.2; this investigation does not update that evidence.
2. Fix input/submission hazards and refresh-related draft loss; add targeted regressions.
3. Explain blocked work and expose goal-focused progress, limits, and next actions.
4. Make source baselines and budget continuation explicit.
5. Add readable results, easier reusable workflows, and durable-data maintenance.

P1 means address before broadening everyday usage; P2 means valuable next-stage improvement; P3 means optional polish. These are backlog priorities, not vulnerability severity ratings. Each item should ship independently where possible.

## P1: correctness, trust, and getting unstuck

### 1. Reject CLI typos before they mutate anything

**Observed:** [src/cli.js](src/cli.js) line 13 accepts arbitrary flags and consumes following values; lines 40 and 44 have permissive config/roster subcommand handling. Help at line 22 omits implemented options such as participant selection commands, sync, and idempotency keys. An accepted `--disabled` flag is unused.

**User impact:** A typo can silently do nothing, consume prompt text, or take an unintended operation path.

**Smallest change:** Explicit per-command options, required values, subcommand validation, and complete command help. Reuse platform parsing if it fits; do not add a CLI framework solely for this.

**Acceptance:** Unknown flags/subcommands and missing IDs/values exit nonzero before any mutation. `cteam goal --help` cannot submit work. Existing valid commands remain compatible. Cover parser behavior and request suppression in CLI tests.

### 2. Prevent duplicate dashboard submissions

**Observed:** [public/app.js](public/app.js) line 6 has no pending-operation guard; line 36 creates new idempotency keys on each goal/message submission.

**Inferred risk:** Double-clicks or ambiguous transport failures can create distinct logical submissions.

**Smallest change:** Disable the submitting form while pending, show local progress/error feedback, and retain one key for the same logical submission across transport retries. Preserve entered text on failure. Keep backend idempotency as the final safeguard.

**Acceptance:** Repeated clicks during a delayed response cause one request; retry after a lost response reuses its key; a deliberately new submission gets a new key. Reproduce with a mocked delayed service before treating duplicate outcomes as confirmed.

### 3. Preserve approval/correction drafts and keyboard focus

**Observed:** [public/app.js](public/app.js) lines 10 and 24–25 rebuild list subtrees, including approval/correction inputs. Polling at line 36 skips focused text inputs but resumes after blur. Expanded details are keyed by summary text at lines 12 and 27.

**Inferred risk:** A draft can disappear after clicking elsewhere; repeated titles can share expansion state; polling can replace a focused button. Existing config, roster, and goal-form preservation should be retained, not rewritten as though absent.

**Smallest change:** Preserve drafts and expansion state by stable record ID and avoid replacing focused surviving controls. Clear drafts deliberately on successful submission, project change, or Lock.

**Acceptance:** Draft survives blur and two polling cycles; identical titles expand independently; keyboard focus stays stable. Add a small mocked interaction suite. Recorded Chromium QA exists in VALIDATION.md, but no checked-in dashboard interaction suite was found in `test/`.

### 4. Explain failures and offer a zero-turn setup diagnostic

**Observed:** [src/http-client.js](src/http-client.js) lines 6–11 exposes direct token-file/fetch failures; [src/cli.js](src/cli.js) line 58 prints the error message. [src/orchestrator.js](src/orchestrator.js) lines 13 and 25 suppress tick/project-load errors, and line 49 can label varied dispatch failures as authentication blocks. [src/appserver.js](src/appserver.js) line 12 discards stderr; health at [src/service.js](src/service.js) line 23 is basic.

**User impact:** A missing service, invalid project, Git problem, and authentication failure can be hard to distinguish.

**Smallest change:** Read-only `doctor` diagnostics plus categorized, bounded service errors with exact next actions. Reuse current runtime/version/config/auth checks and health endpoints. Report project-load failures without stopping healthy projects. Include installed package, protocol version, executable paths, and integration status; [README.md](README.md) line 13 pins Codex 0.163.0 and [src/install.js](src/install.js) line 26 stores absolute runtime paths.

**Acceptance:** Stopped service, missing project, incompatible Codex, and malformed config produce distinct guidance without model turns or automatic repairs. Do not read/copy auth tokens or start teams. Keep diagnostics sanitized; do not solve this by retaining unrestricted stderr.

### 5. Pin and explain each goal's source baseline

**Observed:** [src/orchestrator.js](src/orchestrator.js) line 55 creates writable worktrees lazily from `HEAD`; read-only participants use the root workspace. [src/db.js](src/db.js) lines 59–62 snapshots agents/limits without a goal-wide source SHA.

**Inferred risk:** Researcher sees dirty changes absent from a developer worktree, or participants created at different times start from different commits.

**Smallest change:** Record one base SHA for isolated worktrees; display dirty/untracked status and explain what is excluded. Obtain a deliberate baseline choice when needed. Preserve existing single-writer behavior and all unpublished changes; never auto-stash, auto-commit, or copy arbitrary files.

**Acceptance:** Moving root HEAD does not change a goal's isolated participant baseline. Dirty files remain untouched. Status identifies each workspace and baseline. Test dirty-root and changing-HEAD cases without model calls.

### 6. Allow explicit human budget extensions

**Observed:** Saved goal limits drive scheduling ([src/db.js](src/db.js) lines 59–61; [src/orchestrator.js](src/orchestrator.js) lines 36–37). Resume and reopen retain limits and counters ([src/service.js](src/service.js) lines 68–72; [src/db.js](src/db.js) line 76).

**User impact:** Raising project defaults and resuming an exhausted existing goal does not supply it a larger budget.

**Smallest change:** Human-only extension of selected goal caps, recording old/new totals and retaining consumed usage. Require explicit resume. Show consumed versus allowed values everywhere budgets appear.

**Acceptance:** A 30/30-turn goal explicitly extended by five stops at 35; ordinary resume never resets usage; member credentials cannot extend budgets. Preserve any separately imposed experiment cap, including the acceptance-run checkpoint.

### 7. Replace routine approval JSON with clear controls

**Observed:** [public/app.js](public/app.js) line 24 presents raw JSON responses and generic full-request details. Recovery controls at line 23 do not indicate whether inspection has been displayed.

**Smallest change:** Method-specific buttons and labeled inputs showing command/path, goal, agent, and requested scope. Reuse server validation and pinned protocol shapes. Keep advanced raw inspection available, but unsupported shapes must remain blocked. Present recovery inspection before enabling acknowledgment; merely displaying it cannot prove side effects were reviewed.

**Acceptance:** Common supported approvals require no JSON knowledge; no automatic approval or wider-than-requested grant is possible; malformed/unknown requests fail closed. Server authorization remains authoritative.

### 8. Restore trustworthy evidence during crash reconciliation

**Observed:** Live completed items create evidence ([src/orchestrator.js](src/orchestrator.js) lines 97–100), while reconciliation at line 22 imports conversation text and raw history, not equivalent task evidence.

**Inferred risk:** Tests may have executed before a crash, but their authoritative history cannot be used through the normal evidence flow.

**Smallest change:** Recover evidence only when an authoritative item maps unambiguously to a saved task attempt. Use durable item/attempt identity for deduplication; expose unmatched items for inspection.

**Acceptance:** A recorded crash boundary restores matching evidence without rerunning commands; repeated reconciliation creates no duplicates; uncertain ownership never verifies a task. This is higher-risk work: preserve held ambiguous deliveries and never infer success from assistant prose.

## P2: everyday workflow improvements

### 9. One goal-focused progress and result view

**Observed:** CLI/MCP status returns broad project state; [src/db.js](src/db.js) line 80 mixes unbounded collections and capped history. Dashboard sections largely render project-wide serialized records ([public/app.js](public/app.js) lines 19–29).

**Smallest change:** Shared goal/agent/status filters, compact terminal status, and a selected-goal dashboard view. Show current task, owner, blocker, workspace, captured tests/evidence, and next human action. Resolve agent labels from snapshots. Add a copy/exportable completion handoff derived from recorded evidence, not invented change summaries.

**Acceptance:** “What changed, where, and what passed?” is answerable without searching unrelated JSON. Preserve script-friendly JSON and an all-goals view. Optional `status --watch` remains read-only and consumes no model turns. Treat exported conversations and paths as private user data.

### 10. Reach all history through bounded pagination

**Observed:** [src/service.js](src/service.js) line 85 returns at most 500 conversation matches with no cursor; status also caps some history.

**Smallest change:** Cursor-based queries and explicit goal/agent/search filters shared by CLI, MCP, and dashboard. Avoid loading the entire archive to render recent activity.

**Acceptance:** More than 500 matching items remain reachable without omissions/duplicates across pages; filters preserve project scope. Reuse existing authoritative conversation storage and explicit sync.

### 11. Put attention-required state first

**Observed:** Dashboard summary is limited ([public/app.js](public/app.js) line 12); goal cards show consumed usage without caps (line 19); connection text can retain its last successful update after polling errors.

**Smallest change:** Top-level links to pending approvals, blocked tasks, recovery review, and exhausted limits. Mark stale/disconnected status with the last successful update. Keep monetary cost unknown where unknown.

**Acceptance:** Users can find why work stopped without scrolling through every section. Disconnect/reconnect state is accurate. Reuse polling first; no websocket or notification service needed.

### 12. Discover projects from terminal and chat

**Observed:** Authenticated `/api/projects` exists ([src/service.js](src/service.js) line 33), but CLI/MCP lack project-list operations.

**Smallest change:** `cteam projects list` and an equivalent human MCP operation over the existing endpoint. Show ID, name, root, and optionally the project resolved from explicit cwd.

**Acceptance:** Discovery works outside a repository; returned IDs work as overrides; member credentials remain denied. Do not introduce a global implicit current project.

### 13. Submit multiline prompts and reuse saved specifications

**Observed:** CLI text is positional/flag based, while `--file` means JSON ([src/cli.js](src/cli.js) lines 16, 46, 48). Saved specifications exist ([src/config.js](src/config.js) line 8) and dashboard already loads them, but CLI/MCP lack named-spec submission.

**Smallest change:** Explicit text-file/stdin input, named specification selection, and optional zero-turn preview of project/participants/prompt/criteria. Add dashboard “Save as specification” using the same canonical config.

**Acceptance:** Quotes, Unicode, and multiline text survive unchanged; conflicting inputs fail clearly; stored criteria reach the goal. No shell interpolation or new template engine.

### 14. Maintain reusable notes instead of accumulating contradictions

**Observed:** CLI/MCP support note list/add only; service inserts notes ([src/cli.js](src/cli.js) line 50; [src/mcp.js](src/mcp.js) line 30; [src/service.js](src/service.js) line 66). Dashboard notes are display-only.

**Smallest change:** Human-controlled edit/archive, title/body search, and a dashboard note form. Preserve originating goal provenance. Inspect prompt assembly before excluding archived notes from future context.

**Acceptance:** Archived notes remain inspectable but do not enter new goal context; edits retain provenance; existing conversation history stays unchanged.

### 15. Replace common JSON and UUID chores with small forms

**Observed:** Dashboard settings/specifications use canonical JSON; task dependencies require comma-separated IDs ([public/index.html](public/index.html) line 1; [public/app.js](public/app.js) lines 35–36).

**Smallest change:** Basic limits/default-model controls and a same-goal dependency checklist using task titles. Keep advanced JSON and use the same validated endpoints. Do not rewrite the entire configuration editor.

**Acceptance:** Common edits need no UUID copying and preserve unrelated config. Dependency validation remains server-side; active participant snapshots remain unchanged by roster/default edits.

### 16. Make actions accessible and appropriate to goal state

**Observed:** Goal cards show controls regardless of state; participant select lacks an accessible label; repeated actions use generic labels ([public/app.js](public/app.js) lines 20–21). Status lacks a live region ([public/index.html](public/index.html) line 1). Existing labels/focus styling should be retained.

**Smallest change:** State-appropriate controls, goal-specific accessible names, labeled selects, and polite action announcements. Explain scope/preservation before project-wide stop or roster removal. Avoid noisy announcements on every poll.

**Acceptance:** Keyboard and screen-reader users can identify action scope, retain focus, and hear results. UI disabling never replaces backend lifecycle or permission checks. Browser verification is required; this investigation did not assess rendered layout.

### 17. Back up persistent work and show storage use

**Observed:** State uses SQLite WAL and a separate registry ([src/db.js](src/db.js) lines 10, 28–33, 84–92); reviewed routes expose no backup/restore. Event and recovery-history records accumulate.

**Smallest change:** First report storage size and support a consistent explicit backup excluding credentials. Restore into a new location with validation before adding pruning. Confirm repository-wide absence before implementation.

**Acceptance:** Live WAL backup restores goals/tasks/notes/evidence and registry associations consistently; interrupted restore cannot overwrite the only good copy. State what is not included: credentials, source workspaces unless explicitly supported, and guaranteed availability of Codex-managed threads. Any future deletion requires a preview and explicit user action.

### 18. Support evidence for more real development tasks

**Observed:** Tasks accept test/research evidence; recognition uses a fixed runner list and positive test summaries ([src/db.js](src/db.js) lines 69–72; [src/evidence.js](src/evidence.js) lines 4–5).

**User impact:** Documentation, typechecking, builds, UI validation, and unsupported ecosystems may not fit the completion model.

**Smallest change:** Add only validation kinds/runners justified by actual usage, with captured exit status/output rules and continued lead review. Distinguish build/typecheck evidence from behavioral tests.

**Acceptance:** Recorded legitimate outputs pass; failed/help/dry-run/no-test outputs stay rejected where relevant. A successful command remains evidence, not proof that acceptance criteria are correct. Avoid arbitrary “trust my result” overrides.

### 19. Fair scheduling and visible queue reasons

**Observed:** Projects/goals are considered in stored/creation order, and global capacity is the minimum configured project global limit ([src/orchestrator.js](src/orchestrator.js) lines 25, 30–35).

**Inferred risk:** Earlier busy projects can monopolize slots; an unrelated low limit can surprise other projects.

**Smallest change:** Rotate scheduling consideration and expose why a goal is queued. Decide on an explicit service-wide concurrency setting before adding priorities or a complex scheduler.

**Acceptance:** With one slot and two continuously ready projects, both run within bounded dispatches while per-project/agent limits remain enforced. Add deterministic mocked scheduling tests.

## P3: optional follow-ups

- **Reviewed worktree handoff:** Extend item 9 with exact branch/workspace and user-reviewed integration instructions. Worktrees already exist; automatic merging or cleanup should not be the default.
- **Opt-in completion/attention notifications:** Consider after attention state is reliable. Start local and avoid sending prompts or results to external services.
- **A few reusable starter specifications:** Bug fix, read-only review, and small feature with explicit acceptance criteria can reuse existing specifications. Avoid a marketplace or a large role catalog without demand.
- **Upgrade guidance:** Doctor can explain supported versions and changed absolute integration paths. Preserve the exact protocol compatibility gate; do not add blind automatic Codex upgrades.
- **Log/storage maintenance:** Build on storage visibility before adding bounded rotation or user-approved retention. Preserve evidence needed for recovery and review.

## Implementation boundaries and verification

Prefer existing Node platform features, SQLite, MCP SDK, plain dashboard code, and current validation/auth helpers. No new framework, hosted account, API-key fallback, automatic spending, remote port exposure, automatic approvals, or unrequested source publication is needed for these improvements.

Cross-surface changes should share service/query behavior rather than implement separate CLI/MCP/dashboard semantics. Preserve existing API compatibility and explicit project context. Source baseline, budget mutation, evidence recovery, and backup/restore changes deserve the project's designated implementation owner and targeted security/test review; dashboard changes need frontend review.

Before implementation, re-check the source revision and pending QA, confirm each inferred failure with a focused test, and consult current official/version-specific documentation when external behavior matters. Use mocked/recorded cases first. This document consumes none of the real acceptance-turn budget and does not authorize expanding it.

No tests were rerun for this report. Previously recorded release checks are historical evidence only; none establishes that these proposed features work or that the current candidate has completed installed-host acceptance.
