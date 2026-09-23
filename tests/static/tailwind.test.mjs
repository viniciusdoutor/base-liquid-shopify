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

// TW-05 must run before any test that invokes `npm run build:css` (TW-01): that script overwrites the
// real assets/tailwind.css in place, which would make a staleness check vacuously pass afterwards.
// Checking freshness first means it inspects the file exactly as committed to git.
test('TW-05 (tailwind-fresh): committed assets/tailwind.css matches a fresh build of src/tailwind.css', () => {
  const committed = readFileSync(OUTPUT, 'utf8');
  const dir = mkdtempSync(join(tmpdir(), 'tw-fresh-'));
  try {
    const out = join(dir, 'fresh.css');
    const res = spawnSync('npx', ['tailwindcss', '-i', 'src/tailwind.css', '-o', out], {
      encoding: 'utf8',
      timeout: 60_000,
    });
    assert.equal(res.status, 0, `fresh tailwind build failed:\n${res.stdout}\n${res.stderr}`);
    const fresh = readFileSync(out, 'utf8');
    assert.equal(committed, fresh, `${OUTPUT} is stale - run npm run build:css and commit the result`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

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

test('RAD-02: assets/tailwind.css derives rounded-sm/md/lg/xl from var(--radius) with the shadcn formulas', () => {
  // Tailwind inlines a @theme var straight into its one consuming utility when nothing else
  // references it, so --radius-sm/md/xl show up as the calc() inside .rounded-sm/md/xl rather
  // than as standalone custom properties; the formula itself is what RAD-02 requires.
  const css = readFileSync(OUTPUT, 'utf8');
  assert.match(css, /\.rounded-sm\s*\{\s*border-radius:\s*calc\(var\(--radius\)\s*-\s*4px\);?\s*\}/);
  assert.match(css, /\.rounded-md\s*\{\s*border-radius:\s*calc\(var\(--radius\)\s*-\s*2px\);?\s*\}/);
  assert.match(css, /\.rounded-lg\s*\{\s*border-radius:\s*var\(--radius\);?\s*\}/);
  assert.match(css, /\.rounded-xl\s*\{\s*border-radius:\s*calc\(var\(--radius\)\s*\+\s*4px\);?\s*\}/);
});

test("TW-06: layout/theme.liquid loads tailwind.css after index.css and before content_for_header", () => {
  const src = readFileSync('layout/theme.liquid', 'utf8');
  const indexCssIdx = src.indexOf("{{ 'index.css' | asset_url | stylesheet_tag }}");
  const tailwindCssIdx = src.indexOf("{{ 'tailwind.css' | asset_url | stylesheet_tag }}");
  // The file's header comment also mentions "content_for_header" in prose; search past the
  // tailwind.css tag so this finds the real `{{ content_for_header }}` output, not the comment.
  const contentForHeaderIdx = src.indexOf('{{ content_for_header }}', tailwindCssIdx);
  assert.notEqual(indexCssIdx, -1, 'index.css stylesheet_tag not found');
  assert.notEqual(tailwindCssIdx, -1, 'tailwind.css stylesheet_tag not found');
  assert.notEqual(contentForHeaderIdx, -1, 'content_for_header not found');
  assert.ok(indexCssIdx < tailwindCssIdx, 'tailwind.css must load after index.css');
  assert.ok(tailwindCssIdx < contentForHeaderIdx, 'tailwind.css must load before content_for_header');
});

test('TW-07: npm run dev runs watch:css and shopify theme dev in parallel via concurrently', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.match(pkg.scripts.dev, /concurrently/);
  assert.match(pkg.scripts.dev, /watch:css/);
  assert.match(pkg.scripts.dev, /shopify theme dev/);
});
