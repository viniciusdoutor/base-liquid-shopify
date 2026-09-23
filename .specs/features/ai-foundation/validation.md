# AI Foundation (F0) Validation

## Validation: ai-foundation - FAIL ❌

**Date**: 2026-09-23
**Spec**: `.specs/features/ai-foundation/spec.md`
**Diff range**: `14c5e47..HEAD` (feature commits `1548b09..b1d3b62`)
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

All 14 tasks in `tasks.md` (T1-T14) are marked done and each has a corresponding atomic commit (`1548b09`..`b1d3b62`). No task marked partial or blocked.

---

## Spec-Anchored Acceptance Criteria

### P1: Repositório normalizado e gate estático (G1)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | --------------------- | ------------------------ | ------ |
| `.gitattributes` declares `* text=auto eol=lf` (FND-01) | line `* text=auto eol=lf` present | `tests/static/eol.test.mjs:7-9` - `assert.ok(lines.includes('* text=auto eol=lf'))`; `.gitattributes:1` | ✅ PASS |
| `git ls-files --eol` reports `i/lf` for every tracked text file (FND-02) | 0 offenders | `tests/static/eol.test.mjs:12-20` - `assert.deepEqual(offenders, [])` (live run: 0 offenders) | ✅ PASS |
| `.theme-check.yml` extends `theme-check:recommended` (FND-03) | `extends: theme-check:recommended` | `tests/static/check.test.mjs:13-15` - `assert.match(yml, /^extends:...theme-check:recommended.../m)`; `.theme-check.yml:1` | ✅ PASS |
| `npm run check` runs `shopify theme check --fail-level error`, exits 0 (FND-04) | exit code `0` | `tests/static/check.test.mjs:18-22` - `assert.equal(res.status, 0)` (live run confirmed: "56 files inspected with no offenses found") | ✅ PASS |
| Unclosed `{% if %}` makes `npm run check` fail (FND-05) | exit code ≠ 0 | `tests/static/check.test.mjs:25-33` - `assert.notEqual(res.status, 0)` | ✅ PASS |
| `npm run lint:liquid` fails for `\| t` in `<script>` without `\| json` (FND-06) | exit code ≠ 0 | `tests/static/lint-liquid.test.mjs:23-29` - `assert.notEqual(res.status, 0)`; passes clean case `tests/static/lint-liquid.test.mjs:31-36` and on real theme `:38-41` | ✅ PASS |

### P1: Harness de comportamento (G2)

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | --------------------- | ------------------------ | ------ |
| `test:e2e` starts `theme dev` on `127.0.0.1:9292` (E2E-01) | webServer command targets that host:port | `tests/static/e2e-harness.test.mjs:16-23`; `playwright.config.ts:17,34` (live run confirmed server bound to `127.0.0.1:9292`) | ✅ PASS |
| `SHOPIFY_STORE` unset → exit 1 + exact message (E2E-02) | exit `1`, stdout/stderr matches `SHOPIFY_STORE não definido no .env` | `tests/static/e2e-harness.test.mjs:7-13` - `assert.equal(res.status,1)` + `assert.match(...,/SHOPIFY_STORE não definido no \.env/)` | ✅ PASS |
| `/` responds 200 with `main#MainContent` (E2E-03) | status `200`, element count `1` | `tests/e2e/smoke.spec.ts:4-8` - `expect(response!.status()).toBe(200)`, `expect(page.locator('main#MainContent')).toHaveCount(1)` (live run: PASS, 819ms) | ✅ PASS |
| `.env` gitignored, `.env.example` lists 3 keys empty (E2E-04) | `git check-ignore` exit 0; 3 keys present with `''` | `tests/static/env.test.mjs:7-22` (keys) and `:24-26` (`git check-ignore -q .env` exit 0) | ✅ PASS |

### P1: Correção dos 5 bugs

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | --------------------- | ------------------------ | ------ |
| Price card: `price_min` formatted by `money`, no raw cents (BUG-01) | text matches money pattern, excludes raw integer | `tests/e2e/price.spec.ts:23-24` - `expect(priceText).toMatch(moneyPattern(priceMin))` + `.not.toContain(String(priceMin))`. Fix: `snippets/price.liquid:49,54` (`assign price_min_money = product.price_min \| money` then `t: price: price_min_money`). Live run: PASS (9.1s) | ✅ PASS |
| First media image `loading=eager` + `fetchpriority=high` (BUG-02) | both attributes present | `tests/e2e/product-media.spec.ts:14-15` - `toHaveAttribute('loading','eager')` + `toHaveAttribute('fetchpriority','high')`. Fix: `sections/main-product.liquid:53-64`. Live run: PASS | ✅ PASS |
| Remaining media images `lazy`, no `fetchpriority=high` (BUG-03) | `loading=lazy`, `fetchpriority != 'high'` | `tests/e2e/product-media.spec.ts:27-30`. Fix: `sections/main-product.liquid:65-75`. Live run: PASS | ✅ PASS |
| Variant switch updates hidden id, zero `pageerror` (BUG-04) | `input.product-variant-id` value == target id, 0 pageerrors | `tests/e2e/variant.spec.ts:27-28` - `toHaveValue(String(target!.id))` + `expect(pageErrors).toHaveLength(0)`. Fix: `snippets/product-variant-selection.liquid:42-44` (`\| t \| json`). Live run: PASS | ✅ PASS |
| Add-to-cart uses `routes.root`, hits `/xx-test/cart/add.js` (BUG-05) | intercepted request path == `/xx-test/cart/add.js` | `tests/e2e/cart-routes.spec.ts:27` - `expect(seenUrls[0]).toBe('/xx-test/cart/add.js')`. Fix: `assets/carrinho.js:24-28,53` (`routesRoot()` helper). Live run: PASS (1.4s) | ✅ PASS |
| `--f8` computed font-size strictly greater at 1440px than 375px (BUG-06) | `desktopSize > mobileSize` | `tests/e2e/type-scale.spec.ts:25` - `expect(desktopSize).toBeGreaterThan(mobileSize)`. Fix: `snippets/css-variables.liquid:64-77` (`clamp(3rem, calc(2.6479rem + 1.5023vw), 4rem)` for `--f8`, verified monotonic: ≈48px at 375px vw-term, ≈64px at 1440px). Live run: PASS | ✅ PASS |
| `gift_card.liquid` 0 Theme Check errors + loads `'vendor/qrcode.js' \| shopify_asset_url` (BUG-07) | 0 error-severity offenses; script tag present | `tests/static/theme-check.test.mjs:33-34` (0 errors, live theme-check confirms); `tests/static/gift-card.test.mjs:8-10` (regex match on `templates/gift_card.liquid:266`). **However**: no file `assets/vendor/qrcode.js` exists anywhere in the repository (`git ls-files \| grep -i qrcode` → empty, `find . -iname '*qrcode*'` → empty). The `<script src="{{ 'vendor/qrcode.js' \| shopify_asset_url }}">` therefore resolves to a 404 CDN URL at runtime; `window.QRCode` will be undefined and the guarded `if (... && window.QRCode)` in `templates/gift_card.liquid` silently skips rendering — the QR code will never appear for a real customer. The literal AC text (theme-check clean + markup pattern) is satisfied, but the outcome the story requires ("carrinho funcionando" / bug actually fixed) is not. | ❌ GAP (spec-precision: AC text passes, functional outcome fails) |
| `localization-form.liquid` 0 Theme Check errors (BUG-08) | 0 error-severity offenses | `tests/static/theme-check.test.mjs:29-30` (live theme-check confirms). Fix: `snippets/localization-form.liquid:24,47` (`assign ..._form_id` before `form` tag, removing filters from tag parameters) | ✅ PASS |

### P2: Contexto para agentes de IA

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | --------------------- | ------------------------ | ------ |
| `.mcp.json` declares `shopify-dev` (`npx -y @shopify/dev-mcp@latest`) (AI-01) | exact command/args | `tests/static/ai-context.test.mjs:8-12`; `.mcp.json:3-6` | ✅ PASS |
| `.mcp.json` declares `shadcn` (`npx shadcn@latest mcp`) (AI-02) | exact command/args | `tests/static/ai-context.test.mjs:14-18`; `.mcp.json:7-10` | ✅ PASS |
| `CLAUDE.md` has 4 required sections incl. Gates listing 3 commands (AI-03) | all 4 sections present; Gates lists all 3 commands | `tests/static/ai-context.test.mjs:30-40`; `CLAUDE.md:5-13` | ✅ PASS |

**Status**: ❌ 1 gap present (BUG-07 functional outcome) — all other 22/23 requirement IDs fully covered and spec-anchored.

---

## Discrimination Sensor

Ran in an isolated `git worktree` (`git worktree add`, never `git stash`), with `node_modules` symlinked and `.env` copied (values never printed). `playwright.config.ts`'s `PORT` constant was changed 9292→9293 inside the worktree copy only (never in the real tree) so the mutated `shopify theme dev` instance did not collide with the real tree's port. Baseline `git status --porcelain` of the real tree was empty before the sensor ran.

| # | File:line (worktree) | Mutation | Tests run | Killed? |
| - | --------------------- | -------- | --------- | ------- |
| 1 | `snippets/price.liquid:54` | Reverted BUG-01 fix: `t: price: product.price_min \| money` (money misapplied to translation output, not to `price_min`) | `tests/e2e/price.spec.ts` (BUG-01) | ✅ Killed — `expect(priceText).toMatch(...)` failed, received `"R$ 0,00"` instead of the formatted price |
| 2 | `sections/main-product.liquid:52-60` | Reverted BUG-02 fix: removed the `unless first_image_seen` branch so every media image renders with `loading: 'lazy'` (no `fetchpriority: 'high'` on the first) | `tests/e2e/product-media.spec.ts` (BUG-02, BUG-03) | ✅ Killed — BUG-02 failed: `toHaveAttribute('loading','eager')` received `"lazy"`; BUG-03 still passed (expected, since "all lazy" is a superset of BUG-03's assertion) |
| 3 | `assets/carrinho.js:53` | Reintroduced hardcoded `fetch('/cart/add.js', ...)` instead of `fetch(routesRoot() + 'cart/add.js', ...)` | `tests/e2e/cart-routes.spec.ts` (BUG-05) | ✅ Killed — `expect(seenUrls[0]).toBe('/xx-test/cart/add.js')` failed, received `"/cart/add.js"` |

All three mutations targeted live Playwright specs run against `shopify theme dev` on `127.0.0.1:9293` against the same dev store declared in `.env` (read-only theme preview; no `theme push`/`publish`, no Admin API writes). Worktree removed with `git worktree remove --force`; real tree `git status --porcelain` re-checked and confirmed identical (empty) to the pre-sensor baseline.

**Sensor depth**: lightweight (default tier, 3 mutations across 3 independent behaviors)
**Outcome**: 3/3 mutations killed (all discriminating)

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| No features beyond what was asked | ✅ |
| No abstractions for single-use code | ✅ |
| No unnecessary "flexibility" added | ✅ |
| Only touched files required for task | ✅ |
| Didn't "improve" unrelated code | ✅ |
| Matches existing patterns/style | ✅ |
| Would senior engineer approve? | ❌ — BUG-07 references a vendor asset that was never added; would be rejected in review |
| Tests map to ACs, non-shallow | ✅ (spot-checked P1 bugs story: each e2e spec targets the exact attribute/value the AC names) |
| Spec-anchored outcome check | ⚠️ 22/23 match outcome; BUG-07 test asserts markup pattern, not that the library is actually loadable |
| Per-layer coverage (domain 1:1 AC; e2e happy+edge+error) | ⚠️ e2e covers happy paths for all 5 bugs; the two "fixture ausente" edge cases (E2E-06) and the `theme dev` startup-timeout edge case (E2E-05) are implemented (`tests/e2e/fixtures.ts:18-26`, `playwright.config.ts:27` `timeout: 120_000`) but not exercised by a passing/failing test that proves the failure path — reasonable given the dev store currently has the required fixtures and simulating a 120s CLI failure is impractical, but it is a coverage gap on paper |
| Every test maps to a spec requirement | ✅ no unclaimed tests found |
| Documented guidelines followed | ✅ `CLAUDE.md` Convenções (`{% render %}`, `\| t`, `\| json` in scripts, LF endings) - all followed in the diff |

---

## Edge Cases

- [ ] `shopify theme dev` fails to start within 120s → non-zero exit + CLI error printed: config value present (`playwright.config.ts:27`) but the failure path itself is not exercised by a test — ⚠️ unverified
- [ ] Dev store lacks a 2+-image product → BUG-02/03 fail with `Fixture ausente: produto com 2+ imagens`: implemented (`tests/e2e/fixtures.ts:29,32`) but not exercised (store currently has the fixture) — ⚠️ unverified
- [ ] Dev store lacks a variable-price product → BUG-01 fails with `Fixture ausente: produto com preços variáveis`: implemented (`tests/e2e/fixtures.ts:28,31`) but not exercised — ⚠️ unverified

---

## Gate Check

- **Gate commands**: `npm run test:static` (static/G1), `npm run check` (Theme Check), `npm run test:e2e` (G2, live against the dev store in `.env`)
- **`npm run test:static`**: 19 passed, 0 failed, 0 skipped
- **`npm run check`**: exit 0, "56 files inspected with no offenses found"
- **`npm run test:e2e`**: 7 passed, 0 failed (live run against `flowera-base-e2e.myshopify.com`, port 127.0.0.1:9292)
- **Test count before feature**: 0 (this feature introduces the entire test harness)
- **Test count after feature**: 26 (19 static + 7 e2e)
- **Delta**: +26 new tests
- **Skipped tests**: none
- **Failures**: none in the current tree; sensor mutations (scratch-only) are documented above

---

## Fix Plans

### Fix 1: BUG-07 QR code library file missing (`vendor/qrcode.js`)

- **Root cause**: `templates/gift_card.liquid` was updated to reference `'vendor/qrcode.js' | shopify_asset_url` (replacing the inline QR encoder), and `T3`'s "Done when" checklist only asserted the Theme Check result and a markup regex — it never asserted the referenced file exists in `assets/`. No commit in `1548b09..b1d3b62` adds `assets/vendor/qrcode.js` (confirmed via `git ls-files | grep -i qrcode` → no results). The script tag will 404 in any real preview/production render.
- **Fix task**: Add the actual QR library file at `assets/vendor/qrcode.js` (e.g. the MIT-licensed `davidshimjs/qrcodejs` `QRCode` global that `templates/gift_card.liquid`'s `new QRCode(host, {...})` call expects), or adjust the asset path/filter to point at a file that is actually shipped. Verify with: (1) `git ls-files | grep -c 'assets/vendor/qrcode.js'` equals 1; (2) a new e2e assertion that visits a gift card preview URL and asserts `window.QRCode` is defined and `#QrCode` gets a non-empty child after load.
- **Priority**: Major (customer-visible: gift card recipients see no QR code; not a Blocker since the page itself doesn't error and the rest of the gift card page renders correctly)

---

## Requirement Traceability Update

| Requirement | Previous Status | New Status |
| ----------- | ---------------- | ---------- |
| FND-01 | Implementing | ✅ Verified |
| FND-02 | Implementing | ✅ Verified |
| FND-03 | Implementing | ✅ Verified |
| FND-04 | Implementing | ✅ Verified |
| FND-05 | Implementing | ✅ Verified |
| FND-06 | Implementing | ✅ Verified |
| E2E-01 | Implementing | ✅ Verified |
| E2E-02 | Implementing | ✅ Verified |
| E2E-03 | Implementing | ✅ Verified |
| E2E-04 | Implementing | ✅ Verified |
| E2E-05 | Implementing | ⚠️ Verified (config only, failure path unexercised) |
| E2E-06 | Implementing | ⚠️ Verified (implemented, failure path unexercised) |
| BUG-01 | Implementing | ✅ Verified |
| BUG-02 | Implementing | ✅ Verified |
| BUG-03 | Implementing | ✅ Verified |
| BUG-04 | Implementing | ✅ Verified |
| BUG-05 | Implementing | ✅ Verified |
| BUG-06 | Implementing | ✅ Verified |
| BUG-07 | Implementing | ❌ Needs Fix |
| BUG-08 | Implementing | ✅ Verified |
| AI-01 | Implementing | ✅ Verified |
| AI-02 | Implementing | ✅ Verified |
| AI-03 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ⚠️ Issues (1 grounded gap; everything else green)

**Spec-anchored check**: 22/23 ACs matched spec outcome, 1 gap (BUG-07), 2 minor spec-precision/unexercised-edge-case notes (E2E-05, E2E-06)
**Sensor**: 3/3 mutations killed
**Gate**: 19 static + 7 e2e passed, 0 failed (theme check clean)

**What works**: G1 (Theme Check + Liquid lint + LF normalization) and G2 (Playwright against a live `shopify theme dev` dev store) are both real, exit-code-reliable gates. All 8 bugs have dedicated regression tests; BUG-01, 02, 03, 05, 06, 08 are functionally fixed and verified live against the dev store. Agent context (`CLAUDE.md`, `.mcp.json`) is complete and test-covered.

**Issues found**: BUG-07's QR code library file (`assets/vendor/qrcode.js`) does not exist in the repository, so the QR code will not render for a real gift card recipient even though Theme Check and the static regex test both pass — see Fix 1.

**Next steps**: Add the missing `assets/vendor/qrcode.js` file (or repoint the asset reference) and extend `tests/static/gift-card.test.mjs` (or a new e2e spec) to assert the file is present / `window.QRCode` loads. Re-run the Verifier after the fix.
