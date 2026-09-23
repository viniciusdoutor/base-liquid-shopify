---
name: customize-theme
description: Customiza este tema Shopify Liquid para uma loja/cliente - identidade visual (cores, fontes, radius, logo), home a partir de briefing, seções e blocks novos, adaptação de componentes de sites de referência (React/Tailwind/shadcn), textos e CRO para e-commerce brasileiro. Use quando pedirem para "customizar", "adaptar para a marca X", "criar seção", "montar a home", "mudar cores/fontes", "copiar esse componente", "melhorar conversão" ou "escrever os textos" deste tema.
---

# Customizar o tema

Você customiza um tema Shopify OS 2.0 (Liquid + Tailwind v4 com tokens no estilo shadcn). Leia só o que o pedido precisa.

## 1. Sempre primeiro

1. `CLAUDE.md` (gates, convenções, decisões).
2. Classifique o pedido e abra **apenas** o doc indicado:

| Pedido | Leia |
| ------ | ---- |
| "Onde fica X?", entender uma página/section/snippet | `docs/knowledge/01-mapa-do-tema.md` |
| Cores, fontes, radius, esquemas de cor, classes Tailwind | `docs/knowledge/03-identidade-visual.md` |
| Criar/alterar section, block, home, idioma; portar componente React/shadcn | `docs/knowledge/04-receitas.md` (receita correspondente) |
| Escrever Liquid, carrinho/variantes/busca, performance, acessibilidade | `docs/knowledge/02-liquid-shopify-na-pratica.md` |
| Textos, CRO, parcelamento, Pix, frete, selos, confiança | `docs/knowledge/05-ecommerce-e-copy-ptbr.md` |

## 2. Fluxo

1. **Briefing → decisões**: liste marca, público, cores (hex), fontes, tom de voz, páginas afetadas. Se faltar algo essencial (ex.: cor da marca), pergunte uma vez; o resto, assuma e registre na resposta.
2. **Configuração antes de código**: prefira mudar `config/settings_data.json` (esquemas de cor, fontes, radius) e `templates/*.json` (ordem/settings das seções). Só crie/edite `.liquid` quando a configuração não resolver.

   **Árvore de decisão — o que tocar para cada pedido:**
   ```
   O conteúdo pedido já existe como section (com preset) no tema?
   ├─ Sim, só muda ordem/textos/imagens de página existente
   │    → só `templates/<algum>.json` (receita d) — não crie/edite .liquid.
   ├─ Sim, mas falta um tipo de conteúdo DENTRO dela (ex.: "selo de garantia" no produto)
   │    → adicionar um block a uma section existente (receita c).
   └─ Não, nenhuma section cobre esse conteúdo (ex.: "faixa de benefícios", "FAQ")
        → criar uma section nova, normalmente com blocks (receita b).
   ```
   Regra prática: **nunca crie uma section nova para algo que uma combinação de
   sections + blocks já existentes resolve** (receita d, passo 4); só desça
   para "criar section" (b) ou "adicionar block" (c) quando a configuração via
   `templates/*.json` realmente não alcançar o pedido.
3. **Código**: siga a receita. Classes com tokens (`bg-primary`, `text-muted-foreground`), nunca hex no CSS. Todo texto visível via `| t`. Strings em `<script>` com `| json`. `{% render %}`, nunca `{% include %}`.
4. **CSS**: se adicionou classes Tailwind novas, rode `npm run build:css` e commite `assets/tailwind.css`.
5. **Gates** (todos precisam passar):
   `npm run check && npm run lint:liquid && npm run test:static && npm run test:e2e`
6. **Upload real**: Theme Check não garante que o Shopify aceita o arquivo. Confirme que o `shopify theme dev` não mostra `Failed to upload file` (principalmente ao mexer em `config/settings_schema.json` e `{% schema %}`).
7. **Entrega**: resuma o que mudou por página, os arquivos tocados e o que o lojista ainda precisa fazer no admin (produtos, menus, apps).

## 3. Nunca

- `shopify theme push`, `publish` ou `delete`, ou alterar lojas sem pedido explícito.
- Inventar setting, objeto ou filtro Liquid: confira no código ou em shopify.dev (Shopify Dev MCP `shopify-dev`).
- Urgência falsa, selos falsos, avaliações inventadas.
- Apagar ou enfraquecer testes para passar nos gates. **Customizar a loja de um
  cliente nunca deveria exigir editar teste**: se um gate falha por causa de um
  valor de marca (ex.: um teste espera uma cor/fonte específica do tema base),
  isso é um bug no teste (deveria checar formato/presença, não o valor
  exato) — reporte o problema em vez de editar o teste para o pedido do
  cliente passar.

## 4. Mudança grande

Feature com mais de ~3 arquivos ou comportamento novo: use a skill `tlc-spec-driven` (spec → tasks → executores → Verificador) em `.specs/features/<feature>/`.
