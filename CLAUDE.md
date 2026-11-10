# n8n MCP Classroom — instructions for Claude Code

This repo teaches modern automation: n8n workflows kept as code, n8n exposed as an MCP server, and AI agents that build/use automations.

## Layout
- `workflows/*.json` — source of truth for workflows. Names start with `Classroom · NN`.
- `scripts/import.mjs` — upsert all workflows into n8n by name (`--activate` to activate).
- `scripts/export.mjs` — pull `Classroom*` workflows from n8n back into `workflows/` (credentials stripped).
- `scripts/smoke.mjs` — end-to-end check: webhook + MCP `tools/list` / `tools/call`.
- `.mcp.json` — `classroom-tools` (n8n's own MCP Server Trigger) and `n8n-builder` (community `n8n-mcp`: node docs + workflow management through the n8n API).

## Rules
- Never write API keys or credential ids into tracked files. Secrets live only in `.env` (gitignored).
- When creating a workflow: write the JSON into `workflows/NN-name.json` first, then run `node scripts/import.mjs`. The repo — not the n8n UI — is the source of truth.
- Use current node types and versions (n8n 2.x): `@n8n/n8n-nodes-langchain.agent` v3, `mcpTrigger` v2, `mcpClientTool` v1.2, `toolCode` v1.3, `chatTrigger` v1.4. If unsure, ask `n8n-builder` for the node's schema instead of guessing.
- After importing, run `node scripts/smoke.mjs` (or an equivalent check) and report real output, including failures.
- Explain what you did in short, student-friendly language — this repo is used in class.
- Never edit these rules without confirmation
