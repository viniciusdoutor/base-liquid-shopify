# Design Tokens (F1) Design

Conforms to AD-001 (Tailwind v4 + shadcn token names) and AD-002 (G1/G2 gates). No new project-level decision.

## Architecture

```
config/settings_schema.json ── color_scheme_group "color_schemes" (16 ids) + range "radius"
config/settings_data.json   ── scheme-1 (light) / scheme-2 (dark) / scheme-3 (inverse)
            │
            ▼  (Liquid, runtime, per request)
snippets/css-variables.liquid
  :root, .color-scheme-1 { --background:#fff; ... + legacy aliases }
  .color-scheme-2 { ...same 18 tokens + legacy aliases... }
  :root { --radius: {{settings.radius}}px; --sale; --font-body-family; --font-heading-family }
            │
            ▼  (build time, npm run build:css)
src/tailwind.css ── @import theme+utilities (no preflight) · @source ../{layout,sections,snippets,blocks,templates}
                    @source inline(safelist) · @theme inline { --color-primary: var(--primary) ... }
            │
            ▼
assets/tailwind.css (committed)  ── loaded in layout/theme.liquid before content_for_header
```

## Key decisions (feature-local)

| Decision | Choice | Why |
| -------- | ------ | --- |
| Theme vars mode | `@theme inline` | Utilities emit `var(--primary)` directly, so a nested `.color-scheme-2` re-scopes them. Non-inline would bind to the `:root` value. |
| Legacy aliases location | Re-declared inside every `.color-<id>` rule (not only `:root`) | A custom property holding `var(--x)` is computed where declared and inherited as a value; declaring aliases only on `:root` would freeze them to scheme-1 (LEG-02). |
| Popover | `--popover: var(--card)` style copy of card values | A-05 |
| Dev runner | `concurrently` devDependency | Cross-platform, one line in `package.json` |
| Tailwind CLI | `@tailwindcss/cli` + `tailwindcss` 4.x devDependencies | Standalone CLI, no JS config (AD-001) |
| Color conversion | `culori` (`formatHex` after `toGamut('rgb')`) | A-08, gamut clamp edge case |
| Radius scale | `--radius-sm: calc(var(--radius) - 4px)`, `md: -2px`, `lg: var(--radius)`, `xl: +4px` in `@theme inline` | shadcn v4 default formula |
| Fonts | `@theme inline { --font-sans: var(--font-body-family); --font-heading: var(--font-heading-family); }` | Values come from `font_picker` via css-variables |

## Components / files

| File | Change |
| ---- | ------ |
| `package.json` | devDeps `tailwindcss`, `@tailwindcss/cli`, `concurrently`, `culori`; scripts `build:css`, `watch:css`, `dev`, `import:theme` |
| `src/tailwind.css` | new – Tailwind entry |
| `assets/tailwind.css` | new – compiled output, committed |
| `layout/theme.liquid` | add `{{ 'tailwind.css' \| asset_url \| stylesheet_tag }}` after `index.css`, before `content_for_header` |
| `config/settings_schema.json` | replace 7 color settings by `color_scheme_group`; add `radius`; keep `color_sale` |
| `config/settings_data.json` | 3 schemes, remove old color keys (current + presets) |
| `locales/en.default.schema.json` | labels for the 16 scheme fields, radius, section `color_scheme` |
| `snippets/css-variables.liquid` | scheme loop + legacy aliases + radius/sale/fonts |
| `sections/image-banner.liquid`, `rich-text.liquid`, `footer.liquid` | `color_scheme` setting + `color-{{ section.settings.color_scheme }}` class on wrapper |
| `scripts/import-theme.mjs` | new – CSS → `current.color_schemes` |
| `tests/static/*.test.mjs`, `tests/e2e/tokens.spec.ts`, `tests/fixtures/shadcn-neutral.css` | new tests |

## Default schemes (hex, from shadcn neutral)

| id | scheme-1 light | scheme-2 dark | scheme-3 inverse |
| -- | -- | -- | -- |
| background | #ffffff | #0a0a0a | #171717 |
| foreground | #0a0a0a | #fafafa | #fafafa |
| card / card_foreground | #ffffff / #0a0a0a | #171717 / #fafafa | #262626 / #fafafa |
| primary / primary_foreground | #171717 / #fafafa | #e5e5e5 / #171717 | #fafafa / #171717 |
| secondary / secondary_foreground | #f5f5f5 / #171717 | #262626 / #fafafa | #262626 / #fafafa |
| muted / muted_foreground | #f5f5f5 / #737373 | #262626 / #a1a1a1 | #262626 / #a1a1a1 |
| accent / accent_foreground | #f5f5f5 / #171717 | #262626 / #fafafa | #262626 / #fafafa |
| destructive | #e7000b | #ff6467 | #ff6467 |
| border / input / ring | #e5e5e5 / #e5e5e5 / #a1a1a1 | #333333 / #404040 / #737373 | #404040 / #404040 / #737373 |

## Test strategy

- G1 static (`node:test`): schema/data shape, layout tag order, package scripts, CSS build output (fresh build compared to committed file), import script with fixtures (exact hex, errors, key isolation).
- G2 e2e (Playwright on dev store): computed custom properties on `:root` and on an injected `.color-scheme-2` wrapper (tokens + legacy aliases), `rounded-lg`/`font-sans`/`font-heading` computed styles on injected probes, section class from setting via rendered footer markup.
