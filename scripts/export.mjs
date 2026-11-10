#!/usr/bin/env node
// Pull workflows whose name starts with a prefix back into workflows/*.json (so UI edits land in git).
//   node scripts/export.mjs                    → prefix "Classroom"
//   node scripts/export.mjs "My prefix"
// Credentials are stripped so secrets/ids never reach the repo.
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, listWorkflows } from './lib.mjs';

const prefix = process.argv[2] ?? 'Classroom';
const dir = new URL('../workflows/', import.meta.url).pathname;
const slug = (s) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Reuse the file that already holds this workflow name, so exports never create duplicates.
const byName = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => [JSON.parse(readFileSync(join(dir, f), 'utf8')).name, f]));

for (const w of (await listWorkflows()).filter((w) => w.name.startsWith(prefix))) {
  const full = await api('GET', `/workflows/${w.id}`);
  for (const n of full.nodes) delete n.credentials;
  const out = { name: full.name, nodes: full.nodes, connections: full.connections, settings: { executionOrder: full.settings?.executionOrder ?? 'v1' } };
  const num = (full.name.match(/\b(\d{2})\b/) || [])[1];
  const file = byName[full.name] ?? (num ? `${num}-${slug(full.name.replace(/.*?\d{2}\s*/, ''))}.json` : `${slug(full.name)}.json`);
  writeFileSync(join(dir, file), JSON.stringify(out, null, 2) + '\n');
  console.log(`exported ${w.id} → workflows/${file}`);
}
