// AI-01, AI-02, AI-03: agent context (MCP servers and CLAUDE.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mcp = () => JSON.parse(readFileSync('.mcp.json', 'utf8')).mcpServers;

test('AI-01: .mcp.json declares shopify-dev as npx -y @shopify/dev-mcp@latest', () => {
  const server = mcp()['shopify-dev'];
  assert.equal(server.command, 'npx');
  assert.deepEqual(server.args, ['-y', '@shopify/dev-mcp@latest']);
});

test('AI-02: .mcp.json declares shadcn as npx shadcn@latest mcp', () => {
  const server = mcp().shadcn;
  assert.equal(server.command, 'npx');
  assert.deepEqual(server.args, ['shadcn@latest', 'mcp']);
});

const REQUIRED_SECTIONS = ['Gates', 'Decisões (AD)', 'Convenções', 'Mapa de pastas'];

function section(md, title) {
  const lines = md.split('\n');
  const start = lines.indexOf(`## ${title}`);
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && l.startsWith('## '));
  return lines.slice(start + 1, end === -1 ? undefined : end).join('\n');
}

test('AI-03: CLAUDE.md has the sections Gates, Decisões (AD), Convenções and Mapa de pastas', () => {
  const md = readFileSync('CLAUDE.md', 'utf8');
  const missing = REQUIRED_SECTIONS.filter((title) => section(md, title) === null);
  assert.deepEqual(missing, []);
});

test('AI-03: the Gates section lists npm run check, npm run lint:liquid and npm run test:e2e', () => {
  const gates = section(readFileSync('CLAUDE.md', 'utf8'), 'Gates') ?? '';
  for (const cmd of ['npm run check', 'npm run lint:liquid', 'npm run test:e2e']) {
    assert.ok(gates.includes(cmd), `Gates section must list \`${cmd}\``);
  }
});
