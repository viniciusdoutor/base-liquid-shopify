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

// CS-09 (SPEC_DEVIATION of CS-01, see spec.md A-10): Shopify rejects settings_schema.json unless
// role.background.gradient references a `color_background` definition, so the definition array
// carries this 17th field alongside the 16 shadcn color ids.
const GRADIENT_ID = 'background_gradient';

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
  // CS-09 (SPEC_DEVIATION): the definition also carries `background_gradient`, required by
  // role.background.gradient (see below) - the 16 shadcn ids are still all present, exactly.
  assert.deepEqual(ids.sort(), [...SCHEMA_IDS, GRADIENT_ID].sort());
});

test('CS-09 (SPEC_DEVIATION of CS-01): background_gradient is a color_background definition referenced by role.background.gradient', () => {
  const schema = loadSchema();
  const group = findColorSchemeGroup(schema);
  const gradientDef = group.definition.find((d) => d.id === GRADIENT_ID);
  assert.ok(gradientDef, `definition must include "${GRADIENT_ID}"`);
  assert.equal(gradientDef.type, 'color_background', 'Shopify requires role.background.gradient to reference a color_background definition');
  assert.equal(group.role.background.gradient, GRADIENT_ID);
});

test('CS-02: color_schemes role maps background.solid, text, button and link roles per spec', () => {
  const schema = loadSchema();
  const group = findColorSchemeGroup(schema);
  const role = group.role;
  assert.equal(role.background.solid, 'background');
  assert.equal(role.background.gradient, GRADIENT_ID);
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
      // CS-09 (SPEC_DEVIATION): background_gradient is the 17th key, required by the schema's
      // color_background definition; it is not a hex color and is checked separately below.
      assert.deepEqual(
        Object.keys(settings).sort(),
        [...SCHEMA_IDS, GRADIENT_ID].sort(),
        `${schemeId} must define the 16 shadcn ids plus ${GRADIENT_ID}`,
      );
      for (const id of SCHEMA_IDS) {
        assert.match(settings[id], /^#[0-9a-fA-F]{6}$/, `${schemeId}.${id} must be a hex color`);
      }
      assert.equal(settings[GRADIENT_ID], '', `${schemeId}.${GRADIENT_ID} must be an empty color_background value (no gradient set)`);
    }
  }
});

test('CS-08: legacy color keys are removed from settings_data.json (current and presets), color_sale remains a valid hex', () => {
  // color_sale's exact value is a brand choice (client customizations change it), not part of
  // this spec's contract — CS-08 only requires the key to exist and stay a valid hex color, so
  // customizing a store's color_sale must never require editing this test.
  const data = loadData();
  for (const scope of [data.current, data.presets['Base Liquid']]) {
    for (const id of REMOVED_LEGACY_IDS) {
      assert.equal(scope[id], undefined, `legacy key "${id}" must be removed from settings_data.json`);
    }
    assert.match(scope.color_sale, /^#[0-9a-fA-F]{6}$/, 'color_sale must be a hex color');
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
