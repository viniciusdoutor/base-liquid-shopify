# Design Tokens (F1) Specification

## Problem Statement

O tema expõe 8 cores soltas (`color_background`, `color_accent`...) com nomes próprios, sem pares fundo/texto por contexto e sem Tailwind. Isso impede portar componentes shadcn/ui quase 1:1 (AD-001): as classes `bg-primary`, `text-muted-foreground`, `rounded-lg` não existem no tema. F1 cria o contrato de tokens shadcn gerado a partir de `color_scheme_group` do Shopify e o pipeline Tailwind v4, sem quebrar as 99 referências legadas `var(--color-*)`/`var(--cor-*)` nas seções atuais.

## Goals

- [ ] Classes utilitárias shadcn (`bg-primary`, `text-primary-foreground`, `border-border`, `rounded-lg`...) funcionam em qualquer arquivo `.liquid` do tema
- [ ] O lojista escolhe esquemas de cor no editor, e qualquer seção com o setting `color_scheme` redefine os tokens localmente
- [ ] Um tema exportado do tweakcn/shadcn (CSS com `:root` e `.dark`) vira esquemas de cor do tema com um comando
- [ ] Zero regressão visual nas seções existentes (variáveis legadas continuam resolvendo)

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Reescrever seções/snippets existentes com classes Tailwind | F2 `ui-primitives` |
| Tailwind preflight (reset) | Conflita com `normalizar.css`; entra quando F2 substituir o CSS legado |
| Dark mode automático (`prefers-color-scheme`) | Em loja, esquema por seção substitui dark global (pesquisa shadcn, AD-001) |
| Tokens `chart-*` e `sidebar-*` do shadcn | Sem uso em storefront |
| Registry `@flowera` | F3 |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| A-01 Onde fica o CSS fonte do Tailwind | `src/tailwind.css` (fora das pastas do tema); saída compilada `assets/tailwind.css` commitada | Shopify não roda build; o CLI só sincroniza pastas do tema | n (default do agente) |
| A-02 Camadas Tailwind importadas | Só `theme` e `utilities` (sem `preflight`) | Evita regressão contra `normalizar.css`/`base.css` | n (default do agente) |
| A-03 Prefixo de classes | Sem prefixo | Compatibilidade 1:1 com `className` do shadcn é o objetivo do AD-001 | n (default do agente) |
| A-04 Formato das cores nos esquemas | Hex (`#rrggbb`), convertido de OKLCH na importação | O setting `color` do Shopify armazena hex | n (default do agente) |
| A-05 `popover` do shadcn | `--popover`/`--popover-foreground` apontam para `card`/`card_foreground` | Menos campos no editor; storefront raramente diferencia | n (default do agente) |
| A-06 Cor de promoção | Setting global `color_sale` mantido, exposto como `--sale` e utilitário `bg-sale`/`text-sale` | shadcn não tem token de promoção; e-commerce precisa | n (default do agente) |
| A-07 Classes safelist | `@source inline(...)` com todas as combinações `{bg,text,border,ring,outline,fill,stroke}-{token}` | Permite usar tokens em Custom Liquid e em classes montadas por settings | n (default do agente) |
| A-08 Biblioteca de conversão de cor no import | `culori` (devDependency) | Conversão OKLCH/HSL → sRGB hex correta com gamut clamp | n (default do agente) |
| A-09 Formato do tweakcn | Qualquer CSS com blocos `:root { --token: valor; }` e opcional `.dark { ... }` | Formato exato do tweakcn não foi verificado na pesquisa; esse é o formato documentado do shadcn | n (default do agente) |

**Open questions:** none - all resolved or logged above as agent defaults (assumptions marked "n" can be revised by the user).

---

## User Stories

### P1: Pipeline Tailwind v4 com tokens shadcn ⭐ MVP

**User Story**: Como dev portando um componente shadcn, quero escrever `class="bg-primary text-primary-foreground rounded-lg"` num `.liquid` e ver o estilo aplicado.

**Why P1**: É a base de toda compatibilidade shadcn → Liquid.

**Acceptance Criteria**:

1. WHEN `npm run build:css` is run THEN the system SHALL compile `src/tailwind.css` into `assets/tailwind.css` and exit with code 0.
2. WHEN a `.liquid` file under `layout/`, `sections/`, `snippets/`, `blocks/` or `templates/` contains the class `bg-primary` THEN `assets/tailwind.css` SHALL contain a `.bg-primary` rule whose value references `var(--primary)`.
3. The file `assets/tailwind.css` SHALL contain rules for every class produced by the safelist pattern `{bg,text,border,ring}-{background,foreground,card,card-foreground,popover,popover-foreground,primary,primary-foreground,secondary,secondary-foreground,muted,muted-foreground,accent,accent-foreground,destructive,border,input,ring,sale}`.
4. The file `assets/tailwind.css` SHALL NOT contain Tailwind preflight rules (no `*, ::after, ::before` box-sizing reset block emitted by Tailwind).
5. IF `npm run build:css` is run and the committed `assets/tailwind.css` differs from the fresh build THEN the static test `tailwind-fresh` SHALL fail.
6. WHEN any storefront page renders THEN `layout/theme.liquid` SHALL load `tailwind.css` via `asset_url | stylesheet_tag` before `{{ content_for_header }}`.
7. WHEN `npm run dev` is run THEN the system SHALL start `tailwindcss --watch` and `shopify theme dev` in parallel.

**Independent Test**: Adicionar `bg-primary` a um snippet, rodar `npm run build:css`, abrir a loja e ver o fundo com a cor primária.

---

### P1: Esquemas de cor com nomes shadcn ⭐ MVP

**User Story**: Como lojista, quero escolher um esquema de cor por seção no editor, para ter seções claras, escuras e de destaque sem editar código.

**Why P1**: Substitui as cores soltas e é o que torna tokens shadcn editáveis no Shopify.

**Acceptance Criteria**:

1. The `config/settings_schema.json` SHALL define one `color_scheme_group` setting with id `color_schemes` whose `definition` contains color settings with ids `background`, `foreground`, `card`, `card_foreground`, `primary`, `primary_foreground`, `secondary`, `secondary_foreground`, `muted`, `muted_foreground`, `accent`, `accent_foreground`, `destructive`, `border`, `input`, `ring`.
2. The `color_scheme_group` `role` SHALL map `background.solid`→`background`, `text`→`foreground`, `primary_button`→`primary`, `on_primary_button`→`primary_foreground`, `secondary_button`→`secondary`, `on_secondary_button`→`secondary_foreground`, `primary_button_border`→`primary`, `secondary_button_border`→`border`, `links`→`primary`, `icons`→`foreground`.
3. The `config/settings_data.json` SHALL define at least 3 schemes (`scheme-1` light, `scheme-2` dark, `scheme-3` inverse) with a hex value for each of the 16 definition ids.
4. WHEN any page renders THEN `snippets/css-variables.liquid` SHALL output, for each scheme, a `.color-<scheme id>` rule setting the 16 tokens as `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover` (= card), `--popover-foreground` (= card_foreground), `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--border`, `--input`, `--ring`.
5. WHEN any page renders THEN the computed value of `--background` on `:root` SHALL equal the `background` color of `scheme-1`.
6. WHERE a section has a `color_scheme` setting set to `scheme-2` THEN that section's wrapper SHALL have class `color-scheme-2` and its computed `--background` SHALL equal `scheme-2`'s `background`.
7. The sections `image-banner`, `rich-text` and `footer` SHALL each expose a `color_scheme` setting (type `color_scheme`, default `scheme-1`) applied as a class on the section wrapper.
8. The old settings `color_background`, `color_text`, `color_background_contrast`, `color_text_contrast`, `color_accent`, `color_accent_text` and `color_border` SHALL be removed from `settings_schema.json` and `settings_data.json`; `color_sale` SHALL remain.

**Independent Test**: No editor, trocar o esquema do footer para `scheme-2` e ver o rodapé escuro; `:root` continua claro.

---

### P1: Compatibilidade com CSS legado ⭐ MVP

**User Story**: Como lojista, quero que a loja continue igual depois da troca de tokens, para não haver regressão.

**Why P1**: 99 referências `var(--color-*)`/`var(--cor-*)` nas seções atuais.

**Acceptance Criteria**:

1. WHEN any page renders THEN the legacy variables SHALL resolve as: `--color-background`→`var(--background)`, `--color-text`→`var(--foreground)`, `--color-background-contrast`→`var(--muted)`, `--color-text-contrast`→`var(--foreground)`, `--color-accent`→`var(--primary)`, `--color-accent-text`→`var(--primary-foreground)`, `--color-border`→`var(--border)`, `--color-sale`→`var(--sale)`, `--cor-marca`→`var(--primary)`, `--cor-verde`→`var(--sale)`, `--cor-gelo`→`var(--muted)`, `--cor-cinza`→`var(--border)`.
2. WHEN a section wrapper has class `color-scheme-2` THEN a legacy variable used inside it (e.g. `--color-text`) SHALL compute to `scheme-2`'s value, not `scheme-1`'s.
3. WHEN `npm run check` is run THEN the system SHALL exit with code 0.

**Independent Test**: Home, produto e coleção renderizam sem variáveis CSS indefinidas; com `color-scheme-2` num wrapper, o texto legado muda de cor junto.

---

### P1: Radius e fontes como tokens ⭐ MVP

**User Story**: Como dev, quero `rounded-sm/md/lg/xl` e `font-sans`/`font-heading` ligados às settings do tema.

**Why P1**: Radius e tipografia fazem parte do contrato shadcn.

**Acceptance Criteria**:

1. The `settings_schema.json` SHALL define a `range` setting `radius` (0–24 px, step 1, default 10).
2. WHEN any page renders THEN `--radius` SHALL equal `settings.radius` in px, and `assets/tailwind.css` SHALL define `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` derived from `var(--radius)` as `calc(var(--radius) - 4px)`, `calc(var(--radius) - 2px)`, `var(--radius)`, `calc(var(--radius) + 4px)`.
3. WHEN an element has class `font-sans` THEN its computed `font-family` SHALL start with the family of `settings.type_body_font`.
4. WHEN an element has class `font-heading` THEN its computed `font-family` SHALL start with the family of `settings.type_header_font`.

**Independent Test**: Mudar `radius` para 0 no editor e ver `rounded-lg` ficar reto.

---

### P2: Importar tema do shadcn/tweakcn

**User Story**: Como dev, quero colar o CSS de um tema shadcn (tweakcn, ui.shadcn.com/themes) e gerar os esquemas de cor do tema, para começar uma loja com a mesma identidade do projeto React.

**Why P2**: Acelera ports, mas o tema funciona sem isso.

**Acceptance Criteria**:

1. WHEN `npm run import:theme -- <file.css>` is run with a CSS containing `:root { ... }` THEN the system SHALL write `scheme-1` in `config/settings_data.json` (`current.color_schemes`) with the 16 tokens converted to hex.
2. WHEN the input CSS also contains `.dark { ... }` THEN the system SHALL write `scheme-2` from it.
3. WHEN the input value is `oklch(0.145 0 0)` THEN the stored hex SHALL be `#0a0a0a`; `oklch(1 0 0)` SHALL be `#ffffff`; `oklch(0.205 0 0)` SHALL be `#171717`.
4. WHEN the input contains `--popover` and `--card` THEN the system SHALL use `--card` for the `card` scheme field and ignore `--popover`.
5. IF the input CSS has no `:root` block THEN the system SHALL exit with code 1 and print `Nenhum bloco :root encontrado`.
6. IF a required token (any of the 16) is missing in `:root` THEN the system SHALL exit with code 1 and print `Token ausente: --<nome>`.
7. The script SHALL NOT modify any key of `settings_data.json` other than `current.color_schemes`.

**Independent Test**: `npm run import:theme -- tests/fixtures/shadcn-neutral.css` e conferir `scheme-1.background == #ffffff`, `scheme-1.foreground == #0a0a0a`.

---

## Edge Cases

- IF a color in the input CSS is out of sRGB gamut THEN the import SHALL clamp it to the nearest sRGB color instead of failing.
- IF a value uses `hsl(...)`, `#hex` or `rgb(...)` instead of `oklch(...)` THEN the import SHALL convert it the same way.
- WHEN `settings.radius` is 0 THEN `--radius-sm` SHALL compute to `0px` or less and rendered corners SHALL be square (`calc` negatives clamp to 0 in `border-radius`).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| TW-01 | P1: Pipeline - build:css compila | Tasks | Verified |
| TW-02 | P1: Pipeline - classe em .liquid gera regra | Tasks | Verified |
| TW-03 | P1: Pipeline - safelist de tokens | Tasks | Verified |
| TW-04 | P1: Pipeline - sem preflight | Tasks | Verified |
| TW-05 | P1: Pipeline - CSS commitado atualizado | Tasks | Verified |
| TW-06 | P1: Pipeline - layout carrega tailwind.css | Tasks | Verified |
| TW-07 | P1: Pipeline - npm run dev paralelo | Tasks | Verified |
| CS-01 | P1: Esquemas - definition 16 ids | Tasks | Verified |
| CS-02 | P1: Esquemas - roles | Tasks | Verified |
| CS-03 | P1: Esquemas - 3 esquemas em settings_data | Tasks | Verified |
| CS-04 | P1: Esquemas - classes .color-<id> | Tasks | Verified |
| CS-05 | P1: Esquemas - :root = scheme-1 | Tasks | Verified |
| CS-06 | P1: Esquemas - seção com scheme-2 | Tasks | Verified |
| CS-07 | P1: Esquemas - setting em 3 seções | Tasks | Verified |
| CS-08 | P1: Esquemas - settings antigos removidos | Tasks | Verified |
| LEG-01 | P1: Legado - mapeamento de variáveis | Tasks | Verified |
| LEG-02 | P1: Legado - herda esquema local | Tasks | Verified |
| LEG-03 | P1: Legado - theme check verde | Tasks | Verified |
| RAD-01 | P1: Radius - setting | Tasks | Verified |
| RAD-02 | P1: Radius - escala derivada | Tasks | Verified |
| RAD-03 | P1: Fontes - font-sans | Tasks | Verified |
| RAD-04 | P1: Fontes - font-heading | Tasks | Verified |
| IMP-01 | P2: Import - :root → scheme-1 | Design | Pending |
| IMP-02 | P2: Import - .dark → scheme-2 | Design | Pending |
| IMP-03 | P2: Import - conversão OKLCH exata | Design | Pending |
| IMP-04 | P2: Import - card vence popover | Design | Pending |
| IMP-05 | P2: Import - erro sem :root | Design | Pending |
| IMP-06 | P2: Import - erro token ausente | Design | Pending |
| IMP-07 | P2: Import - não toca outras chaves | Design | Pending |
| IMP-08 | Edge: gamut clamp | Design | Pending |
| IMP-09 | Edge: hsl/rgb/hex aceitos | Design | Pending |
| RAD-05 | Edge: radius 0 | Tasks | Verified |

**Coverage:** 32 total, 23 mapped to tasks (T1-T8), 9 unmapped (IMP-01..09, P2 import script — Phase 3/T9-T10 cancelled by orchestrator decision, out of this batch's scope)

---

## Success Criteria

- [ ] Um componente shadcn copiado (ex.: `Button` default) renderiza no Liquid só trocando `className` por `class`
- [ ] Home, produto e coleção passam no G2 sem mudança visual nas seções legadas (variáveis legadas resolvem)
- [ ] Importar o tema neutral do shadcn produz exatamente os hex de referência (#ffffff, #0a0a0a, #171717)
