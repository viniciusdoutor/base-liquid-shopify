// FND-06: `npm run lint:liquid` fails for a `| t` output inside <script> not followed by `| json`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const lint = (args) =>
  spawnSync('npm', ['run', '--silent', 'lint:liquid', ...args], { encoding: 'utf8', timeout: 60_000 });

function withFixture(content, fn) {
  const dir = mkdtempSync(join(tmpdir(), 'lint-liquid-'));
  const file = join(dir, 'fixture.liquid');
  writeFileSync(file, content);
  try {
    return fn(file);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('FND-06: exits non-zero for {{ ... | t }} inside <script> without | json', () => {
  withFixture("<p>ok</p>\n<script>\n  var ADD = '{{ 'x' | t }}';\n</script>\n", (file) => {
    const res = lint(['--', file]);
    assert.notEqual(res.status, 0, 'lint must fail on | t without | json inside <script>');
    assert.match(res.stdout + res.stderr, /fixture\.liquid:3/);
  });
});

test('FND-06: exits 0 for {{ ... | t | json }} inside <script> and plain | t outside <script>', () => {
  withFixture("<p>{{ 'y' | t }}</p>\n<script>\n  var ADD = {{ 'x' | t | json }};\n</script>\n", (file) => {
    const res = lint(['--', file]);
    assert.equal(res.status, 0, `lint must pass:\n${res.stdout}\n${res.stderr}`);
  });
});

test('FND-06: npm run lint:liquid exits 0 on the theme', () => {
  const res = lint([]);
  assert.equal(res.status, 0, `lint:liquid reported violations:\n${res.stdout}\n${res.stderr}`);
});
