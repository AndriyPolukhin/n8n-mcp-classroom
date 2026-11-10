# n8n MCP Classroom

A hands-on starter kit for one practical class on **modern automation**:

```
 ┌──────────── Cloud dev (GitHub Codespaces) ────────────┐
 │                                                       │
 │   git repo ──import.mjs──▶  n8n  ◀──export.mjs── UI   │
 │   workflows/*.json          │                         │
 │                             ├─ 01 Webhook → AI Agent  │
 │                             ├─ 02 MCP Server ◀────────┼── Claude Code / Claude Desktop / Cursor
 │                             └─ 03 Chat Agent ──MCP────┘   (any MCP client)
 │                                                       │
 │   Claude Code ──n8n-mcp──▶ builds new workflows       │
 └───────────────────────────────────────────────────────┘
```

| # | Workflow | What it teaches |
|---|----------|-----------------|
| 01 | **Webhook → AI Triage** | HTTP trigger, AI Agent + OpenRouter, defensive JSON parsing, graceful LLM errors |
| 02 | **MCP Server** | n8n *as* an MCP server: three Code tools (`word_stats`, `make_slug`, `course_schedule`) any AI client can call |
| 03 | **Chat Agent using MCP tools** | n8n *as* an MCP client: an agent that discovers and uses the tools from 02 |

The lesson plan (in Ukrainian) is in **[LESSON.md](LESSON.md)**.

**[Visual workflow map](https://andriypolukhin.github.io/n8n-mcp-classroom/workflows.html)** (in Ukrainian) draws every workflow straight from `workflows/*.json`: nodes, connections, and each node's settings and code. Add a workflow to the repo and it shows up there after the next Pages build.

## Quick start: Codespaces (recommended for students)

1. Click **Code → Codespaces → Create codespace on main**.
2. Wait about a minute. Open the **PORTS** tab, then port **5678**, and create your n8n owner account.
3. In n8n, go to **Settings → n8n API → Create API key**. Paste it into `.env` as `N8N_API_KEY=...`.
4. In n8n, go to **Credentials → New → OpenRouter**, paste your OpenRouter key, and copy the credential id from the URL into `.env` as `OPENROUTER_CREDENTIAL_ID=...`.
5. Run:

   ```bash
   node scripts/import.mjs --activate   # push workflows/*.json into n8n
   node scripts/smoke.mjs               # webhook + MCP end-to-end check
   ```

## Quick start: local Docker

```bash
docker compose -f .devcontainer/docker-compose.yml up -d n8n
cp .env.example .env    # fill N8N_API_KEY (+ OPENROUTER_CREDENTIAL_ID)
node scripts/import.mjs --activate && node scripts/smoke.mjs
```

Already have n8n somewhere else, such as a server or an ngrok tunnel? Set `N8N_URL` in `.env` to it.

## Connect an AI client over MCP

```bash
set -a; source .env; set +a   # export N8N_URL / N8N_API_KEY for .mcp.json
claude                        # Claude Code picks up .mcp.json → approve both servers
```

- **`classroom-tools`** is workflow 02 itself. Ask: *"Use classroom-tools to make a slug for «Автоматизація з n8n»"*.
- **`n8n-builder`** is the community [`n8n-mcp`](https://github.com/czlonkowski/n8n-mcp) server, which knows every n8n node and can manage workflows through the API. Ask: *"Create workflow 04 that runs every morning and posts the course_schedule to a webhook"*.

For Claude Desktop or Cursor, add `"<N8N_URL>/mcp/classroom-tools"` as a remote MCP server.

## Workflows as code

| You did… | Run |
|---|---|
| Edited JSON in the repo | `node scripts/import.mjs` |
| Edited a workflow in the n8n UI | `node scripts/export.mjs`, then `git diff` |

Credentials are never stored in the repo. `export.mjs` strips them, and `import.mjs` attaches them from `.env`.

## Security notes for class

- The MCP server in 02 has **no auth**, to keep the demo simple. Anyone who knows the URL can call it. Exercise: switch it to *Bearer auth*.
- `.env` is gitignored. Never commit API keys.
