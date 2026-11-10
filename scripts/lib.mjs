// Shared helpers: tiny .env loader + n8n public API client. No dependencies (Node 18+).
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(file = resolve(process.cwd(), '.env')) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

loadEnv();

export const N8N_URL = (process.env.N8N_URL || 'http://localhost:5678').replace(/\/$/, '');
const KEY = process.env.N8N_API_KEY;

export async function api(method, path, body) {
  if (!KEY) throw new Error('N8N_API_KEY is not set. Create one in n8n → Settings → n8n API, put it in .env');
  const res = await fetch(`${N8N_URL}/api/v1${path}`, {
    method,
    headers: {
      'X-N8N-API-KEY': KEY,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': '1',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

export async function listWorkflows() {
  const all = [];
  let cursor;
  do {
    const page = await api('GET', `/workflows?limit=100${cursor ? `&cursor=${cursor}` : ''}`);
    all.push(...page.data);
    cursor = page.nextCursor;
  } while (cursor);
  return all;
}
