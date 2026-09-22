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
