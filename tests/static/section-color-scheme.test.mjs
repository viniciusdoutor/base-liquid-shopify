// CS-06, CS-07: color_scheme setting + wrapper class on image-banner, rich-text and footer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SECTIONS = ['sections/image-banner.liquid', 'sections/rich-text.liquid', 'sections/footer.liquid'];

test('CS-07: each of image-banner, rich-text and footer defines a color_scheme setting (default scheme-1)', () => {
  for (const file of SECTIONS) {
    const src = readFileSync(file, 'utf8');
    const schemaMatch = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
    assert.ok(schemaMatch, `${file}: no {% schema %} block found`);
    const schema = JSON.parse(schemaMatch[1]);
    const setting = (schema.settings || []).find((s) => s.id === 'color_scheme');
    assert.ok(setting, `${file}: missing color_scheme setting`);
    assert.equal(setting.type, 'color_scheme');
    assert.equal(setting.default, 'scheme-1');
  }
});

test('CS-06: each of image-banner, rich-text and footer applies a color-{{ section.settings.color_scheme }} class on its wrapper', () => {
  for (const file of SECTIONS) {
    const src = readFileSync(file, 'utf8');
    assert.match(src, /class="[^"]*color-\{\{\s*section\.settings\.color_scheme\s*\}\}[^"]*"/, `${file}: wrapper missing color-{{ section.settings.color_scheme }} class`);
  }
});
