# CLAUDE.md

Tema base Shopify (Online Store 2.0) em Liquid, documentado em português. Leia este arquivo antes de mexer no código.

## Gates

Toda tarefa só fecha com os gates verdes. Rode na raiz do repo:

| Comando | Gate | O que valida |
| ------- | ---- | ------------ |
| `npm run check` | G1 | `shopify theme check --fail-level error` (config em `.theme-check.yml`) |
| `npm run lint:liquid` | G1 | Lint próprio (`scripts/lint-liquid.mjs`): `\| t` dentro de `<script>` precisa terminar em `\| json` |
| `npm run test:static` | G1 | Testes estáticos (`node:test`) em `tests/static/` |
| `npm run test:e2e` | G2 | Playwright contra `shopify theme dev` (exige `SHOPIFY_STORE` no `.env`, ver `.env.example`) |

O Shopify CLI é devDependency: use `npx shopify ...`. Nunca rode `shopify theme push` nem altere lojas sem pedido explícito.

## Decisões (AD)

Fonte da verdade: `.specs/STATE.md` (seção Decisions). Resumo:

- **AD-001**: Tailwind CSS v4 (CLI, sem config JS) com os nomes de tokens do shadcn/ui (`--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`...) via `@theme inline`, gerados a partir do `color_scheme_group` do Shopify. Objetivo: portar e-commerces shadcn para Liquid quase 1:1.
- **AD-002**: O test gate é uma pilha de quatro gates: G1 estático (Theme Check + lint Liquid), G2 comportamento (Playwright + axe contra `shopify theme dev`), G3 visual (screenshot diff) e G4 performance (Lighthouse CI).

Decisão nova de projeto vai para `.specs/STATE.md` como `AD-NNN`.

## Convenções

- Use `{% render %}`, nunca `{% include %}`.
- Todo texto visível passa por `| t` (chaves em `locales/`).
- String Liquid dentro de `<script>` sai com `| json` (ex.: `var ADD = {{ 'products.product.add_to_cart' | t | json }};`).
- Settings do tema viram CSS variables (`snippets/css-variables.liquid`); não fixe cores ou fontes no CSS.
- Finais de linha LF (`.gitattributes`); não commite CRLF.
- Features novas seguem a skill `tlc-spec-driven`, com spec, tasks e validação em `.specs/features/<feature>/`.
- Commits no formato Conventional Commits, um por tarefa.

## Agentes e modelos

Economia de tokens: o orquestrador (sessão principal) só especifica, decide e lê resumos compactos. Trabalho pesado vai para sub-agentes no modelo mais barato que dá conta.

| Papel | Agente | Modelo | Quando |
| ----- | ------ | ------ | ------ |
| Pesquisa / localizar código / docs | `liquid-scout` | haiku | Antes de Specify/Design; nunca edita |
| Executor de lote (tasks.md) | `tlc-worker` | sonnet | Execute, ~7 tarefas por lote, lotes em sequência |
| Verificador (autor ≠ verificador) | `tlc-verifier` | sonnet | Automático após a última tarefa de cada feature |
| Design de alta ambiguidade (F1 tokens, F3 registry, F5 port) | sessão principal | modelo da sessão | Decisões difíceis de reverter |

Regras: sub-agente lê só `CLAUDE.md` + spec/tasks da feature + trechos que a tarefa toca; devolve resumo compacto, nunca logs completos.

## Mapa de pastas

| Pasta | Conteúdo |
| ----- | -------- |
| `layout/` | Moldura HTML (`theme.liquid`) |
| `templates/` | JSON OS 2.0 que listam as sections de cada página (exceto `gift_card.liquid`) |
| `sections/` | Blocos de página configuráveis no editor, com `{% schema %}` |
| `snippets/` | Parciais reutilizáveis chamadas com `{% render %}` |
| `assets/` | CSS e JS estáticos |
| `config/` | `settings_schema.json` (settings do tema) e `settings_data.json` (valores) |
| `locales/` | Traduções (`en.default.json`) e textos do editor (`*.schema.json`) |
| `scripts/` | Scripts Node dos gates (ex.: `lint-liquid.mjs`) |
| `tests/static/` | Testes G1 (`node:test`) |
| `tests/e2e/` | Testes G2 (Playwright) |
| `.specs/` | Specs, tasks e decisões (`STATE.md`) da `tlc-spec-driven` |
