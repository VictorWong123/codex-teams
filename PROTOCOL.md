# Supported Codex protocol

Supported runtime is exactly `codex-cli 0.163.0`. Other versions are rejected before connecting. The implementation uses stdio JSONL JSON-RPC (without a `jsonrpc` field), `codex app-server --listen stdio://`, one initialize/initialized handshake, account/read, config/read, thread/start/resume, turn/start/interrupt, paginated thread/turns/list, and actual mcpServerStatus/list inventory. It persists authoritative item/turn notifications and method-aware human requests.

Official references consulted:

- https://learn.chatgpt.com/docs/app-server
- https://learn.chatgpt.com/docs/codex-sdk
- https://github.com/modelcontextprotocol/typescript-sdk

No Context7 tool was exposed in this task; matching generated types and official documentation were used instead. No user source/secrets were sent to documentation services.

The retained generated type closure in `protocol/0.163.0/` comes from:

```sh
codex --version   # codex-cli 0.163.0
codex app-server generate-ts --out work/protocol
```

It contains the request/response types directly relied upon plus recursively imported generated dependencies; `sha256.json` records exact content hashes. These files contain no session/configuration/account state. Runtime remains plain Node ESM; the retained definitions are review/reproducibility evidence. Regenerate and compare before changing protocol versions.

Real auth-free protocol checks exercised thread creation, effective config merging, disabled inherited MCP aliases, required scoped member inventory and actual scoped MCP team_status calls. They did not call turn/start or use Cloud account authentication. Real ChatGPT-authenticated model acceptance remains pending on a consumer-owned login.
