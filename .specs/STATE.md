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

## Handoff

- **Feature**: `.specs/features/ai-foundation`
- **Phase / Task**: Phase 2 / T9 - Playwright harness (Phase 1 T1–T8 done, 17 static tests passing)
- **Completed**: T1, T2, T3, T4, T5, T6, T7, T8 (commits 61c1fcc..ec7352b)
- **In-progress** (file:line): none
- **Next step**: Criar dev store (`npx shopify store create dev --name flowera-base-e2e --organization-id 237009598 --plan basic --country BR --demo-data`), preencher `.env`, despachar Batch 2 (T9–T14), depois Verifier
- **Blockers**: criação da dev store bloqueada pelo classificador de permissões; exige o usuário rodar o comando (login Shopify CLI já feito, alias `flowera`)
- **Uncommitted files**: none
- **Branch**: master
