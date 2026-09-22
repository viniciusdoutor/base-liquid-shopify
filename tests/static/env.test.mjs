// E2E-04: .env is ignored and .env.example lists the required keys with empty values.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('E2E-04: .env.example lists SHOPIFY_STORE, SHOPIFY_CLI_THEME_TOKEN and SHOPIFY_STOREFRONT_PASSWORD with empty values', () => {
  const entries = Object.fromEntries(
    readFileSync('.env.example', 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      }),
  );
  for (const key of ['SHOPIFY_STORE', 'SHOPIFY_CLI_THEME_TOKEN', 'SHOPIFY_STOREFRONT_PASSWORD']) {
    assert.ok(key in entries, `.env.example must declare ${key}`);
    assert.equal(entries[key], '', `${key} must have an empty value`);
  }
});

test('E2E-04: .env is ignored by git', () => {
  const res = spawnSync('git', ['check-ignore', '-q', '.env']);
  assert.equal(res.status, 0, '.env must be listed in .gitignore');
});
