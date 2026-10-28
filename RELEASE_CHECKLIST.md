# 0.1.5-rc.1 verification and release candidate

The unreleased reliability/usability branch implements the 19-item backlog and
selected small extras. Its Linux/Chromium regression and isolated package evidence
is recorded in `VALIDATION.md`; it does not close the separate host/account gates
below. Before deploying against important state, make a backup and review the new
schema, service concurrency migration, and inactive restore workflow in README.
The human MCP inventory is now 25 tools; clients should refresh discovery after
upgrading. No new release tag or consumer acceptance run is implied.

This branch prepares the next release; it does not publish a new tag, merge to
main, or imply that every host/account has been verified. The candidate includes
the security dependency updates and experimental native chat workflow already
merged to main. Existing v0.1.4 archives remain unchanged.

## Repeatable installation check

From the candidate source checkout:

```sh
npm ci
npm run check
npm run verify:install
```

From a candidate package installed in a temporary npm prefix:

```sh
node /absolute/path/to/prefix/node_modules/codex-teams/src/cli.js verify-install
```

The command outputs JSON with package/runtime version, platform, named checks,
cleanup status and pending checks. PASSED means the listed installation checks
passed, not that every pending acceptance item passed. It creates temporary
project/state/Codex directories and an isolated loopback service; exercises
CLI, native installation in two projects, dashboard HTTP, access rejection and
actual MCP handshake/context checks; and removes temporary state after shutdown.
It self-tests a trap executable before verifying no application check invokes
Codex. It does not read/copy authentication, modify installed Codex settings,
register an MCP globally, touch an existing service or use model turns. It
requires Node >=22.22 and the package dependencies. Windows remains unsupported.

## Current evidence

| Check | Result and scope |
| --- | --- |
| Automated regressions | 56 tests passed with zero skips on Linux, Node 22.22.1 and 24.19.0 |
| Native fresh-project build | Prior disposable to-do app passed 11 unit tests and 19 Chromium groups, including a review/correction loop; app was deleted |
| Native worker failure | Actual worker ran an intentional exit-23 command and reported FAILED without repair/retry; this does not simulate a model crash |
| Native cancellation | Actual running worker was interrupted; host agent listing reported interrupted |
| Native assignment budget | Coordinator stopped at its two-assignment probe budget; this is instruction-managed, not hard server enforcement |
| Reuse after chat end | Not verified; native mode explicitly does not promise durable cross-chat handles |
| Fresh package installation | Candidate verifier and clean-prefix package check; scoped to this Linux executor |
| Fresh Cloud environment and hosted activation | PENDING: must be a new host chat/environment, not another folder or subagent |
| Actual Mac | PENDING: Linux and mocked LaunchAgent checks do not prove macOS behavior |
| Separate user/account | PENDING: synthetic directories/profiles do not count as another account |
| Public plugin listing and final release | PENDING: not published by this branch |

## Fresh Cloud acceptance

Use the normal environment setup UI to attach the source repository and install
the exact candidate revision. Keep normal managed permissions, networking and
credentials. Do not copy a local auth file or bypass the local runner's guard.
Run the installation verifier first and save its JSON report outside the
candidate checkout. Start a **new chat** on that environment. Do not fork this
chat's accumulated setup as proof of discovery.

Check whether the host discovers `codex-teams-native`. Filesystem skill discovery
and hosted plugin import are separate tests: record which one was used. If
using the plugin, import the candidate skills-only package through the supported
host UI, verify it appears in the new chat, and use the skill picker.

Give the new chat this request:

> Use the installed codex-teams-native skill in this Cloud workspace. First
> verify native spawn, messaging/follow-up, wait/status and interruption tools
> are available. Create a disposable project with a small dependency-free to-do
> app. Use researcher, builder and reviewer roles, direct findings where
> supported, independent tests and at most two correction rounds. Bound the run
> to six assignments and ten minutes. Record actual tool evidence and stop
> owned workers on failure/cancellation. Delete the disposable project after
> verification. Report UNSUPPORTED if required host capabilities are absent.

Record exact source SHA, host/OS/Node/package version, discovery route, native
agent handles (not credentials), observed messages, commands, test counts and
cleanup. Do not infer PASSED from an assistant's unsupported claim.

## Failure, cancellation and restart checks

Use disposable workers, no production edits. Request an intentionally failing
command and require a FAILED result, with no silent repair/retry. Start another
worker that reports readiness and waits without writing; cancel it through the
host's native interruption tool and confirm interrupted/stopped state. A worker
that is merely idle is not evidence of cancellation.

Set a one-assignment budget; after that assignment, ask for another step and
verify the coordinator reports budget exhaustion instead of silently resetting
it. Prompt bounds are not a hard billing cap. Keep platform limits in force.

For a new chat after the original ends, supply only a saved handoff and ask the
new coordinator to reconcile artifacts and inspect its actual available handles.
It must not claim it resumed an old native agent if no such handle exists. This
is a limitation check, not a requirement to invent cross-chat persistence.

## Mac and second-account acceptance

On the Mac, install the candidate into a temporary npm prefix and run
`verify-install`. This does not alter the user's main installation. Record the
actual macOS and Node versions. Then, only for the user's existing local setup,
verify the candidate's supported installer/service controls with normal owned
configuration and backups; confirm stop/stays-stopped/start and native skill
visibility. Consumer model work requires that user's own supported ChatGPT
login. Never ask for an auth file or token. Historical live acceptance is
recorded in VALIDATION.md; do not reset its aggregate model-turn budget.

A second eligible account must independently install/enable the plugin and run
the fresh-chat acceptance. Record PASS, BLOCKED_BY_POLICY or UNSUPPORTED with
observations. A mocked account, renamed role, new directory, Linux user or
changed HOME does not prove cross-account support. Access cannot be granted by
this package. Keep each user's credentials and project data separate.

## Release gates

1. Resolve failures in the automated suite, package verification and dependency
   audit. Confirm no credential/runtime-state files enter the tarball/plugin ZIP.
2. Obtain actual fresh-host and Mac reports, or explicitly keep affected modes
   experimental/unsupported. Do not turn a pending item into a pass.
3. Review the candidate diff, then merge the branch only when authorized. Choose
   a final version and update runtime identifiers/docs consistently.
4. Publish an immutable version tag and release archive after verifying its
   exact source. Do not move old tags. Do not publish under the unrelated npm
   registry package name `codex-teams`.
5. For public hosted-plugin distribution, complete verified publisher identity,
   platform validation/review and publication separately. A GitHub release is
   not a hosted-plugin installation or entitlement grant.

Reports should contain check summaries, not tokens, private conversation dumps
or user project source. The supplied installation verifier uses no personal
identifiers in its successful output.
