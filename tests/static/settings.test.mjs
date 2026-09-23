// CS-01, CS-02, CS-08, RAD-01: color_scheme_group + radius in config/settings_schema.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SCHEMA_IDS = [
  'background', 'foreground', 'card', 'card_foreground',
  'primary', 'primary_foreground', 'secondary', 'secondary_foreground',
  'muted', 'muted_foreground', 'accent', 'accent_foreground',
  'destructive', 'border', 'input', 'ring',
];

const REMOVED_LEGACY_IDS = [
  'color_background', 'color_text', 'color_background_contrast', 'color_text_contrast',
  'color_accent', 'color_accent_text', 'color_border',
];

function loadSchema() {
  return JSON.parse(readFileSync('config/settings_schema.json', 'utf8'));
}

function findColorSchemeGroup(schema) {
  for (const group of schema) {
    if (!Array.isArray(group.settings)) continue;
    const found = group.settings.find((s) => s.type === 'color_scheme_group' && s.id === 'color_schemes');
    if (found) return found;
  }
  return null;
}

function findSettingById(schema, id) {
  for (const group of schema) {
    if (!Array.isArray(group.settings)) continue;
    const found = group.settings.find((s) => s.id === id);
    if (found) return found;
  }
  return null;
}

test('CS-01: settings_schema.json defines a color_scheme_group "color_schemes" with the 16 shadcn definition ids', () => {
  const schema = loadSchema();
  const group = findColorSchemeGroup(schema);
  assert.ok(group, 'color_scheme_group "color_schemes" not found');
  assert.ok(Array.isArray(group.definition), 'color_schemes must have a definition array');
  const ids = group.definition.map((d) => d.id);
  assert.deepEqual(ids.sort(), [...SCHEMA_IDS].sort());
});

test('CS-02: color_schemes role maps background.solid, text, button and link roles per spec', () => {
  const schema = loadSchema();
  const group = findColorSchemeGroup(schema);
  const role = group.role;
  assert.equal(role.background.solid, 'background');
  assert.equal(role.text, 'foreground');
  assert.equal(role.primary_button, 'primary');
  assert.equal(role.on_primary_button, 'primary_foreground');
  assert.equal(role.secondary_button, 'secondary');
  assert.equal(role.on_secondary_button, 'secondary_foreground');
  assert.equal(role.primary_button_border, 'primary');
  assert.equal(role.secondary_button_border, 'border');
  assert.equal(role.links, 'primary');
  assert.equal(role.icons, 'foreground');
});

test('CS-08: legacy color settings are removed from settings_schema.json and color_sale remains', () => {
  const schema = loadSchema();
  for (const id of REMOVED_LEGACY_IDS) {
    assert.equal(findSettingById(schema, id), null, `legacy setting "${id}" must be removed`);
  }
  const sale = findSettingById(schema, 'color_sale');
  assert.ok(sale, 'color_sale must remain in settings_schema.json');
  assert.equal(sale.type, 'color');
});

test('RAD-01: settings_schema.json defines a "radius" range setting (0-24px, step 1, default 10)', () => {
  const schema = loadSchema();
  const radius = findSettingById(schema, 'radius');
  assert.ok(radius, '"radius" setting not found');
  assert.equal(radius.type, 'range');
  assert.equal(radius.min, 0);
  assert.equal(radius.max, 24);
  assert.equal(radius.step, 1);
  assert.equal(radius.unit, 'px');
  assert.equal(radius.default, 10);
});
