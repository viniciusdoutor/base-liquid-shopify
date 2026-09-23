# Design Tokens Validation

**Date**: 2026-09-23
**Spec**: `.specs/features/design-tokens/spec.md`
**Diff range**: `8980024..HEAD` (excludes `docs/` and `.claude/`)
**Verifier**: independent sub-agent (author ≠ verifier)

---

## Task Completion

All 25 requirement IDs in the spec's Requirement Traceability table are marked `Verified`. Re-derived independently below; IMP-01..09 (import) are cancelled by AD-003 and out of scope, as instructed.

| Task/Phase | Status | Notes |
| ---------- | ------ | ----- |
| Phase 1: Tailwind pipeline (TW-01..07) | ✅ Done | `assets/tailwind.css` committed, fresh |
| Phase 2: Color schemes (CS-01..08) | ✅ Done | `settings_schema.json`/`settings_data.json` |
| Phase 3: Legacy compat (LEG-01..03) | ✅ Done | `snippets/css-variables.liquid` |
| Phase 3: Radius/fonts (RAD-01..05) | ✅ Done | `src/tailwind.css`, fonts wired |
| Phase 4: Gate fix (GATE-01, T11) | ✅ Done | `tests/e2e/global-setup.ts` |
| Phase 4: Schema fix (CS-09, T12) | ✅ Done | `background_gradient` definition |

---

## Spec-Anchored Acceptance Criteria

| Requirement | Criterion (WHEN X THEN Y) | Spec-defined outcome | `file:line` + assertion | Result |
| ----------- | -------------------------- | --------------------- | ------------------------ | ------ |
| TW-01 | `npm run build:css` compiles and exits 0 | exit code 0, `assets/tailwind.css` exists | `tests/static/tailwind.test.mjs:37-41` — `assert.equal(res.status, 0)`; `assert.ok(existsSync(OUTPUT))` | ✅ PASS |
| TW-02 | `.liquid` file with `bg-primary` → rule referencing `var(--primary)` | `.bg-primary{background-color:var(--primary)}` | `tests/static/tailwind.test.mjs:43-46` — `assert.match(css, /\.bg-primary\s*\{\s*background-color:\s*var\(--primary\);?\s*\}/)`; scan proof at `tailwind.test.mjs:48-68` (`fill-primary` fixture) | ✅ PASS |
| TW-03 | safelist `{bg,text,border,ring}-{token}` all present | every combination exists as a rule | `tests/static/tailwind.test.mjs:70-81` — `assert.deepEqual(missing, [])` over the 19-token × 4-prefix matrix | ✅ PASS |
| TW-04 | no preflight box-sizing reset | `box-sizing: border-box` absent | `tests/static/tailwind.test.mjs:83-86` — `assert.doesNotMatch(css, /box-sizing:\s*border-box/)` | ✅ PASS |
| TW-05 | committed CSS matches fresh build | byte-identical | `tests/static/tailwind.test.mjs:20-35` — `assert.equal(committed, fresh)` | ✅ PASS |
| TW-06 | `theme.liquid` loads `tailwind.css` before `content_for_header` | ordered after `index.css`, before `content_for_header` | `tests/static/tailwind.test.mjs:99-111`; `layout/theme.liquid:55-56` (`asset_url \| stylesheet_tag`) | ✅ PASS |
| TW-07 | `npm run dev` runs watch:css + theme dev in parallel | `concurrently` invoking both scripts | `tests/static/tailwind.test.mjs:113-118` — regex on `pkg.scripts.dev` | ✅ PASS |
| CS-01 | `color_schemes` `definition` has the 16 shadcn ids | ids match exactly (+ `background_gradient`, AD-003/A-10) | `tests/static/settings.test.mjs:45-54` — `assert.deepEqual(ids.sort(), [...SCHEMA_IDS, GRADIENT_ID].sort())`; schema at `config/settings_schema.json:40-144` | ✅ PASS (spec amended by A-10, documented deviation) |
| CS-02 | `role` maps background.solid/text/buttons/links/icons | exact id mapping per spec | `tests/static/settings.test.mjs:65-80`; `config/settings_schema.json:145-159` | ✅ PASS |
| CS-03 | `settings_data.json` has ≥3 schemes with hex per id | scheme-1/2/3, hex `^#[0-9a-fA-F]{6}$` for 16 ids | `tests/static/settings.test.mjs:96-117` | ✅ PASS |
| CS-04 | `.color-<id>` rule sets 18 tokens per scheme | 16 direct + popover/popover-foreground aliased to card/card_foreground | `snippets/css-variables.liquid:46-82`; e2e proof `tests/e2e/tokens.spec.ts:48-83` (all 18 assertions against `scheme2`) | ✅ PASS |
| CS-05 | `:root` `--background` = scheme-1's background | exact hex match | `tests/e2e/tokens.spec.ts:42-46` — `expect(bg).toBe(scheme1.background.toLowerCase())` | ✅ PASS |
| CS-06 | section with `color-scheme-2` computes scheme-2's `--background` | exact match, not scheme-1's | `tests/e2e/tokens.spec.ts:48-83` (`CS-04/CS-06`, all tokens incl. `--background`); rendered proof `tests/e2e/section-color-scheme.spec.ts:5-16` (footer wrapper class + `.color-scheme-2` rule present) | ✅ PASS |
| CS-07 | `image-banner`, `rich-text`, `footer` expose `color_scheme` (default `scheme-1`) applied as class | `type: color_scheme`, `default: scheme-1`, class `color-{{ ... }}` | `tests/static/section-color-scheme.test.mjs:8-26`; sections `sections/footer.liquid`, `sections/image-banner.liquid`, `sections/rich-text.liquid` | ✅ PASS |
| CS-08 | old settings removed, `color_sale` remains | 7 listed ids absent from schema+data, `color_sale` present | `tests/static/settings.test.mjs:82-90` (schema), `:119-127` (data) | ✅ PASS |
| CS-09 (SPEC_DEVIATION) | `background_gradient` is a `color_background` definition referenced by `role.background.gradient` | `type: color_background`, `role.background.gradient === "background_gradient"` | `tests/static/settings.test.mjs:56-63`; `config/settings_schema.json:49-53,145-149` | ✅ PASS |
| LEG-01 | legacy vars resolve to mapped shadcn tokens | 12 exact hex-via-`var()` mappings | `tests/e2e/tokens.spec.ts:85-105` (all 12 pairs, `--color-*` and `--cor-*`) | ✅ PASS |
| LEG-02 | legacy var inside `.color-scheme-2` resolves to scheme-2's value, not scheme-1's | exact scheme-2 hex, explicit not-scheme-1 check | `tests/e2e/tokens.spec.ts:107-112` — `expect(resolved).toBe(hexToRgb(scheme2.foreground))` + `.not.toBe(...scheme1...)` | ✅ PASS |
| LEG-03 | `npm run check` exits 0 | exit code 0 | `tests/static/check.test.mjs:18-23` (shared with FND-04; same command/assertion the AC requires) | ✅ PASS |
| RAD-01 | `radius` range setting 0-24px step 1 default 10 | exact bounds | `tests/static/settings.test.mjs:129-139` | ✅ PASS |
| RAD-02 | `--radius-sm/md/lg/xl` derived via shadcn formulas | `calc(var(--radius) ± 2px/4px)`, `var(--radius)` for `lg` | `tests/static/tailwind.test.mjs:88-97` | ✅ PASS |
| RAD-03 | `.font-sans` starts with `settings.type_body_font` | first font family matches `--font-body-family` | `tests/e2e/fonts.spec.ts:23-27` | ✅ PASS |
| RAD-04 | `.font-heading` starts with `settings.type_header_font` | first font family matches `--font-heading-family` | `tests/e2e/fonts.spec.ts:29-33` | ✅ PASS |
| RAD-05 | `--radius: 0` → square corners | `border-radius` computes to `0px` | `tests/e2e/tokens.spec.ts:114-128` — `expect(borderRadius).toBe('0px')` | ✅ PASS |
| GATE-01 | G2 fails when `shopify theme dev` cannot upload a theme file | run aborts with an explicit error before tests execute | `tests/e2e/global-setup.ts:28-50` (polls for "Failed to Upload Theme Files", throws); live-fired during sensor mutation 3 below | ✅ PASS |

**Status**: ✅ All 25 ACs covered with `file:line` evidence. No spec-precision gaps found — every criterion in this spec states a precise, checkable outcome (exact hex/id/formula/exit code), and every test asserts that exact value rather than mere presence of an assertion.

---

## Discrimination Sensor

Isolated `git worktree` at `/tmp/claude-1000/.../scratchpad/verify-wt` (detached at `HEAD`=`c0b8c6d`), `node_modules` symlinked, `.env` copied (never printed) and removed before teardown. e2e mutations used port 9393 (edited only in the worktree's `playwright.config.ts`/`tests/e2e/global-setup.ts` copies); the user's port-9494 preview was never touched (confirmed via `ps`/`ss` before and after). Pre-sensor baseline `git status --porcelain` on the real tree: `?? .claude/worktrees/` (pre-existing, unrelated to this run).

| # | File:line | Description | Tests run | Killed? |
| - | --------- | ------------ | --------- | ------- |
| 1 | `snippets/css-variables.liquid:70` | Deleted `--color-text: var(--foreground);` from inside the per-scheme `.color-<id>` loop (targets LEG-02's "redeclare inside every scheme block" contract) | `npx playwright test tests/e2e/tokens.spec.ts` (port 9393) | ✅ Killed — LEG-01 failed (`--color-text should resolve to #0a0a0a`, got `rgba(0,0,0,0)`) and LEG-02 failed (expected scheme-2 fg `rgb(250,250,250)`, got `rgba(0,0,0,0)`) |
| 2 | `src/tailwind.css:46` | Removed `sale` from the `@source inline(...)` safelist string (targets TW-05 freshness / TW-03 safelist) | `node --test tests/static/tailwind.test.mjs` | ✅ Killed — TW-05 failed first (fresh build ≠ committed `assets/tailwind.css`, diff omits `.bg-sale`/`.text-sale`/`.border-sale`/`.ring-sale`/`.ring-sale` and 4 `@property` blocks tied to ring vars); after `npm run build:css` (TW-01) overwrote the worktree's committed copy, TW-03 also failed (`missing safelist classes: bg-sale, text-sale, border-sale, ring-sale`) |
| 3 | `config/settings_schema.json:50` | Changed `background_gradient` definition `"type": "color_background"` → `"type": "color"` (targets CS-09/GATE-01) | `node --test tests/static/settings.test.mjs`; `npx playwright test tests/e2e/smoke.spec.ts` (port 9393, live `shopify theme dev` against the real dev store) | ✅ Killed — CS-09 failed statically (`equal(gradientDef.type, 'color_background')`); live run's `globalSetup` threw `shopify theme dev could not upload one or more theme files (G2 gate). Section 3: setting with id="color_schemes" role: background.gradient precisa referenciar uma definição do tipo color_background` |

**Sensor depth**: lightweight (3 targeted mutations across 3 different files/areas: legacy-alias scoping, Tailwind safelist freshness, and the settings-schema upload gate).
**Result**: 3/3 killed — PASS ✅

Worktree removed with `git worktree remove --force`; real tree `git status --porcelain` re-checked after teardown and matches the pre-sensor baseline exactly (only the pre-existing, unrelated `?? .claude/worktrees/` entry from a concurrent agent).

---

## Code Quality

| Principle | Status |
| --------- | ------ |
| Minimum code | ✅ — pipeline + tokens + compat layer, no extra abstractions |
| Surgical changes | ✅ — diff scoped to tokens/settings/tests/build files |
| No scope creep | ✅ — IMP-* import feature correctly dropped per AD-003, not implemented |
| Matches patterns | ✅ — Liquid/JSON conventions consistent with rest of theme |
| Spec-anchored outcome check (asserted values match spec) | ✅ |
| Per-layer Coverage Expectation met (domain 1:1 ACs; e2e happy+edge) | ✅ — RAD-05 edge case (radius 0) explicitly covered |
| Every test maps to a spec requirement — no unclaimed tests | ✅ — every new/modified test file carries a requirement-ID header comment |
| Documented guidelines followed | `.specs/features/design-tokens/spec.md` A-10 (SPEC_DEVIATION), AD-003 in `.specs/STATE.md` |

---

## Edge Cases

- [x] `settings.radius = 0` → `--radius-sm` etc. clamp and `rounded-lg` renders square corners: `tests/e2e/tokens.spec.ts:114-128` (RAD-05), ✅ PASS.

---

## Gate Check

- **Gate command**: `npm run check && npm run lint:liquid && npm run test:static` (+ `npm run test:e2e`) — Build-level gate from `tasks.md`
- **Result**: `npm run test:static` → 37 passed, 0 failed. `npm run test:e2e` → 15 passed, 0 failed (both run on the real tree, read-only, before any sensor work).
- **Test count before feature** (`8980024`, verified via temporary worktree): 19 static tests (8 files), 7 e2e tests (6 spec files)
- **Test count after feature**: 37 static tests (11 files), 15 e2e tests (9 spec files + `global-setup.ts`)
- **Delta**: +18 static, +8 e2e — all additions, 0 deletions
- **Skipped tests**: none
- **Failures**: none

---

## Fix Plans

None — no gaps or surviving mutants.

---

## Requirement Traceability Update

All 25 IDs confirmed `Verified` (no change from spec.md's existing traceability table, which was already marked Verified by the author — this Verifier independently re-derived the same conclusion with fresh evidence).

| Requirement | Previous Status | New Status |
| ----------- | ---------------- | ----------- |
| TW-01..07, CS-01..09, LEG-01..03, RAD-01..05, GATE-01 | Verified | ✅ Verified (re-confirmed) |

---

## Summary

**Overall**: ✅ Ready

**Spec-anchored check**: 25/25 ACs matched spec outcome, 0 spec-precision gaps
**Sensor**: 3/3 mutations killed
**Gate**: 37 static + 15 e2e passed, 0 failed

**What works**: Full Tailwind v4 pipeline with shadcn token safelist and freshness gate; `color_scheme_group` with 16 shadcn ids + the AD-003-required `background_gradient` gradient definition; per-scheme `.color-<id>` CSS with 18 tokens and legacy alias re-scoping; radius/font tokens wired to theme settings; G2 gate now fails loudly on a broken theme upload instead of silently serving stale content.

**Issues found**: none.

**Next steps**: none — feature is done. IMP-01..09 remain correctly out of scope per AD-003.
