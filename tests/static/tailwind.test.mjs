// TW-01, TW-02, TW-03, TW-04, RAD-02: Tailwind v4 pipeline (src/tailwind.css -> assets/tailwind.css).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const OUTPUT = 'assets/tailwind.css';
const SAFELIST_TOKENS = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring', 'sale',
];
const SAFELIST_PREFIXES = ['bg', 'text', 'border', 'ring'];

test('TW-01: npm run build:css compiles src/tailwind.css into assets/tailwind.css and exits 0', () => {
  const res = spawnSync('npm', ['run', '--silent', 'build:css'], { encoding: 'utf8', timeout: 60_000 });
  assert.equal(res.status, 0, `npm run build:css failed:\n${res.stdout}\n${res.stderr}`);
  assert.ok(existsSync(OUTPUT), `${OUTPUT} must exist after build:css`);
});

test('TW-02: assets/tailwind.css contains a .bg-primary rule whose value references var(--primary)', () => {
  const css = readFileSync(OUTPUT, 'utf8');
  assert.match(css, /\.bg-primary\s*\{\s*background-color:\s*var\(--primary\);?\s*\}/);
});

test('TW-02: a class only present in a .liquid file under sections/ (not in the safelist) is picked up by @source scanning', () => {
  // fill-primary is outside the {bg,text,border,ring} safelist prefixes (TW-03), so its presence in the
  // build output can only come from the scanner reading the fixture .liquid file added below.
  const dir = mkdtempSync(join(tmpdir(), 'tw-scan-'));
  try {
    for (const d of ['src', 'layout', 'sections', 'snippets', 'blocks', 'templates']) mkdirSync(join(dir, d));
    writeFileSync(join(dir, 'src', 'tailwind.css'), readFileSync('src/tailwind.css', 'utf8'));
    writeFileSync(join(dir, 'sections', '__tw_fixture__.liquid'), '<svg class="fill-primary"></svg>');
    symlinkSync(join(process.cwd(), 'node_modules'), join(dir, 'node_modules'));
    const out = join(dir, 'out.css');
    const res = spawnSync('npx', ['tailwindcss', '-i', join(dir, 'src', 'tailwind.css'), '-o', out], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    assert.equal(res.status, 0, `tailwind build on fixture failed:\n${res.stdout}\n${res.stderr}`);
    const css = readFileSync(out, 'utf8');
    assert.match(css, /\.fill-primary\s*\{\s*fill:\s*var\(--primary\);?\s*\}/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('TW-03: every safelist class {bg,text,border,ring}-{token} is present in assets/tailwind.css', () => {
  const css = readFileSync(OUTPUT, 'utf8');
  const missing = [];
  for (const prefix of SAFELIST_PREFIXES) {
    for (const token of SAFELIST_TOKENS) {
      const className = `${prefix}-${token}`;
      const re = new RegExp(`\\.${className.replace(/-/g, '\\-')}\\s*\\{`);
      if (!re.test(css)) missing.push(className);
    }
  }
  assert.deepEqual(missing, [], `missing safelist classes: ${missing.join(', ')}`);
});

test('TW-04: assets/tailwind.css does not contain the Tailwind preflight box-sizing reset', () => {
  const css = readFileSync(OUTPUT, 'utf8');
  assert.doesNotMatch(css, /box-sizing:\s*border-box/);
});

test('RAD-02: assets/tailwind.css defines --radius-sm/md/lg/xl derived from var(--radius)', () => {
  const css = readFileSync(OUTPUT, 'utf8');
  assert.match(css, /--radius-sm:\s*calc\(var\(--radius\)\s*-\s*4px\)/);
  assert.match(css, /--radius-md:\s*calc\(var\(--radius\)\s*-\s*2px\)/);
  assert.match(css, /--radius-lg:\s*var\(--radius\)/);
  assert.match(css, /--radius-xl:\s*calc\(var\(--radius\)\s*\+\s*4px\)/);
});
