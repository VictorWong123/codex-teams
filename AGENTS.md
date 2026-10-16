# Engineering instructions

This repository implements Codex Teams. Read `IMPLEMENTATION_SPEC.md` before changes.

- Continue implementation, dependency installation, builds, and tests in this project's Codex Cloud environment. Do not delegate recursively to another Cloud task.
- Identify the actual repository root and source revision before work. Preserve unpublished work, unrelated files, and existing Codex configuration.
- Use one implementation owner for production changes. Use targeted frontend, security, and test reviews after implementation; return fixes to that owner.
- Prefer simple Node.js platform features and the installed MCP SDK. Check current official Codex documentation and Context7 before materially relying on external APIs; never send secrets or proprietary source to documentation services.
- No separately billed API dependency, API-key fallback, auth-token copying, or automatic credit purchase. Preserve Codex sandboxes and approval controls.
- Use mocked tests before real Codex integration. Real acceptance is capped at 12 agent turns and 15 minutes; stop and report evidence at that checkpoint.
- Do not claim installation, macOS LaunchAgent verification, or existing Mac authentication reuse from a Linux Cloud test. Finish all portable work remotely and leave exact final Mac steps when host access is unavailable.
- Do not publish private source publicly or widen repository access. Keep this repository separate from other projects.
- Keep temporary stores, logs, databases, sessions, credentials, node_modules, and machine-specific generated artifacts out of Git. Preserve dirty user worktrees.
- Report what changed, concrete validation, and remaining limitations. Keep updates concise. Do not claim success without evidence.

