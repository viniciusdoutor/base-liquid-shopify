// Theme Check: zero error-severity offenses for files fixed in F0 (BUG-07, BUG-08).
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

let report;

before(() => {
  // Run Theme Check once for the whole file; exit code is non-zero when errors exist,
  // so parse stdout regardless of status.
  const res = spawnSync('npx', ['shopify', 'theme', 'check', '-o', 'json'], {
    encoding: 'utf8',
    timeout: 180_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const start = res.stdout.indexOf('[');
  assert.ok(start >= 0, `theme check produced no JSON output:\n${res.stdout}\n${res.stderr}`);
  report = JSON.parse(res.stdout.slice(start));
});

function errorsFor(relPath) {
  return report
    .filter((f) => f.path.replaceAll('\\', '/').endsWith('/' + relPath))
    .flatMap((f) => f.offenses)
    .filter((o) => o.severity === 'error')
    .map((o) => `${relPath}:${o.start_row + 1} ${o.check} ${o.message}`);
}

test('BUG-08: snippets/localization-form.liquid has zero error-severity offenses', { timeout: 200_000 }, () => {
  assert.deepEqual(errorsFor('snippets/localization-form.liquid'), []);
});
