# Dedicated Cloud environment handoff

Canonical repository: https://github.com/VictorWong123/codex-teams. Dedicated environment: `codex-teams`; environment privacy remains **Only me**. Public source release authorization does not authorize changing environment privacy or unrelated repositories.

Published setup evidence: https://chatgpt.com/local/01a1430a-08f1-76f6-877d-2e4991f2c0fd. Initiating thread: `01a142ef-95de-7163-8829-01c09a1a2884`. Current Cloud runtime thread from CODEX_THREAD_ID: https://chatgpt.com/local/01a14317-c596-75f4-9a3a-fdf95fcb40c6.

Observed Linux hostname `1a34d1a5ee98`, repository `/workspace/codex-teams`. Snapshot baseline was `9423a5e`; exact latest approved handoff `2e69034980c79720136db6e9057c7a2c7493d5ca` was incorporated on 2026-10-16 before implementation. Unpublished work was preserved.

Setup uses the `package_managers` network preset with no extra domains/secrets. `/etc/codex/network-policy.json` was version1, vpn_configured:false, restricted HTTP package-manager egress; runtime environment_status was running/observations_current:true while network_policy.state reported unknown. Do not describe the policy as ready/enforced based on those observations. Git/npm worked after per-command additional network permission; initial default-sandbox proxy connection failed. `gh` calls to api.github.com returned Forbidden under this allowlist; connected GitHub tools were available. Do not widen global network policy to solve a project task.

Codex0.163.0 was installed by setup at `/workspace/.codex-teams-tools/node_modules/.bin/codex`; implementation also generated matching types from an isolated scratch install. The platform's inherited CODEX_HOME is task-managed. No consumer model acceptance may use/copy platform credentials; use an isolated Codex home for auth-free probes. Zero model turns were consumed by Cloud implementation/review. Real slugify acceptance (12 turns/15 minutes total), actual Mac install, LaunchAgent operation and consumer login/restart remain pending. Run `codex-teams self-test --live` on the user's awake machine with their own supported Codex ChatGPT login.
