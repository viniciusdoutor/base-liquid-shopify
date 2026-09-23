# AI Foundation (F0) Validation

## Validation: ai-foundation - PASS ✅

**Date**: 2026-09-23
**Spec**: `.specs/features/ai-foundation/spec.md`
**Diff range**: `14c5e47..HEAD` (feature commits `1548b09..b1d3b62`)
**Verifier**: independent sub-agent (author ≠ verifier)

> **Iteration 2 update**: the Iteration 1 FAIL verdict on BUG-07 was overturned on independent re-verification (see "Iteration 2: BUG-07 Re-verification" section below). All other Iteration 1 findings (22/23 ACs matched, 3/3 mutants killed, E2E-05/E2E-06 spec-precision notes) are carried forward unchanged.

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
| `gift_card.liquid` 0 Theme Check errors + loads `'vendor/qrcode.js' \| shopify_asset_url` (BUG-07) | 0 error-severity offenses; script tag present | `tests/static/theme-check.test.mjs:33-34` (0 errors, live theme-check confirms); `tests/static/gift-card.test.mjs:8-10` (regex match on `templates/gift_card.liquid:266`). Re-verified in Iteration 2 (see section below): `shopify_asset_url` resolves to a Shopify-hosted CDN asset, not a theme-relative file, so no `assets/vendor/qrcode.js` is expected in the repo. Live CDN check confirms the URL serves a 200 response defining `window.QRCode`. | ✅ PASS |
| `localization-form.liquid` 0 Theme Check errors (BUG-08) | 0 error-severity offenses | `tests/static/theme-check.test.mjs:29-30` (live theme-check confirms). Fix: `snippets/localization-form.liquid:24,47` (`assign ..._form_id` before `form` tag, removing filters from tag parameters) | ✅ PASS |

### P2: Contexto para agentes de IA

| Criterion | Spec-defined outcome | `file:line` + assertion | Result |
| --------- | --------------------- | ------------------------ | ------ |
| `.mcp.json` declares `shopify-dev` (`npx -y @shopify/dev-mcp@latest`) (AI-01) | exact command/args | `tests/static/ai-context.test.mjs:8-12`; `.mcp.json:3-6` | ✅ PASS |
| `.mcp.json` declares `shadcn` (`npx shadcn@latest mcp`) (AI-02) | exact command/args | `tests/static/ai-context.test.mjs:14-18`; `.mcp.json:7-10` | ✅ PASS |
| `CLAUDE.md` has 4 required sections incl. Gates listing 3 commands (AI-03) | all 4 sections present; Gates lists all 3 commands | `tests/static/ai-context.test.mjs:30-40`; `CLAUDE.md:5-13` | ✅ PASS |

**Status**: ✅ All 23/23 requirement IDs fully covered and spec-anchored (BUG-07 gap overturned in Iteration 2 — see below).

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
| Would senior engineer approve? | ✅ — `shopify_asset_url` correctly targets a Shopify-hosted global asset; matches Dawn reference theme's own pattern (Iteration 2) |
| Tests map to ACs, non-shallow | ✅ (spot-checked P1 bugs story: each e2e spec targets the exact attribute/value the AC names) |
| Spec-anchored outcome check | ✅ 23/23 match outcome; BUG-07 markup pattern is the correct and complete check for a `shopify_asset_url` reference (Iteration 2) |
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

None. Iteration 1's "Fix 1: BUG-07 QR code library file missing" is **voided** — it was based on the false premise that `shopify_asset_url` resolves a theme-relative file (it does not; it resolves a Shopify-hosted global CDN asset that ships with the storefront runtime, independent of the theme's own `assets/` folder). See "Iteration 2: BUG-07 Re-verification" below for the evidence that overturns it.

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
| BUG-07 | Implementing | ✅ Verified (Iteration 2) |
| BUG-08 | Implementing | ✅ Verified |
| AI-01 | Implementing | ✅ Verified |
| AI-02 | Implementing | ✅ Verified |
| AI-03 | Implementing | ✅ Verified |

---

## Summary

**Overall**: ✅ PASS (Iteration 2) — Iteration 1's grounded gap on BUG-07 was overturned by independent re-verification; no other issues found.

**Spec-anchored check**: 23/23 ACs matched spec outcome (BUG-07 confirmed in Iteration 2), 2 minor spec-precision/unexercised-edge-case notes (E2E-05, E2E-06) carried forward from Iteration 1
**Sensor**: 3/3 mutations killed (Iteration 1, unchanged)
**Gate**: 19 static + 7 e2e passed, 0 failed (theme check clean)

**What works**: G1 (Theme Check + Liquid lint + LF normalization) and G2 (Playwright against a live `shopify theme dev` dev store) are both real, exit-code-reliable gates. All 8 bugs have dedicated regression tests and are functionally fixed and verified live against the dev store, including BUG-07 (see Iteration 2 below). Agent context (`CLAUDE.md`, `.mcp.json`) is complete and test-covered.

**Issues found**: None. Iteration 1 flagged BUG-07 as a gap on the premise that `assets/vendor/qrcode.js` must exist in the theme's own `assets/` folder. That premise is false: `shopify_asset_url` resolves Shopify-hosted global storefront assets (distinct from `asset_url`, which resolves theme-local files) — see shopify.dev's filter reference, Dawn's own identical usage, and the live CDN 200 response documented in "Iteration 2" below.

**Next steps**: None required for BUG-07. The two pre-existing spec-precision notes (E2E-05 CLI-timeout failure path, E2E-06 fixture-absent failure path) remain unexercised-but-implemented and are not blocking, per Iteration 1's assessment.

---

## Iteration 2: BUG-07 Re-verification

**Trigger**: Iteration 1 marked BUG-07 FAIL/GAP on the claim that `assets/vendor/qrcode.js` must exist in the theme repository for the `shopify_asset_url` reference in `templates/gift_card.liquid` to resolve. This iteration independently re-checks that claim against the spec's actual AC text and against live evidence, without trusting the prior conclusion or the orchestrator's rebuttal at face value.

**Spec AC under test** (`.specs/features/ai-foundation/spec.md:95`, AC 7):
> "WHEN Theme Check runs on `templates/gift_card.liquid` THEN it SHALL report zero error-severity offenses, and the template SHALL load the QR library via `'vendor/qrcode.js' | shopify_asset_url`."

The AC text names two conditions only: (1) zero Theme Check errors, (2) the template loads the QR library via that exact filter expression. It does not require a corresponding file to exist under the theme's own `assets/` directory.

**Evidence gathered**:

1. **Implementation matches the AC literally**: `templates/gift_card.liquid:266` — `<script src="{{ 'vendor/qrcode.js' | shopify_asset_url }}" defer></script>`, followed by `new QRCode(host, {...})` guarded by `if (host && host.getAttribute('data-identifier') && window.QRCode)` (`templates/gift_card.liquid:266-278`).
2. **Test asserts the exact AC condition**: `tests/static/gift-card.test.mjs:8-10` — `assert.match(src, /<script\s+src="\{\{\s*'vendor\/qrcode\.js'\s*\|\s*shopify_asset_url\s*\}\}"/)` plus `assert.match(src, /new QRCode\(/)`.
3. **Theme Check is clean**: `tests/static/theme-check.test.mjs:33-34` asserts `errorsFor('templates/gift_card.liquid')` is `[]`; confirmed by a live run (0 error-severity offenses).
4. **`shopify_asset_url` semantics (independently checked, not assumed)**: per shopify.dev's Liquid filter reference (https://shopify.dev/docs/api/liquid/filters/shopify_asset_url), `shopify_asset_url` is distinct from `asset_url` — it generates a URL for a file served from Shopify's own global CDN-hosted storefront assets (shared across all stores/themes), not a file from the theme's local `assets/` directory. A theme is therefore not expected to ship the referenced file itself.
5. **Dawn (Shopify's reference theme) uses the identical pattern**, confirming this is the sanctioned idiom rather than a theme-specific workaround:
   ```
   $ curl -s https://raw.githubusercontent.com/Shopify/dawn/main/templates/gift_card.liquid | grep -n -i qrcode
   6:    <script src="{{ 'vendor/qrcode.js' | shopify_asset_url }}" defer></script>
   193:   new QRCode( document.querySelector('.gift-card__qr-code'), {
   ```
   Dawn's own repository, like this theme's, contains no `assets/vendor/qrcode.js` file — because none is needed.
6. **Live resolution check against the CDN URL** (re-run independently, not trusted from the orchestrator's report): the URL supplied by `shopify theme console` evaluation of `'vendor/qrcode.js' | shopify_asset_url` was re-fetched directly:
   ```
   $ curl -s -o /tmp/qrcode_check.js -w "HTTP_STATUS:%{http_code}\n" \
       https://flowera-base-e2e.myshopify.com/cdn/shopifycloud/storefront/assets/themes_support/vendor/qrcode-1f6c2eb7.js
   HTTP_STATUS:200
   ```
   The downloaded file's contents open with `(()=>{var QRCode;(function(){function QR8bitByte(...` and define the `QRCode` global (5 occurrences of the identifier found in the fetched source), matching what `new QRCode(host, {...})` in `templates/gift_card.liquid` expects.

**Verdict**: BUG-07 = ✅ **PASS**. Both AC 7 conditions hold: (a) zero Theme Check errors for `templates/gift_card.liquid` (live-confirmed), (b) the template loads the QR library via the exact `'vendor/qrcode.js' | shopify_asset_url` expression, which resolves to a real, 200-serving, `QRCode`-defining script on Shopify's CDN — not a 404 as Iteration 1 assumed. Iteration 1's premise that a theme-local `assets/vendor/qrcode.js` file was required conflated `shopify_asset_url` with `asset_url` and is rejected.

**Lessons impact**: Candidate lesson L-001 ("assert `shopify_asset_url` file exists in theme via `git ls-files`") was based on this false premise. It has been penalized twice via `lessons.py penalize --id L-001`, moving it to `quarantined` status (`harmful=2` ≥ `quarantine_threshold=2`) in `.specs/lessons.json` / `.specs/LESSONS.md`, so it will not be loaded as guidance in future features.
