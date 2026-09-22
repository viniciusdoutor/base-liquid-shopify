# AI Foundation (F0) Specification

## Problem Statement

O tema base não tem nenhum gate automatizado além de rodar `shopify theme check` manualmente, não tem contexto para agentes de IA (CLAUDE.md, MCPs) e o working tree está poluído por conversão CRLF em 64 arquivos. Sem gates executáveis, a `tlc-spec-driven` não consegue fechar nenhuma tarefa das features seguintes (F1–F6). Além disso, existem 5 bugs confirmados (preço "a partir de", LCP lazy, strings JS não escapadas, URL de carrinho fixa, escala tipográfica não-fluida) que servem de piloto para o harness de testes.

## Goals

- [ ] Gates G1 (estático) e G2 (Playwright contra `shopify theme dev`) executáveis com um comando cada e com exit code confiável
- [ ] Agentes de IA carregam contexto do projeto (CLAUDE.md + `.mcp.json` com Shopify Dev MCP e shadcn MCP) sem configuração manual
- [ ] Os 5 bugs corrigidos, cada um coberto por um teste que falha antes da correção

## Out of Scope

| Feature | Reason |
| ------- | ------ |
| Instalação do Tailwind v4 e contrato de tokens shadcn | Feature F1 `design-tokens` (AD-001) |
| Gates G3 (visual) e G4 (Lighthouse CI) | Só fazem sentido quando houver UI nova (F2+) |
| GitHub Actions / CI remoto | Exige segredos no GitHub; entra depois do G2 estável localmente |
| Reformatar o código com Prettier (`printWidth`) | Gera diff massivo sem valor funcional; adiado para quando os arquivos forem reescritos |
| Locale `pt-BR` | Pertence à reescrita das seções (F2+) |
| Skills/agentes `.claude/` (liquid-ui, porter, verifier) | Dependem dos primitivos e do registry (F2, F3, F5) |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
| --------------------- | -------------- | --------- | ---------- |
| A-01 Dev store usada pelo G2 | Agente cria uma dev store com `shopify store create dev --demo-data` e grava o domínio em `SHOPIFY_STORE` no `.env` | Nenhuma loja foi encontrada na máquina; o Shopify CLI 4.8 cria dev stores com dados demo que servem de fixtures | n (default do agente) |
| A-02 Autenticação do `theme dev` | Sessão do `shopify auth login --alias flowera` (login feito pelo usuário via device code em 2026-09-22); `SHOPIFY_CLI_THEME_TOKEN` opcional para CI | Login por device code é o único passo que exige humano | n (default do agente) |
| A-03 Shopify CLI | `@shopify/cli` como devDependency, chamado via `npx shopify` | CLI não está instalado globalmente nesta máquina; devDependency torna a versão reproduzível | y |
| A-04 Senha de storefront da dev store | `SHOPIFY_STOREFRONT_PASSWORD` no `.env`, repassado como `--store-password` ao `theme dev` | Dev stores novas vêm com storefront protegido por senha | n (default do agente) |
| A-08 Erros de sintaxe pré-existentes no Theme Check 4.8 | Corrigidos na F0 como BUG-07 e BUG-08 | `npm run check` (FND-04) não passa sem eles | n (default do agente) |
| A-05 Normalização LF | Um commit dedicado `chore: normalize line endings` com `git add --renormalize .` | Diff atual é 100% CRLF (`git diff --ignore-cr-at-eol` vazio); separar evita misturar com mudanças reais | y |
| A-06 Teste do bug de strings JS (BUG-03) | Verificado por lint estático (G1): nenhum `\| t` dentro de `<script>` sem `\| json` | Forçar uma tradução com apóstrofo na loja real exigiria editar locales só para teste | y |
| A-07 Teste do bug de rota do carrinho (BUG-04) | Playwright sobrescreve `window.Shopify.routes.root` para `/xx-test/` e intercepta a requisição | Uma dev store com um só idioma tem root `/`, o que não distingue código correto de código com URL fixa | y |

**Open questions:** none - all resolved or logged above as agent defaults (assumptions marked "n" can be revised by the user).

---

## User Stories

### P1: Repositório normalizado e gate estático (G1) ⭐ MVP

**User Story**: Como dev (humano ou agente), quero um comando que valide o tema estaticamente e falhe de forma confiável, para que nenhuma tarefa seja fechada com erro de Liquid.

**Why P1**: Todas as features seguintes usam G1 como gate mínimo.

**Acceptance Criteria**:

1. The repository SHALL contain a `.gitattributes` file declaring `* text=auto eol=lf`.
2. WHEN `git ls-files --eol` is run after normalization THEN every tracked text file SHALL report index EOL `i/lf`.
3. The repository SHALL contain a `.theme-check.yml` whose `extends` value is `theme-check:recommended`.
4. WHEN `npm run check` is run on the current theme THEN the system SHALL run `shopify theme check --fail-level error` and SHALL exit with code 0.
5. IF a Liquid file contains a Theme Check error (e.g. an unclosed `{% if %}`) THEN `npm run check` SHALL exit with a non-zero code.
6. WHEN `npm run lint:liquid` is run THEN the system SHALL exit with a non-zero code for any `<script>` block that contains a `| t` output not followed by `| json` in the same output tag.

**Independent Test**: Rodar `npm run check && npm run lint:liquid` → exit 0; inserir `{% if true %}` sem fechamento num arquivo temporário → exit ≠ 0.

---

### P1: Harness de comportamento (G2) ⭐ MVP

**User Story**: Como dev, quero rodar testes Playwright contra o preview real do tema, para testar comportamento que só o Shopify renderiza.

**Why P1**: Sem G2 não há como verificar os bugs nem nenhuma UI das features seguintes.

**Acceptance Criteria**:

1. WHEN `npm run test:e2e` is run with `SHOPIFY_STORE` set THEN Playwright SHALL start `shopify theme dev` on `127.0.0.1:9292` and run the specs in `tests/e2e/`.
2. IF `SHOPIFY_STORE` is not set THEN `npm run test:e2e` SHALL exit with code 1 and print `SHOPIFY_STORE não definido no .env`.
3. WHEN the smoke spec requests `/` THEN the response status SHALL be 200 and the page SHALL contain an element `main#MainContent`.
4. The `.env` file SHALL be listed in `.gitignore`, and a `.env.example` file SHALL list `SHOPIFY_STORE`, `SHOPIFY_CLI_THEME_TOKEN` and `SHOPIFY_STOREFRONT_PASSWORD` with empty values.

**Independent Test**: Com `.env` preenchido, `npm run test:e2e` executa o smoke e retorna exit 0; sem `.env`, retorna exit 1 com a mensagem definida.

---

### P1: Correção dos 5 bugs ⭐ MVP

**User Story**: Como lojista, quero preços corretos, carregamento rápido da página de produto e carrinho funcionando em qualquer idioma, para não perder vendas.

**Why P1**: São defeitos visíveis ao cliente final e o piloto que prova o harness G1/G2.

**Acceptance Criteria**:

1. WHEN a product whose variants have different prices is rendered by `snippets/price.liquid` with `use_variant: false` THEN the price text SHALL contain `product.price_min` formatted by the `money` filter and SHALL NOT contain the raw cents integer of `product.price_min`.
2. WHEN a product page with 2 or more image media is rendered THEN the first media image SHALL have `loading="eager"` and `fetchpriority="high"`.
3. WHEN a product page with 2 or more image media is rendered THEN every media image after the first SHALL have `loading="lazy"` and SHALL NOT have `fetchpriority="high"`.
4. WHEN a variant option is changed on the product page THEN the hidden input `input.product-variant-id` SHALL hold the id of the matching variant and the page SHALL emit zero `pageerror` events.
5. WHEN the add-to-cart form is submitted while `window.Shopify.routes.root` equals `/xx-test/` THEN the cart script SHALL send the request to a URL whose path is `/xx-test/cart/add.js`.
6. WHEN the viewport width changes from 375px to 1440px THEN the computed font-size of an element using `var(--f8)` SHALL be strictly greater at 1440px than at 375px.
7. WHEN Theme Check runs on `templates/gift_card.liquid` THEN it SHALL report zero error-severity offenses, and the template SHALL load the QR library via `'vendor/qrcode.js' | shopify_asset_url`.
8. WHEN Theme Check runs on `snippets/localization-form.liquid` THEN it SHALL report zero error-severity offenses.

**Independent Test**: `npm run test:e2e -- tests/e2e/bugs.spec.ts` falha no código atual (antes das correções) e passa depois.

---

### P2: Contexto para agentes de IA

**User Story**: Como agente de IA trabalhando neste repo, quero ter as convenções, os gates e os MCPs disponíveis automaticamente, para não precisar redescobrir o projeto a cada sessão.

**Why P2**: Acelera todas as features seguintes, mas os gates (P1) já permitem trabalhar sem isso.

**Acceptance Criteria**:

1. The repository SHALL contain a `.mcp.json` declaring a server `shopify-dev` with command `npx` and args `["-y", "@shopify/dev-mcp@latest"]`.
2. The repository SHALL contain a `.mcp.json` declaring a server `shadcn` with command `npx` and args `["shadcn@latest", "mcp"]`.
3. The repository SHALL contain a `CLAUDE.md` with the sections `Gates`, `Decisões (AD)`, `Convenções` and `Mapa de pastas`, where `Gates` lists the commands `npm run check`, `npm run lint:liquid` and `npm run test:e2e`.

**Independent Test**: Abrir o Claude Code no repo → `/mcp` lista `shopify-dev` e `shadcn`; `CLAUDE.md` contém as 4 seções.

---

## Edge Cases

- IF `shopify theme dev` fails to start within 120 seconds THEN `npm run test:e2e` SHALL exit with a non-zero code and print the CLI error output.
- IF the dev store has no product with 2 or more images THEN the BUG-02/BUG-03 specs SHALL fail with the message `Fixture ausente: produto com 2+ imagens` instead of passing silently.
- IF the dev store has no product with price variation THEN the BUG-01 spec SHALL fail with the message `Fixture ausente: produto com preços variáveis`.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| FND-01 | P1: G1 - `.gitattributes` LF | Tasks | Verified |
| FND-02 | P1: G1 - index EOL `i/lf` | Tasks | Verified |
| FND-03 | P1: G1 - `.theme-check.yml` | Tasks | Verified |
| FND-04 | P1: G1 - `npm run check` exit 0 | Tasks | Verified |
| FND-05 | P1: G1 - `npm run check` falha em erro | Tasks | Verified |
| FND-06 | P1: G1 - `lint:liquid` `\| t` sem `\| json` em script | Tasks | Verified |
| E2E-01 | P1: G2 - `test:e2e` sobe `theme dev` | Tasks | Pending |
| E2E-02 | P1: G2 - erro sem `SHOPIFY_STORE` | Tasks | Pending |
| E2E-03 | P1: G2 - smoke `/` 200 + `main#MainContent` | Tasks | Pending |
| E2E-04 | P1: G2 - `.env` ignorado + `.env.example` | Tasks | Pending |
| E2E-05 | Edge: timeout do `theme dev` | Tasks | Pending |
| E2E-06 | Edge: fixtures ausentes falham explicitamente | Tasks | Pending |
| BUG-01 | P1: Bugs - preço "a partir de" formatado | Tasks | Pending |
| BUG-02 | P1: Bugs - primeira mídia eager + fetchpriority | Tasks | Pending |
| BUG-03 | P1: Bugs - demais mídias lazy | Tasks | Pending |
| BUG-04 | P1: Bugs - troca de variante sem pageerror | Tasks | Pending |
| BUG-05 | P1: Bugs - carrinho usa `routes.root` | Tasks | Pending |
| BUG-06 | P1: Bugs - escala `--f8` fluida | Tasks | Pending |
| BUG-07 | P1: Bugs - gift_card sem erro + QR oficial | Tasks | Verified |
| BUG-08 | P1: Bugs - localization-form sem erro | Tasks | Verified |
| AI-01 | P2: `.mcp.json` shopify-dev | Tasks | Verified |
| AI-02 | P2: `.mcp.json` shadcn | Tasks | Verified |
| AI-03 | P2: `CLAUDE.md` com 4 seções | Tasks | Verified |

**Coverage:** 23 total, 0 mapped to tasks, 23 unmapped ⚠️ (mapeamento acontece em `tasks.md`)

---

## Success Criteria

- [ ] `npm run check`, `npm run lint:liquid` e `npm run test:e2e` retornam exit 0 no tema corrigido
- [ ] Os testes de BUG-01, 02, 03, 05, 06, 07 e 08 falham contra o código anterior às correções (BUG-04 é teste de regressão)
- [ ] `git status` limpo após o commit de normalização (zero arquivos com diff só de CRLF)
