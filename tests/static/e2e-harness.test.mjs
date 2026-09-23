// E2E-01, E2E-02, E2E-05: configuração do harness Playwright (G2).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('E2E-02: npm run test:e2e exits 1 and prints the guard message when SHOPIFY_STORE is not set', { timeout: 120_000 }, () => {
  // An empty value is how .env.example ships; dotenv never overrides an existing variable,
  // so this simulates "not set" without touching the developer's .env.
  const env = { ...process.env, SHOPIFY_STORE: '' };
  const res = spawnSync('npm', ['run', '--silent', 'test:e2e', '--', '--list'], { encoding: 'utf8', env, timeout: 110_000 });
  assert.equal(res.status, 1, `expected exit 1, got ${res.status}\n${res.stdout}\n${res.stderr}`);
  assert.match(`${res.stdout}\n${res.stderr}`, /SHOPIFY_STORE não definido no \.env/);
});

test('E2E-01/E2E-05: test:e2e runs playwright, whose webServer starts shopify theme dev on 127.0.0.1:9292 with a 120 s timeout', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts['test:e2e'], /^playwright test\b/);
  const cfg = readFileSync('playwright.config.ts', 'utf8');
  assert.match(cfg, /testDir:\s*'tests\/e2e'/);
  assert.match(cfg, /shopify theme dev/);
  assert.match(cfg, /--host 127\.0\.0\.1/);
  assert.match(cfg, /const PORT = 9292/);
  assert.match(cfg, /timeout:\s*120_000/);
});
