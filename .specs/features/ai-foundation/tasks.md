# AI Foundation (F0) Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (Medium scope - no design.md)
**Status**: In Progress

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec. Guidelines found: none - strong defaults applied. No pre-existing tests in the repo; test types follow AD-002 (G1 static via `node:test`, G2 e2e via Playwright).

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
| ---------- | ------------------ | -------------------- | ---------------- | ----------- |
| Repo config (`.gitattributes`, `.theme-check.yml`, `.mcp.json`, `.env.example`, `CLAUDE.md`, `package.json`) | static | 1:1 to spec ACs | `tests/static/*.test.mjs` | `npm run test:static` |
| Liquid syntax (sections/snippets/templates) | static | Theme Check zero errors per touched file | `tests/static/theme-check.test.mjs` | `npm run test:static` |
| Lint scripts (`scripts/*.mjs`) | static | Positive + negative fixture per rule | `tests/static/lint-liquid.test.mjs` | `npm run test:static` |
| Rendered storefront behavior (Liquid output, inline JS, CSS) | e2e | Happy path + listed edge cases (fixture absent) per AC | `tests/e2e/*.spec.ts` | `npm run test:e2e` |

## Gate Check Commands

| Gate Level | When to Use | Command |
| ---------- | ----------- | ------- |
| Quick | After tasks with static tests only | `npm run test:static` |
| Full | After tasks with e2e tests | `npm run test:static && npm run test:e2e` |
| Build | After phase completion | `npm run check && npm run lint:liquid && npm run test:static` (+ `npm run test:e2e` from Phase 2 on) |

---

## Execution Plan

### Phase 1: Static foundation (no store required)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8
```

### Phase 2: E2E harness (requires dev store - A-01)

```
T9
```

### Phase 3: Storefront bug fixes (requires dev store)

```
T10 → T11 → T12 → T13 → T14
```

---

## Task Breakdown

### T1: Normalize line endings to LF

**What**: Add `.gitattributes` (`* text=auto eol=lf`), renormalize the index, and add a static test asserting FND-01/FND-02.
**Where**: `.gitattributes`
**Depends on**: None
**Reuses**: `.editorconfig` (already declares `end_of_line = lf`)
**Requirement**: FND-01, FND-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `.gitattributes` exists with `* text=auto eol=lf`
- [x] `tests/static/eol.test.mjs` asserts every `git ls-files --eol` entry with `i/` text EOL reports `i/lf`
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 2 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `chore: normalize line endings to lf`

---

### T2: Fix Theme Check syntax errors in localization form

**What**: Replace the filter expressions inside `{% form 'localization', id: ... | append: ... %}` with pre-assigned variables so Theme Check reports zero errors (BUG-08); create the Theme Check static test helper.
**Where**: `snippets/localization-form.liquid`
**Depends on**: T1
**Reuses**: Dawn pattern (`assign form_id = ...` before `{% form %}`)
**Requirement**: BUG-08

**Tools**:

- MCP: `shopify-dev` (docs search for `form` tag)
- Skill: NONE

**Done when**:

- [x] `tests/static/theme-check.test.mjs` runs `shopify theme check -o json` once and asserts zero error-severity offenses for `snippets/localization-form.liquid`
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 3 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `fix(localization): remove filters from form tag parameters`

---

### T3: Replace inline QR encoder in gift card with Shopify's vendor library

**What**: Remove the hand-written inline QR encoder from the gift card template and load `'vendor/qrcode.js' | shopify_asset_url` (BUG-07), rendering a QR of at least 120×120 px.
**Where**: `templates/gift_card.liquid`
**Depends on**: T2
**Reuses**: Dawn `gift_card.liquid` QR usage (`new QRCode(el, { text, width: 120, height: 120 })`)
**Requirement**: BUG-07

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [x] Theme Check static test asserts zero error-severity offenses for `templates/gift_card.liquid`
- [x] Static test asserts the template contains `'vendor/qrcode.js' | shopify_asset_url`
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 5 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `fix(gift-card): use shopify vendor qrcode library`

---

### T4: Theme Check config and `npm run check`

**What**: Add `.theme-check.yml` extending `theme-check:recommended` and the `check` npm script (`shopify theme check --fail-level error`); tests assert exit 0 on the theme and non-zero on a broken fixture.
**Where**: `.theme-check.yml`
**Depends on**: T3
**Reuses**: `package.json` created during research (`@shopify/cli` devDependency)
**Requirement**: FND-03, FND-04, FND-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `npm run check` exits 0 on the theme
- [x] Test copies the theme to a temp dir, injects an unclosed `{% if %}`, and asserts non-zero exit
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 8 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `build: add theme check config and check script`

---

### T5: Liquid lint for untranslated-string escaping in scripts

**What**: Create `scripts/lint-liquid.mjs` (rule: inside `<script>`, any `{{ ... | t ... }}` must end with `| json`), wire `npm run lint:liquid`, and fix the violations in `snippets/product-variant-selection.liquid` (BUG-03 root cause).
**Where**: `scripts/lint-liquid.mjs`
**Depends on**: T4
**Reuses**: none
**Requirement**: FND-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tests/static/lint-liquid.test.mjs` has a failing fixture (`'{{ 'x' | t }}'` in `<script>`) and a passing fixture (`{{ 'x' | t | json }}`)
- [x] `npm run lint:liquid` exits 0 on the theme after the fix
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 11 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `fix(product): escape translated strings in variant script via json`

---

### T6: MCP servers for agents

**What**: Add `.mcp.json` declaring `shopify-dev` (`npx -y @shopify/dev-mcp@latest`) and `shadcn` (`npx shadcn@latest mcp`).
**Where**: `.mcp.json`
**Depends on**: T5
**Reuses**: none
**Requirement**: AI-01, AI-02

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tests/static/ai-context.test.mjs` asserts both server entries with exact command/args
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 13 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `chore: add shopify-dev and shadcn mcp servers`

---

### T7: CLAUDE.md project context

**What**: Write `CLAUDE.md` with sections `Gates`, `Decisões (AD)`, `Convenções`, `Mapa de pastas`.
**Where**: `CLAUDE.md`
**Depends on**: T6
**Reuses**: `README.md` (folder map), `.specs/STATE.md` (AD-001, AD-002)
**Requirement**: AI-03

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Static test asserts the 4 headings and the 3 gate commands
- [x] Gate check passes: `npm run test:static`
- [x] Test count: 15 tests pass

**Tests**: static
**Gate**: quick

**Commit**: `docs: add claude.md with gates, decisions and conventions`

---

### T8: Environment template

**What**: Add `.env.example` with empty `SHOPIFY_STORE`, `SHOPIFY_CLI_THEME_TOKEN`, `SHOPIFY_STOREFRONT_PASSWORD`, and add `.env` + `node_modules` + `test-results` to `.gitignore`.
**Where**: `.env.example`
**Depends on**: T7
**Reuses**: `.gitignore`
**Requirement**: E2E-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] Static test asserts the 3 keys with empty values and `.env` ignored (`git check-ignore .env`)
- [x] Gate check passes: `npm run check && npm run lint:liquid && npm run test:static` (build gate, end of phase)
- [x] Test count: 17 tests pass

**Tests**: static
**Gate**: build

**Commit**: `chore: add env template and ignore local secrets`

---

### T9: Playwright harness with theme dev web server

**What**: Add `playwright.config.ts` whose `webServer` runs `shopify theme dev --store $SHOPIFY_STORE --store-password $SHOPIFY_STOREFRONT_PASSWORD --port 9292` (timeout 120 s), an env guard that exits 1 with `SHOPIFY_STORE não definido no .env`, and the smoke spec.
**Where**: `playwright.config.ts`
**Depends on**: None (Phase 1 complete)
**Reuses**: `.env.example`
**Requirement**: E2E-01, E2E-02, E2E-03, E2E-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [x] `tests/e2e/smoke.spec.ts` asserts `/` status 200 and `main#MainContent`
- [x] Static test asserts the env guard message and exit code 1 with `SHOPIFY_STORE` unset
- [x] Gate check passes: `npm run test:static && npm run test:e2e`
- [x] Test count: 19 static + 1 e2e pass (extra static test pins the webServer command, host, port and 120 s timeout)

**Tests**: e2e
**Gate**: full

**Commit**: `test: add playwright harness against shopify theme dev`

---

### T10: Format "from" price with money filter

**What**: In `snippets/price.liquid`, assign `product.price_min | money` before calling `t: price:`.
**Where**: `snippets/price.liquid`
**Depends on**: None (Phase 2 complete)
**Reuses**: none
**Requirement**: BUG-01, E2E-06

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [x] `tests/e2e/price.spec.ts` finds a demo product with price variation (fails with `Fixture ausente: produto com preços variáveis` otherwise) and asserts the card price text contains the money-formatted `price_min` and not the raw cents integer
- [x] Gate check passes: `npm run test:static && npm run test:e2e`
- [x] Test count: 2 e2e pass

**Tests**: e2e
**Gate**: full

**Commit**: `fix(price): format from-price with money filter`

---

### T11: Eager-load the LCP product image

**What**: In `sections/main-product.liquid`, use `loading: 'eager', fetchpriority: 'high'` for `forloop.first` image media and `loading: 'lazy'` for the rest.
**Where**: `sections/main-product.liquid`
**Depends on**: T10
**Reuses**: none
**Requirement**: BUG-02, BUG-03

**Tools**:

- MCP: `shopify-dev`
- Skill: NONE

**Done when**:

- [ ] `tests/e2e/product-media.spec.ts` asserts attributes on first vs subsequent images (fails with `Fixture ausente: produto com 2+ imagens` otherwise)
- [ ] Gate check passes: `npm run test:static && npm run test:e2e`
- [ ] Test count: 4 e2e pass

**Tests**: e2e
**Gate**: full

**Commit**: `perf(product): eager-load first media image with high fetch priority`

---

### T12: Variant change regression test

**What**: Add a regression spec: changing an option updates `input.product-variant-id` to the matching variant id with zero `pageerror` events.
**Where**: `tests/e2e/variant.spec.ts`
**Depends on**: T11
**Reuses**: `snippets/product-variant-selection.liquid` (fixed in T5)
**Requirement**: BUG-04

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] Spec passes on a demo product with 2+ variants
- [ ] Gate check passes: `npm run test:static && npm run test:e2e`
- [ ] Test count: 5 e2e pass

**Tests**: e2e
**Gate**: full

**Commit**: `test(product): cover variant selection regression`

---

### T13: Build cart API URLs from routes root

**What**: In `assets/carrinho.js`, build `cart/add.js` and `cart.js` URLs from `window.Shopify.routes.root`.
**Where**: `assets/carrinho.js`
**Depends on**: T12
**Reuses**: existing `refreshCartCount` root handling
**Requirement**: BUG-05

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `tests/e2e/cart-routes.spec.ts` sets `window.Shopify.routes.root = '/xx-test/'`, intercepts requests and asserts the add request path is `/xx-test/cart/add.js`
- [ ] Gate check passes: `npm run test:static && npm run test:e2e`
- [ ] Test count: 6 e2e pass

**Tests**: e2e
**Gate**: full

**Commit**: `fix(cart): build cart api urls from shopify routes root`

---

### T14: Fluid type scale

**What**: In `snippets/css-variables.liquid`, rewrite `--f0..--f8` as `clamp(min, calc(rem + vw), max)` so values grow with the viewport.
**Where**: `snippets/css-variables.liquid`
**Depends on**: T13
**Reuses**: current min/max values of each step
**Requirement**: BUG-06

**Tools**:

- MCP: NONE
- Skill: NONE

**Done when**:

- [ ] `tests/e2e/type-scale.spec.ts` asserts computed font-size of a `var(--f8)` probe is strictly greater at 1440px than at 375px
- [ ] Gate check passes: `npm run check && npm run lint:liquid && npm run test:static && npm run test:e2e` (build gate, end of feature)
- [ ] Test count: 7 e2e pass

**Tests**: e2e
**Gate**: build

**Commit**: `fix(css): make type scale fluid between mobile and desktop`

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ---→ T2 ---→ T3 ---→ T4 ---→ T5 ---→ T6 ---→ T7 ---→ T8
Phase 2:  T9
Phase 3:  T10 ---→ T11 ---→ T12 ---→ T13 ---→ T14
```

Batches (~7 tasks, whole phases): Batch 1 = Phase 1 (8 tasks); Batch 2 = Phases 2+3 (6 tasks).
