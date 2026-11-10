#!/usr/bin/env node
// Push every workflows/*.json into n8n (create or update by name).
//   node scripts/import.mjs            → import, keep inactive
//   node scripts/import.mjs --activate → import and activate (needed for production webhook / MCP URLs)
// If OPENROUTER_CREDENTIAL_ID is set, OpenRouter model nodes get that credential attached.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, listWorkflows, N8N_URL } from './lib.mjs';

const activate = process.argv.includes('--activate');
const credId = process.env.OPENROUTER_CREDENTIAL_ID;
const dir = new URL('../workflows/', import.meta.url).pathname;

const existing = await listWorkflows();
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();

for (const file of files) {
  const wf = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  if (credId) {
    for (const n of wf.nodes) {
      if (n.type === '@n8n/n8n-nodes-langchain.lmChatOpenRouter') {
        n.credentials = { openRouterApi: { id: credId, name: 'OpenRouter account' } };
      }
    }
  }
  const body = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings ?? {} };
  const found = existing.find((w) => w.name === wf.name);
  const saved = found ? await api('PUT', `/workflows/${found.id}`, body) : await api('POST', '/workflows', body);
  let state = 'inactive';
  if (activate) {
    try {
      await api('POST', `/workflows/${saved.id}/activate`);
      state = 'ACTIVE';
    } catch (e) {
      state = `activation failed: ${e.message}`;
    }
  }
  console.log(`${found ? 'updated' : 'created'}  ${saved.id}  ${wf.name}  [${state}]`);
  console.log(`         ${N8N_URL}/workflow/${saved.id}`);
}
