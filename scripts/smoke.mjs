#!/usr/bin/env node
// End-to-end check of the live instance (run after `import.mjs --activate`):
//   1. POST to the triage webhook and print the AI classification
//   2. Talk MCP (Streamable HTTP, JSON-RPC) to the n8n MCP server: initialize → tools/list → tools/call
import { N8N_URL } from './lib.mjs';

const H = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' };
let failed = 0;
const step = async (name, fn) => {
  try { console.log(`✔ ${name}\n  ${JSON.stringify(await fn())}`); }
  catch (e) { failed++; console.log(`✘ ${name}\n  ${e.message}`); }
};

await step('Webhook → AI triage', async () => {
  const r = await fetch(`${N8N_URL}/webhook/classroom-triage`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ message: 'Привіт! Не можу відкрити відео до модуля 3, пише помилка 403. Дедлайн завтра.' }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const out = await r.json();
  if (!out.ok) throw new Error(`workflow ran but the LLM failed: ${out.error} (check the OpenRouter credential in n8n)`);
  return out.triage;
});

// --- minimal MCP client over Streamable HTTP ---
const MCP = `${N8N_URL}/mcp/classroom-tools`;
let session;
let id = 0;
async function rpc(method, params, notify = false) {
  const r = await fetch(MCP, {
    method: 'POST',
    headers: { ...H, Accept: 'application/json, text/event-stream', ...(session && { 'mcp-session-id': session }) },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, ...(notify ? {} : { id: ++id }) }),
  });
  session = r.headers.get('mcp-session-id') ?? session;
  const text = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0, 300)}`);
  if (notify) return;
  // Response may be plain JSON or an SSE stream ("data: {...}")
  const payload = text.trim().startsWith('{') ? text : text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5)).pop();
  const msg = JSON.parse(payload);
  if (msg.error) throw new Error(JSON.stringify(msg.error));
  return msg.result;
}

await step('MCP initialize', async () => {
  const r = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'classroom-smoke', version: '1.0' } });
  await rpc('notifications/initialized', {}, true);
  return r.serverInfo;
});
await step('MCP tools/list', async () => (await rpc('tools/list', {})).tools.map((t) => t.name));
await step('MCP tools/call word_stats', async () =>
  (await rpc('tools/call', { name: 'word_stats', arguments: { text: 'n8n + MCP = automation that AI can use. Cool!' } })).content);
await step('MCP tools/call make_slug', async () =>
  (await rpc('tools/call', { name: 'make_slug', arguments: { title: 'Автоматизація з n8n та MCP' } })).content);

process.exit(failed ? 1 : 0);
