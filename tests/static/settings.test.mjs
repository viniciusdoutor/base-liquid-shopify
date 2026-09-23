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

function loadData() {
  return JSON.parse(readFileSync('config/settings_data.json', 'utf8'));
}

test('CS-03: settings_data.json defines scheme-1/2/3 with a hex value for each of the 16 definition ids', () => {
  const data = loadData();
  for (const scope of [data.current, data.presets['Base Liquid']]) {
    assert.ok(scope.color_schemes, 'color_schemes missing');
    for (const schemeId of ['scheme-1', 'scheme-2', 'scheme-3']) {
      const scheme = scope.color_schemes[schemeId];
      assert.ok(scheme, `${schemeId} missing`);
      const settings = scheme.settings;
      assert.deepEqual(Object.keys(settings).sort(), [...SCHEMA_IDS].sort(), `${schemeId} must define exactly the 16 ids`);
      for (const id of SCHEMA_IDS) {
        assert.match(settings[id], /^#[0-9a-fA-F]{6}$/, `${schemeId}.${id} must be a hex color`);
      }
    }
  }
});

test('CS-08: legacy color keys are removed from settings_data.json (current and presets), color_sale remains', () => {
  const data = loadData();
  for (const scope of [data.current, data.presets['Base Liquid']]) {
    for (const id of REMOVED_LEGACY_IDS) {
      assert.equal(scope[id], undefined, `legacy key "${id}" must be removed from settings_data.json`);
    }
    assert.equal(scope.color_sale, '#1cb744');
  }
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
