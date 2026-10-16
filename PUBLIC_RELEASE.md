# Public MCP release requirements

The user expanded the objective: make this a public MCP that anyone can install
and use to run/configure agent teams. They authorized commits and pushes freely
and asked for security checks. This extends, rather than replaces,
`IMPLEMENTATION_SPEC.md`.

## Distribution

- Publish the source repository publicly after checking the source/history and
  package contents for credentials, private session data, logs, and machine state.
- Add an MIT license, a portable package manifest/bin entry, a deliberate files
  allowlist, supported Node/Codex versions, and exact installation instructions.
- Do not hardcode the original user's home path, Homebrew prefix, account,
  authentication, or project paths. Resolve executables/config/data using platform
  defaults and explicit overrides. macOS background integration must remain usable;
  document other supported platforms honestly and test portable foreground mode.
- Prove public installation works from an unpacked package in a clean temporary
  prefix/cwd without source-tree dependencies. Test `npm pack --dry-run` and a
  packed-tarball install. An installable public GitHub package/release is sufficient;
  do not require npm registry credentials or falsely claim npm publication.
- Include global MCP registration and equivalent CLI examples for init, running
  goals, adding/editing/disabling agents, messaging, progress, pause/resume/stop,
  configuration, service start/stop, and uninstall.
- Each installer uses THEIR own officially supported Codex login and local state.
  No hosted shared account, credential broker, usage-billing promises, or API-key
  fallback. Tell users when Codex restart/login is required.

## Configuration and dashboard

- Choose JSON as the canonical editable project team configuration with validation
  and clear errors. Preserve arbitrary agent purpose/instructions/models and goal
  completion specifications. Save dashboard changes through that same config.
- Keep a minimal dashboard for roster/specification editing and existing goals,
  task/message/conversation/progress/approval controls. No fixed role enum.
- Ordinary requests do not start teams without explicit team execution intent.

## Security release gate

- Review human/member credential separation, project and goal isolation,
  sender identity, approval bypass, inherited permissions, loopback exposure,
  Origin/CSRF checks, untrusted dashboard output, path traversal, request limits,
  logging/redaction, package leakage, safe install/uninstall, dependency advisories,
  command argument handling, recovery replay, and duplicate dispatch.
- Exercise meaningful negative tests; a scan alone is insufficient. No known
  exploitable high/critical dependency advisory should be shipped unaddressed.
- Document same-user trust limits honestly. Do not advertise logical project
  scoping as OS isolation or promise sandbox protection beyond Codex controls.
- Never make external messages, buy credits, widen repository permissions, or
  publish credentials to satisfy a test.

## Completion evidence

Provide exact public install/MCP/CLI/dashboard instructions, release artifact or
public repository URL, commit IDs, mocked test and package-install results,
security review findings/fixes, and actual live-run evidence separately.

Keep the original 12-turn/15-minute live Codex acceptance budget. No real turns
have yet been consumed. If Cloud lacks nested Codex ChatGPT auth or macOS host
access, finish portable work and clearly preserve those acceptance/install checks
as pending. Do not copy credentials, replace the real integration with mocks,
or claim the entire objective is complete while required evidence is missing.
