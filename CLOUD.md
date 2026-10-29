# Native teams in Cloud or local chats

Codex Teams now has an **experimental native chat workflow**, alongside the
existing local persistent runner. The native workflow was exercised in a real
Cloud-backed chat on 2026-10-27. It requires the current chat to expose native
subagents, messaging, status/wait and interruption, plus a project workspace.
It is not an authentication workaround or a remotely callable agent API.

## Use it in a Cloud project

Codex Teams and Codex Cloud can be used together in **native chat mode**. Your
Mac's local service and personal skills do not transfer into the Cloud workspace.
The persistent app-server runner requires its own supported consumer login;
managed Cloud authentication is not a substitute. Keep its authentication checks.

From a reviewed, pinned checkout of this repository in the Cloud filesystem:

```sh
node scripts/setup-cloud.mjs
```

This dependency-free, offline command installs the native workflow at user scope
on that machine. It needs Node >=22.22, but no `npm ci`, Codex binary, login, API
key, MCP registration, daemon, or public port. Repeating the same setup is safe;
different existing instructions and symlink destinations are refused. To install
only for a particular project, including a project without a team registry:

```sh
node scripts/setup-cloud.mjs --scope project --project /absolute/path/to/project
```

The output distinguishes `installation: current` from `capability: check-in-chat`.
The latter must be checked by the chat, using its actual tools. Once the CLI's
dependencies are installed, check the same files without modifying anything:

```sh
cteam native status --scope user
cteam native status --scope project --project /absolute/path/to/project
```

Status reports `missing`, `current`, `different`, or `unsafe-path`; it does not
claim a service is running, inspect credentials, or infer host entitlements.
Ask the Cloud chat to read the installed skill and use `codex-teams-native` for
your goal. It checks tools first and reports UNSUPPORTED if they are absent.

This repository also contains `.agents/skills/codex-teams/SKILL.md` so chats in
the checkout can discover how to choose native or persistent execution. The same
instructions replace the old local-only usage skill when `cteam install` is run
on a user-managed machine. Native setup itself does not modify that machine's
existing local integration. Do not run `cteam install` to set up managed Cloud.

For future Cloud tasks, include the pinned checkout and setup command in the
environment's supported setup workflow, then republish and verify a fresh task.
Alternatively, install at project scope and commit that project's generated
skill after review. A task-local installation does not update the published
environment. [Cloud documentation](https://learn.chatgpt.com/docs/environments/cloud-environments)
confirms repository skills are available in Cloud and personal Mac skills are
not synced. Keep private repository access private; do not embed clone tokens.

## Does this provide an autonomous 24/7 lab?

No. Native teams execute a bounded goal inside an active Cloud task, which can
continue while your computer sleeps. Finishing that goal does not start the next
research cycle, and saved filesystem state is not a running process. A skill
cannot guarantee continuous execution, restore native agent handles in a new
chat, or bypass usage limits.

An ongoing lab additionally needs a supported scheduler/awake host, durable
research backlog and checkpoints, explicit bounded cycles, interruption and
usage-limit handling, and a stop control. A user-managed server can host the
persistent runner with a supported consumer-owned ChatGPT login; that is separate
from managed Codex Cloud. No server, paid hosting, infinite restart loop or
automatic usage-reset retry is provisioned by this setup. Choose and verify that
hosting arrangement before promising unattended operation.

## Keep the team working on a shared backlog

Native mode uses a coordinator-managed task queue. Workers communicate directly,
report findings and blockers, and request more work. When any worker finishes,
the coordinator checks its result and gives it the next ready assignment while
other workers continue. It does not wait for every agent to finish the current
group. Existing worker handles are reused through the host's follow-up tool;
messaging an idle agent alone may not start another turn.

For example, a builder can implement one task while a researcher investigates
the next issue and a reviewer prepares acceptance cases. Tasks with unfinished
dependencies wait, and each task has one owner. Agents with no useful ready task
remain idle with a stated reason. All required work must be verified before the
goal is complete. Concurrency and the original finite run budget still apply.
Assignment/correction caps prevent additional dispatches; already-authorized work
can finish within the original elapsed-time deadline. Reaching that deadline or
a user stop interrupts the owned workers and preserves unfinished tasks.

If you request GitHub work, a backlog/delivery agent can search existing issues,
file concrete in-scope findings with acceptance criteria, and open or update
tested draft PRs in the authorized repository. The coordinator assigns the
resulting work once, with dependencies and issue links. This uses the host's
existing GitHub access; the native plugin grants none. Ambiguous writes are
reconciled before retrying, and open PRs remain awaiting review. Merging, deploying
and changing repository access require their own applicable authorization.

Example request:

> Use native codex-teams for this repository. Work through the specified research
> backlog, keep agents assigned to ready tasks, and have them share findings
> directly. Reassign finished agents while others continue. File deduplicated
> issues for concrete findings and open tested draft PRs for completed changes.
> Use at most six worker assignments and ten minutes for this cycle; checkpoint
> remaining work and blockers at the limit.

This is orchestration by the active chat following the installed skill, not a
background scheduler or a hard service-enforced queue. The persistent runner has
its separate task/message scheduler; native tasks do not share its database.

## Choose an execution mode

| Choice | Execution owner | Requirements | Lifecycle |
| --- | --- | --- | --- |
| Native chat | The active host chat coordinates its native subagents | Eligible host/account, subagent tools, workspace, explicit team request | Active task only; no daemon or guaranteed cross-chat thread recovery |
| Persistent on a user-managed host | Existing `cteam` service and Codex app-server | Awake local/remote host, Node >=22.22, Codex 0.163.0, consumer-owned ChatGPT login | Existing durable goals, CLI/MCP/dashboard; Linux boot supervision is not included |

Native mode supports arbitrary project paths and user-defined roles. It does
not promise compatibility with every account, project permission, operating
system or host. Cloud eligibility and workspace policies still apply. A skill
cannot enable unavailable tools. Model overrides and enforced read-only worker
permissions depend on the host; the workflow must report unsupported requests.
Role prompts alone do not create security isolation.

## Install instructions in a local or Cloud filesystem

These commands require a checkout/package containing this change; **v0.1.4 does
not contain native mode**. From this source checkout:

```sh
npm ci
node src/cli.js native install --scope user
```

From an installed package containing this change:

```sh
cteam native install --scope user
```

This installs only `~/.agents/skills/codex-teams-native/SKILL.md`. It preserves
other skills, refuses symlink destinations and refuses to overwrite differing
content. It starts no model, service or MCP server and does not change auth or
Codex configuration. A repeat of the same installation is idempotent. Inspect
and back up a differing existing skill before replacing it manually.

For a single project instead:

```sh
cteam native install --scope project --project /absolute/path/to/project
```

This writes `.agents/skills/codex-teams-native/SKILL.md` in that project. Select
one scope to avoid duplicate skill names. The user-level installation applies
to projects **on that machine/container**. It does not install a skill into a
hosted account, unrelated environments or other users' homes. For reusable Cloud
environments, include the pinned package and this install command in the
environment's supported setup workflow, then test skill visibility in a new task.
Environment publication and hosted skill discovery are not established by a
filesystem installation alone. No current environment configuration was changed.

Open a fresh chat, check that the skill is available, and ask:

> Use codex-teams-native in native chat mode for this project. First check your
> native subagent capabilities. Assign researcher and builder roles, have the
> researcher message findings to the builder, and independently review and run
> tests. Correct failures within two rounds. Report evidence and any blockers.

Specify the actual goal and acceptance criteria. Where supported, select the
skill from the host's skill picker. `cteam native instructions` prints the same
workflow for explicit reading by a chat, but the command itself never launches
agents. A host without the necessary tools must report UNSUPPORTED.

## Share across accounts and Cloud surfaces

`plugins/codex-teams-native/` is a standalone skills-only plugin. It contains no
server, secret, credential, hook, executable or model API dependency. The source
repository's `.agents/plugins/marketplace.json` lists it for supported local
marketplace clients; that catalog is intentionally not in the npm tarball.

For local marketplace testing, use a checkout containing this change:

```sh
codex plugin marketplace add /absolute/path/to/codex-teams
```

Install it through the supported host's Plugins UI and verify it in a fresh
chat. CLI marketplace registration alone does not prove hosted installation.
Do not also install the standalone skill in the same host if it produces a
duplicate. The native plugin does not depend on the local runner's pinned CLI;
use a host version that supports the documented plugin workflow.

For broader hosted distribution, zip the **contents** of
`plugins/codex-teams-native/` so `plugin.json` is at the ZIP root. Import/submit
through the supported plugin workflow. Public-directory publication requires a
verified publishing identity, platform validation/review and publication. Each
user or workspace must install/enable the plugin and have the required agent
capabilities. This repository cannot provision those entitlements. **The plugin
has not been approved or published in the universal directory, and a fresh
hosted-plugin install has not yet been tested.** The supplied ZIP is a candidate,
not evidence of universal availability.

Users who choose the local persistent mode should follow [README.md](README.md).
Do not run both modes for the same goal. Native tasks do not appear in the local
service dashboard and do not reuse local app-server thread IDs or database goals.

For repeatable package checks and exact fresh-host/Mac/second-account acceptance,
see [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md).

## Verification and limits

For the current combined native/persistent candidate checks, see
[the validation record](VALIDATION.md). The results below describe the earlier
Cloud-specific setup and workflow checks.

Cloud setup verification on 2026-10-28:

- All 59 automated tests passed on Node 24.19.0 with Codex 0.163.0, zero skips;
  syntax checks and the dependency audit passed (zero known advisories).
- The setup command installed the native skill in the current Cloud user's
  filesystem. Codex 0.163.0's real `skills/list` found the repository routing skill
  and user native skill enabled, with no discovery errors and no model turn.
- Two native Cloud reviewers explicitly read that installed workflow and reviewed
  this change. The test reviewer sent package evidence directly to the security
  reviewer. Both completed within the bounded review; neither changed production
  files, and neither reported an actionable issue. The coordinator independently
  ran the suite and inspected the diff.
- Independent archive checks passed in a disposable project with no dependencies,
  empty PATH and no Codex executable: offline bootstrap, private file permissions,
  idempotence, edited-file preservation, scope/argument rejection, symlink refusal
  and read-only status. These checks launch no nested Codex model processes.
- The shared-backlog follow-up used four assignments across two native workers.
  After the package checker completed, the coordinator assigned it another ready
  task on the same handle while the security reviewer was still running. Direct
  peer messages identified an ambiguous count-cap interruption rule; the owner
  corrected it and review confirmed the final allowed tasks can finish within
  the original deadline. Final installed and packaged skills matched source.
  This exercised task handoffs and correction review, not autonomous GitHub issue
  creation or continuous scheduling. GitHub backlog behavior remains skill guidance
  executed through the host's authorized tools.
- This establishes explicit use in another Cloud chat and actual CLI filesystem
  discovery, not automatic hosted-plugin ingestion, a second account, a Mac
  installation, a published environment update, or continuous 24/7 execution.
  Native reviewer role prompts were not separate enforced read-only sandboxes.

Earlier native workflow acceptance:

- Actual Cloud-backed native researcher and builder ran as two separate workers.
  Research identified four defects in a disposable slugify fixture and directly
  messaged the builder. The builder fixed the implementation and added 20 passing
  tests. The main chat independently inspected code, reran those tests, checked
  the specified cases/type errors and 100 normalization/idempotence cases.
- This was a single research-to-correction pass, not a test of repeated follow-up
  rounds, task suspension/restart, multiple accounts, or every Cloud surface.
  It exercised the workflow before packaging; automatic activation of the final
  hosted plugin remains pending. No separately authenticated Codex model process,
  API key, copied credential or guard removal was involved.
- A second disposable project installed the skill from the packed npm artifact
  and built a to-do app in this Cloud session. Researcher, builder and independent
  reviewer read the installed workflow. Direct research-to-builder messaging
  worked. Review found keyboard focus loss after list mutations; a follow-up to
  the same builder fixed it, and independent Chromium tests verified the fix.
  The final app passed all 11 Node tests and 19 browser check groups: CRUD,
  filters/counts, reload persistence, keyboard input/focus, malformed/unavailable
  storage, literal hostile text, 390px layout, page errors and unsafe routes.
  Four worker assignments and one correction round completed within ten minutes.
  Test browsers/servers stopped and the disposable project was deleted at the
  user's request. This validates packaged filesystem installation and a fresh
  project with a real correction loop, still in the existing host chat/account;
  it does not establish automatic hosted-plugin activation or universal access.
- Codex 0.163.0's actual `skills/list` found the installed skill enabled at user
  scope from two different project directories, using an isolated unauthenticated
  Codex home. This establishes filesystem discovery, not hosted catalog ingestion.
- All 55 automated tests pass on Node 24.19.0 with matching Codex 0.163.0, zero
  skips. Four new tests cover idempotent installation, preservation of edited and
  unrelated skills, project selection, symlink refusal and CLI operation without
  a service/login/Codex executable. The existing local suite continues to pass.
- Independent targeted source review found no actionable installer/security
  defect. Coordinator-managed budgets and instructions are not hard service
  enforcement. The same-user trust model still applies.

## Official platform references

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Skill authoring and filesystem locations](https://learn.chatgpt.com/docs/build-skills)
- [Plugin packaging and local marketplaces](https://developers.openai.com/plugins/build/plugins)
- [Hosted submission and publication](https://developers.openai.com/plugins/deploy/submission)
- [Cloud environments](https://learn.chatgpt.com/docs/cloud)

These are OpenAI's platform documents. This repository's README and CLOUD.md are
project-maintained documentation, not an OpenAI endorsement or official product.
