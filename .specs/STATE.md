# STATE

## Decisions

### AD-001
- **Decision**: O tema usa Tailwind CSS v4 (CLI, sem config JS) com os nomes de tokens do shadcn/ui (`--background`, `--foreground`, `--primary`, `--primary-foreground`, `--card`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius`) expostos via `@theme inline` e gerados a partir do `color_scheme_group` do Shopify.
- **Reason**: Máxima compatibilidade para portar e-commerces feitos com shadcn/ui para Liquid (className → class quase 1:1) e para distribuir componentes via registry compatível com o shadcn CLI/MCP.
- **Trade-off**: Adiciona build step (`tailwindcss --watch` junto de `shopify theme dev`), exige safelist para classes vindas de settings e afasta o tema dos requisitos da Theme Store (CSS gerado). CSS puro seria zero-build mas exigiria tradução manual em cada port.
- **Scope**: Todas as features de UI (F1 design-tokens em diante): primitivos `snippets/ui-*`, blocks, sections, registry `@flowera`.
- **Date**: 2026-09-22
- **Status**: active

### AD-002
- **Decision**: O "test gate" do tlc para Liquid é uma pilha de quatro gates: G1 estático (`shopify theme check` + lint Liquid próprio), G2 comportamento (Playwright + axe contra `shopify theme dev`), G3 visual (screenshot diff) e G4 performance (Lighthouse CI).
- **Reason**: Temas Liquid não têm test runner nativo; Playwright contra o preview real é o único jeito de testar comportamento renderizado pelo Shopify.
- **Trade-off**: G2–G4 dependem de uma dev store e de credencial (Theme Access), e são lentos (~1–2 min por execução) comparados a testes unitários.
- **Scope**: Todas as features em `.specs/features/`.
- **Date**: 2026-09-22
- **Status**: active

### AD-003
- **Decision**: Sem registry/catálogo `@flowera` e sem pipeline de port shadcn→Liquid; o shadcn/ui é só referência de contexto (tokens em pares, composição, anti-padrões), sem equivalência 1:1. O investimento vai para a base de conhecimento `docs/knowledge/` + skill `customize-theme` que tornam a IA eficaz em customizar o tema.
- **Reason**: Pedido do usuário em 2026-09-23 por um plano mais rápido e com menos fases; customização por IA guiada por docs entrega valor sem manter um catálogo.
- **Trade-off**: Componentes não são distribuíveis entre lojas via CLI; cada loja recebe as features sob demanda seguindo receitas.
- **Scope**: Supersede a parte de registry/port do AD-001 (Tailwind v4 + nomes de token shadcn continuam valendo). Features F2–F6 do plano anterior viram receitas em `docs/knowledge/04-receitas.md`.
- **Date**: 2026-09-23
- **Status**: active

## Handoff

- **Feature**: plano enxuto (AD-003) concluído
- **Phase / Task**: A (design-tokens PASS), B (docs/knowledge 01-05 + skill customize-theme), C (piloto Aurora Café em `pilot/aurora-cafe`, achados corrigidos no master)
- **Completed**: F0 ai-foundation, F1 design-tokens, base de conhecimento, piloto
- **In-progress** (file:line): none
- **Next step**: decidir push do master para origin; opcional: trazer `sections/benefits-bar.liquid` do piloto para a base; próximo cliente via skill customize-theme
- **Blockers**: none
- **Uncommitted files**: none
- **Branch**: master (não enviado ao origin)
