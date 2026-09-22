// FND-03, FND-04, FND-05: Theme Check config and the `npm run check` gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, cpSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const THEME_DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
const run = (args) =>
  spawnSync('npm', ['run', '--silent', 'check', ...args], { encoding: 'utf8', timeout: 180_000 });

test('FND-03: .theme-check.yml extends theme-check:recommended', () => {
  const yml = readFileSync('.theme-check.yml', 'utf8');
  assert.match(yml, /^extends:\s*['"]?theme-check:recommended['"]?\s*$/m);
});

test('FND-04: npm run check runs theme check --fail-level error and exits 0 on the theme', { timeout: 200_000 }, () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(pkg.scripts.check, 'shopify theme check --fail-level error');
  const res = run([]);
  assert.equal(res.status, 0, `npm run check failed:\n${res.stdout}\n${res.stderr}`);
});

test('FND-05: npm run check exits non-zero when a Liquid file has an unclosed {% if %}', { timeout: 200_000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'theme-check-'));
  try {
    for (const d of THEME_DIRS) cpSync(d, join(dir, d), { recursive: true });
    cpSync('.theme-check.yml', join(dir, '.theme-check.yml'));
    writeFileSync(join(dir, 'snippets', 'broken-fixture.liquid'), '{% if true %}\n<p>unclosed</p>\n');
    const res = run(['--', '--path', dir]);
    assert.notEqual(res.status, 0, 'npm run check must fail on an unclosed {% if %}');
    assert.match(res.stdout + res.stderr, /broken-fixture\.liquid/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
