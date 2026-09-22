#!/usr/bin/env node
// Liquid lint (G1). Rule: inside any <script> block, every {{ ... }} output that
// uses the `t` filter must end with `| json`, so translated strings are emitted
// as escaped JS literals.
// Usage: node scripts/lint-liquid.mjs [file-or-dir ...]   (default: theme dirs)
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const THEME_DIRS = ['layout', 'sections', 'snippets', 'templates', 'blocks'];

function collect(path, out) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry), out);
  } else if (path.endsWith('.liquid')) {
    out.push(path);
  }
  return out;
}

const lineAt = (src, index) => src.slice(0, index).split('\n').length;

function lint(file) {
  // Blank out {% comment %} blocks (keeping newlines) so prose like "<script>" is ignored.
  const src = readFileSync(file, 'utf8').replace(
    /\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g,
    (m) => m.replace(/[^\n]/g, ' '),
  );
  const problems = [];
  const scriptRe = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  for (const script of src.matchAll(scriptRe)) {
    const bodyStart = script.index + script[0].indexOf('>') + 1;
    for (const output of script[1].matchAll(/\{\{-?([\s\S]*?)-?\}\}/g)) {
      const expr = output[1];
      const usesT = /\|\s*t\s*(?=$|[|:,])/.test(expr);
      const endsWithJson = /\|\s*json\s*$/.test(expr);
      if (usesT && !endsWithJson) {
        const line = lineAt(src, bodyStart + output.index);
        problems.push(`${relative(process.cwd(), file)}:${line} \`| t\` inside <script> must end with \`| json\`: ${output[0].trim()}`);
      }
    }
  }
  return problems;
}

const targets = process.argv.slice(2);
const roots = targets.length ? targets : THEME_DIRS.filter((d) => existsSync(d));
const files = roots.flatMap((r) => collect(r, []));
const problems = files.flatMap(lint);

for (const p of problems) console.error(p);
if (problems.length) {
  console.error(`\nlint:liquid: ${problems.length} problem(s) in ${files.length} file(s)`);
  process.exit(1);
}
console.log(`lint:liquid: ${files.length} file(s) OK`);
