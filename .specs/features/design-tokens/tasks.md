# Design Tokens (F1) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path.

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: `.specs/features/design-tokens/design.md`
**Status**: Approved (agent default, autonomous run)

---

## Test Coverage Matrix

> Guidelines found: `CLAUDE.md` (gates), F0 tests as floor. AD-002 test types.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Build config / settings JSON / layout tags / npm scripts | static | 1:1 to spec ACs | `tests/static/*.test.mjs` | `npm run test:static` |
| Node scripts (`scripts/*.mjs`) | static | Every AC + edge case, error paths | `tests/static/*.test.mjs` | `npm run test:static` |
| Rendered CSS tokens / Liquid output | e2e | Happy path + scoped scheme + legacy + edge | `tests/e2e/*.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | Static-only tasks | `npm run test:static` |
| Full | Tasks with e2e | `npm run test:static && npm run test:e2e` |
| Build | End of phase | `npm run check && npm run lint:liquid && npm run test:static` (+ `npm run test:e2e` from Phase 2) |

---

## Execution Plan

### Phase 1: Tailwind pipeline

```
T1 → T2 → T3
```

### Phase 2: Color schemes and tokens

```
T4 → T5 → T6 → T7 → T8
```

### Phase 3: Theme import

```
T9 → T10
```

---

## Task Breakdown

### T1: Tailwind entry and build script

**What**: Install `tailwindcss` + `@tailwindcss/cli` 4.x, create `src/tailwind.css` (theme+utilities layers, no preflight, `@source` for theme folders, safelist, `@theme inline` tokens/radius/fonts), add `build:css`/`watch:css` scripts, commit compiled `assets/tailwind.css`.
**Where**: `src/tailwind.css`
**Depends on**: None
**Reuses**: design.md token table
**Requirement**: TW-01, TW-02, TW-03, TW-04, RAD-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tests/static/tailwind.test.mjs` asserts build exit 0, `.bg-primary` uses `var(--primary)` (via temp liquid fixture with `@source`), every safelist class present, no preflight block, `--radius-sm/md/lg/xl` formulas
- [x] Gate check passes: `npm run test:static`

**Tests**: static
**Gate**: quick

**Commit**: `build(css): add tailwind v4 pipeline with shadcn tokens`

---

### T2: Freshness check and dev runner

**What**: Add static test that rebuilds CSS to a temp file and compares with committed `assets/tailwind.css`; add `concurrently` and `dev` script running `watch:css` + `shopify theme dev`.
**Where**: `package.json`
**Depends on**: T1
**Reuses**: F0 package scripts
**Requirement**: TW-05, TW-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Test fails when committed CSS is stale (proved with a temp mutation) and passes when fresh
- [x] Static test asserts `dev` script runs both commands
- [x] Gate check passes: `npm run test:static`

**Tests**: static
**Gate**: quick

**Commit**: `build(css): add tailwind freshness test and dev runner`

---

### T3: Load tailwind.css in layout

**What**: Add `{{ 'tailwind.css' | asset_url | stylesheet_tag }}` after `index.css` and before `content_for_header`.
**Where**: `layout/theme.liquid`
**Depends on**: T2
**Reuses**: existing stylesheet_tag line
**Requirement**: TW-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Static test asserts tag present and positioned before `content_for_header`
- [x] Gate check passes: `npm run check && npm run lint:liquid && npm run test:static` (build gate, end of phase)

**Tests**: static
**Gate**: build

**Commit**: `feat(layout): load tailwind stylesheet`

---

### T4: Color scheme group and radius settings

**What**: Replace the 7 legacy color settings with `color_scheme_group` `color_schemes` (16 ids, roles per CS-02), add `radius` range, keep `color_sale`, add English labels in `locales/en.default.schema.json`.
**Where**: `config/settings_schema.json`
**Depends on**: None (Phase 1 complete)
**Reuses**: Horizon color_scheme_group pattern
**Requirement**: CS-01, CS-02, CS-08, RAD-01

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [x] `tests/static/settings.test.mjs` asserts ids, roles, radius range/default, removed ids absent, `color_sale` present
- [x] `npm run check` exits 0
- [x] Gate check passes: `npm run test:static`

**Tests**: static
**Gate**: quick

**Commit**: `feat(settings): add shadcn color scheme group and radius`

---

### T5: Default schemes in settings data

**What**: Write scheme-1/2/3 with the design.md hex table in `current` and presets; remove legacy color keys.
**Where**: `config/settings_data.json`
**Depends on**: T4
**Reuses**: design.md default schemes table
**Requirement**: CS-03, CS-08

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [ ] Static test asserts 3 schemes × 16 hex values and no legacy color keys
- [ ] Gate check passes: `npm run test:static`

**Tests**: static
**Gate**: quick

**Commit**: `feat(settings): add default light, dark and inverse schemes`

---

### T6: Emit scheme tokens and legacy aliases

**What**: Rewrite `snippets/css-variables.liquid`: loop `settings.color_schemes` to emit `:root, .color-scheme-1` + `.color-<id>` rules with 18 tokens and the 12 legacy aliases per rule; `:root` gets `--radius`, `--sale`, font families.
**Where**: `snippets/css-variables.liquid`
**Depends on**: T5
**Reuses**: current css-variables font_face logic
**Requirement**: CS-04, CS-05, LEG-01, LEG-02, RAD-05

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [ ] `tests/e2e/tokens.spec.ts` asserts `:root` `--background` = scheme-1 background, injected `.color-scheme-2` wrapper computes scheme-2 values for tokens AND legacy `--color-text`, every legacy alias resolves, `rounded-lg` with radius 0 renders 0px corners (via injected style override of `--radius`)
- [ ] Gate check passes: `npm run test:static && npm run test:e2e`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(tokens): emit shadcn tokens per color scheme`

---

### T7: Section color scheme setting

**What**: Add `color_scheme` setting (default `scheme-1`) and wrapper class `color-{{ section.settings.color_scheme }}` to image-banner, rich-text and footer.
**Where**: `sections/footer.liquid`
**Depends on**: T6
**Reuses**: Horizon section color_scheme usage
**Requirement**: CS-06, CS-07

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [ ] Static test asserts the setting and class in the 3 section files
- [ ] e2e asserts rendered footer wrapper has class `color-scheme-1` and that `.color-scheme-2` rule exists in page CSS
- [ ] Gate check passes: `npm run test:static && npm run test:e2e`

**Tests**: e2e
**Gate**: full

**Commit**: `feat(sections): allow color scheme per section`

---

### T8: Font tokens

**What**: Expose `--font-body-family`/`--font-heading-family` consumed by `font-sans`/`font-heading`; verify end-of-phase build gate including theme check.
**Where**: `src/tailwind.css`
**Depends on**: T7
**Reuses**: T1 theme inline block
**Requirement**: RAD-03, RAD-04, LEG-03

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [ ] e2e asserts injected `.font-sans` / `.font-heading` probes start with body/heading font families from settings
- [ ] Gate check passes: `npm run check && npm run lint:liquid && npm run test:static && npm run test:e2e` (build gate, end of phase)

**Tests**: e2e
**Gate**: build

**Commit**: `feat(tokens): map theme fonts to font-sans and font-heading`

---

### T9: Theme import script

**What**: Create `scripts/import-theme.mjs` (+ `import:theme` script, `culori` devDep): parse `:root`/`.dark`, convert oklch/hsl/rgb/hex to hex with gamut clamp, write `current.color_schemes.scheme-1/2`, card wins over popover.
**Where**: `scripts/import-theme.mjs`
**Depends on**: None (Phase 2 complete)
**Reuses**: design.md token mapping
**Requirement**: IMP-01, IMP-02, IMP-03, IMP-04, IMP-08, IMP-09

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `tests/static/import-theme.test.mjs` with `tests/fixtures/shadcn-neutral.css` asserts exact hex (#ffffff, #0a0a0a, #171717), `.dark` → scheme-2, card over popover, out-of-gamut clamps, hsl/rgb/hex accepted (runs on a temp copy of settings_data.json)
- [ ] Gate check passes: `npm run test:static`

**Tests**: static
**Gate**: quick

**Commit**: `feat(tokens): import shadcn theme css into color schemes`

---

### T10: Import script errors and isolation

**What**: Add error handling (`Nenhum bloco :root encontrado`, `Token ausente: --<nome>`, exit 1) and guarantee only `current.color_schemes` changes.
**Where**: `scripts/import-theme.mjs`
**Depends on**: T9
**Reuses**: T9 script
**Requirement**: IMP-05, IMP-06, IMP-07

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Static tests assert both messages + exit 1, and deep-equal of every other settings_data key before/after
- [ ] Gate check passes: `npm run check && npm run lint:liquid && npm run test:static && npm run test:e2e` (build gate, end of feature)

**Tests**: static
**Gate**: build

**Commit**: `fix(tokens): validate import input and isolate settings changes`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ---→ T2 ---→ T3
Phase 2:  T4 ---→ T5 ---→ T6 ---→ T7 ---→ T8
Phase 3:  T9 ---→ T10
```

Batches: Batch 1 = Phases 1+2 (8 tasks, sonnet); Batch 2 = Phase 3 (2 tasks, sonnet).
