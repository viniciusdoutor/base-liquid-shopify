// FND-01, FND-02: repository line endings are normalized to LF.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

test('FND-01: .gitattributes declares "* text=auto eol=lf"', () => {
  const lines = readFileSync('.gitattributes', 'utf8').split('\n').map((l) => l.trim());
  assert.ok(lines.includes('* text=auto eol=lf'), '.gitattributes must contain "* text=auto eol=lf"');
});

test('FND-02: every tracked text file reports index EOL i/lf', () => {
  const out = execFileSync('git', ['ls-files', '--eol'], { encoding: 'utf8' });
  const entries = out.split('\n').filter(Boolean);
  assert.ok(entries.length > 0, 'git ls-files --eol returned no entries');
  const offenders = entries.filter((e) => {
    const index = e.split(/\s+/)[0];
    return index !== 'i/lf' && index !== 'i/-text' && index !== 'i/none';
  });
  assert.deepEqual(offenders, []);
});
