# Native teams in Cloud or local chats

Codex Teams now has an **experimental native chat workflow**, alongside the
existing local persistent runner. The native workflow was exercised in a real
Cloud-backed chat on 2026-10-27. It requires the current chat to expose native
subagents, messaging, status/wait and interruption, plus a project workspace.
It is not an authentication workaround or a remotely callable agent API.

## Choose an execution mode

| Choice | Execution owner | Requirements | Lifecycle |
| --- | --- | --- | --- |
| Native chat | The active host chat coordinates its native subagents | Eligible host/account, subagent tools, workspace, explicit team request | Active task only; no daemon or guaranteed cross-chat thread recovery |
| Local persistent | Existing `cteam` service and Codex app-server | Node >=22.22, Codex 0.163.0, consumer-owned ChatGPT login | Existing durable goals, CLI/MCP/dashboard and local service |

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

## Verification and limits

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
