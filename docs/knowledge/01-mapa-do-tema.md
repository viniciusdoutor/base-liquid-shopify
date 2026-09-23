# Mapa do tema — como este tema funciona

Doc de referência rápida para um agente que vai customizar este tema Shopify
(Online Store 2.0, Liquid) para um cliente. Leia primeiro `CLAUDE.md` (gates,
convenções, mapa de pastas) — este arquivo complementa com detalhe de conteúdo.

## 1. Fluxo de renderização

```
Requisição HTTP
      │
      ▼
layout/theme.liquid  (moldura HTML: <head>, header-group, <main>, footer-group)
      │
      ├─ render 'meta-tags' → 'structured-data-product' | 'structured-data-website'
      ├─ render 'css-variables'  (settings → CSS custom properties, no <head>)
      ├─ asset_url 'index.css'      (reset + base)
      ├─ asset_url 'tailwind.css'   (utilitários shadcn, sem preflight)
      ├─ render 'alerta'   (toast global)
      ├─ render 'carrinho' (ponto de montagem do drawer)
      │
      ├─ {% sections 'header-group' %} → sections/header-group.json → nav.liquid
      │
      ├─ {{ content_for_layout }}
      │        │
      │        ▼
      │  templates/<tipo>.json  (lista de sections + settings/blocks daquela página)
      │        │
      │        ▼
      │  sections/<nome>.liquid  ({% schema %} com settings/blocks; renderiza HTML)
      │        │
      │        ▼
      │  {% render 'snippet' %}  (parciais reutilizáveis: card-product, price, icon...)
      │
      └─ {% sections 'footer-group' %} → sections/footer-group.json → footer.liquid
```

Templates são JSON (exceto `templates/gift_card.liquid`, standalone). Cada
template só decide **quais sections** aparecem e com quais settings/blocks
iniciais — o conteúdo real vive no schema de cada section e pode ser
reeditado no editor de temas sem tocar em código.

Pipeline de CSS (build time, separado do runtime Liquid):

```
src/tailwind.css --(npm run build:css / watch:css)--> assets/tailwind.css (committed)
```

Ver `.specs/features/design-tokens/design.md` para o desenho completo do
sistema de tokens de cor (shadcn via Tailwind v4).

## 2. Templates → sections

| Template | Sections (ordem) |
| --- | --- |
| `index.json` | `image-banner` (hero, preset com blocks heading/text/button) → `featured-collection` |
| `product.json` | `main-product` (blocks: vendor, title, price, variant_picker, quantity, buy_buttons, description, share) → `related-products` |
| `collection.json` | `collection-banner` → `main-collection` |
| `list-collections.json` | `main-list-collections` |
| `cart.json` | `main-cart` |
| `search.json` | `main-search` |
| `blog.json` | `main-blog` (setting `posts_per_page: 12`) |
| `article.json` | `main-article` |
| `page.json` | `main-page` |
| `page.contact.json` | `contact-form` (setting `heading: "Contact"`) |
| `password.json` | `main-password` |
| `404.json` | `main-404` |
| `gift_card.liquid` | standalone (não usa sections) |
| `header-group.json` (layout) | `nav` |
| `footer-group.json` (layout) | `footer` |

Sections com preset (aparecem em "Add section" no editor, fora do template
inicial): `collection-list`, `featured-collection`, `contact-form`,
`image-banner`, `rich-text`. `main-*` e `related-products`/`collection-banner`
não têm preset (são amarradas a um template específico).

## 3. Sections

Uma linha por section: propósito · settings (ids) · blocks (types) · snippets renderizados.

| Section | Propósito · settings (ids) · blocks (types) · snippets |
| --- | --- |
| `nav.liquid` | Header: logo, menu multinível, busca, conta, carrinho, país/idioma · settings: `menu`, `enable_country_selector`, `enable_language_selector` · sem blocks · renderiza `icon`, `localization-form` |
| `footer.liquid` | Rodapé: marca/menu/texto/newsletter + localização + pagamento + social · settings: `show_social`, `show_payment_icons`, `enable_localization` · blocks: `brand`, `menu`, `text`, `newsletter` · renderiza `newsletter-form`, `localization-form`, `icon` |
| `image-banner.liquid` | Hero full-width com overlay · settings: `image`, `height` (small/medium/large), `text_alignment` (left/center/right) · blocks: `heading`, `text`, `button` (limit 1 cada) · sem snippets |
| `rich-text.liquid` | Bloco de texto centralizado, sem imagem · sem settings de section · blocks: `heading`, `text`, `button` (limit 1 cada) · sem snippets |
| `featured-collection.liquid` | Vitrine de produtos de UMA coleção · settings: `heading`, `collection`, `products_to_show`, `columns_desktop`, `show_view_all` · sem blocks · renderiza `card-product` |
| `collection-list.liquid` | Grade de coleções curadas manualmente · settings: `heading`, `columns_desktop` · blocks: `featured_collection` (cada um escolhe 1 coleção) · sem snippets |
| `collection-banner.liquid` | Cabeçalho da página de coleção (título/descrição/imagem) · settings: `show_description`, `show_image` · sem blocks · sem snippets |
| `main-collection.liquid` | Grade de produtos com ordenação e filtros facetados · settings: `products_per_page`, `columns_desktop`, `enable_sorting`, `enable_filtering` · sem blocks · renderiza `card-product`, `pagination` |
| `main-list-collections.liquid` | Grade com todas as coleções da loja · settings: `heading` · sem blocks · renderiza `pagination` |
| `main-product.liquid` | Página de produto: galeria + variantes + add-to-cart · sem settings de section · blocks: `@app`, `vendor`, `title`, `price`, `variant_picker`, `quantity`, `buy_buttons` (setting `show_dynamic_checkout`), `description`, `share`, `custom_liquid` · renderiza `price`, `product-media-gallery`, `product-variant-selection`, `share-button` |
| `related-products.liquid` | Recomendações via API (web component) · settings: `enable`, `heading`, `products_to_show` · sem blocks · renderiza `card-product` |
| `main-cart.liquid` | Carrinho completo (itens, quantidade, resumo) · settings: `show_note` · sem blocks · sem snippets (form nativo `{% form 'cart' %}`) |
| `main-search.liquid` | Busca mista (produto/artigo/página) · sem settings · sem blocks · renderiza `card-product`, `pagination` |
| `main-blog.liquid` | Listagem de artigos · settings: `posts_per_page` (3–24, passo 3) · sem blocks · sem snippets |
| `main-article.liquid` | Post + comentários nativos · sem settings · sem blocks · sem snippets (`{% form 'new_comment' %}`) |
| `main-page.liquid` | Página institucional (título + rich text) · sem settings · sem blocks · sem snippets |
| `contact-form.liquid` | Formulário de contato nativo · settings: `heading` · sem blocks · sem snippets (`{% form 'contact' %}`) |
| `main-password.liquid` | Tela de loja fechada · sem settings · sem blocks · sem snippets (`{% form 'storefront_password' %}`) |
| `main-404.liquid` | Página não encontrada + busca · sem settings · sem blocks · sem snippets |

Setting `color_scheme` (classe `.color-{{ section.settings.color_scheme }}`
no wrapper): sendo adicionado por F1 design-tokens em `image-banner.liquid`,
`rich-text.liquid` e `footer.liquid` (em andamento — confira o schema do
arquivo antes de usar; ainda não existe nos demais sections listados acima).

## 4. Snippets — parâmetros

| Snippet | Parâmetros | Observação |
| --- | --- | --- |
| `alerta` | nenhum (render direto) | expõe `mostrarAlerta(mensagem, tipo='positivo', duracao=4000)` e `fecharAlerta()` no `window` |
| `carrinho` | nenhum | só o elemento raiz `<div id="carrinho">`; conteúdo vem de JS externo |
| `card-product` | `card_product` (objeto product) | ratio vem de `settings.card_image_ratio`; hover-image de `settings.card_show_second_image`; vendor de `settings.card_show_vendor` |
| `css-variables` | nenhum (lê `settings.*`) | renderizar 1x no `<head>` de `theme.liquid` |
| `icon` | `name` | UI: `search`, `account`, `cart`, `close`, `chevron`, `trash`. Comércio: `truck`, `credit-card`, `pix`, `shield-check`, `refresh`, `gift`, `leaf`, `chat`. Social: `instagram`, `facebook`, `linkedin` |
| `localization-form` | `section_id`, `show_country` (bool), `show_language` (bool) | só mostra seletor se houver >1 opção disponível |
| `meta-tags` | nenhum | usa `page_title`, `page_description`, `page_image`, `canonical_url`, `request.page_type`, `product` |
| `newsletter-form` | `block` (opcional, só para `shopify_attributes`) | form `customer` nativo com tag `newsletter` |
| `pagination` | `paginate` (objeto da tag `{% paginate %}`) | só renderiza se `paginate.pages > 1` |
| `price` | `product` (product ou variant), `use_variant` (bool), `show_compare` (bool), `price_class` | se `product` já é uma variante, use `use_variant: false` |
| `product-media-gallery` | `section_id` | só CSS, não gera HTML; classes fixas `.product__*` |
| `product-variant-selection` | `section_id`, `product_form_id` | ver seção 6 (JS) |
| `share-button` | `share_link`, `share_title` | Web Share API com fallback de copiar link; registra `<share-button>` |
| `structured-data-product` | nenhum (usa `product` global) | só renderiza se `product` existir |
| `structured-data-website` | nenhum | chamado por `meta-tags` só na home |

## 5. Settings globais (`config/settings_schema.json`)

| Grupo | Settings (ids) | Vira CSS var em `snippets/css-variables.liquid` |
| --- | --- | --- |
| Logo | `logo`, `logo_width`, `favicon` | `logo_width` não é CSS var (usado direto no `<img>`); `favicon` vira `<link rel="icon">` no `theme.liquid` |
| Colors | `color_schemes` (color_scheme_group, 16 campos: `background`, `foreground`, `card`, `card_foreground`, `primary`, `primary_foreground`, `secondary`, `secondary_foreground`, `muted`, `muted_foreground`, `accent`, `accent_foreground`, `destructive`, `border`, `input`, `ring`), `color_sale` | um bloco `.color-<scheme-id>` por esquema com os 16 tokens shadcn (`--background`, `--foreground`, ... `--ring`) + `--popover`/`--popover-foreground` (cópia de card) + aliases legados (`--color-*`, `--cor-marca`, `--cor-verde`, `--cor-gelo`, `--cor-cinza`); `color_sale` → `--sale` |
| Typography | `type_header_font`, `heading_scale`, `type_body_font`, `body_scale` | `--font-heading-family/weight`, `--font-body-family/weight`, `--font-heading-scale`, `--font-body-scale` (+ `@font-face` via `font_face` filter) |
| Layout | `radius`, `page_width`, `spacing_sections`, `buttons_radius`, `inputs_radius`, `media_radius` | `--radius`, `--page-width`, `--spacing-sections`, `--buttons-radius`, `--inputs-radius`, `--media-radius`; `--radius` também alimenta `--radius-sm/md/lg/xl` em `src/tailwind.css` (`@theme inline`) |
| Product cards | `card_image_ratio`, `card_show_vendor`, `card_show_second_image` | não são CSS var — lidos direto em `snippets/card-product.liquid` |
| Cart | `cart_type`, `cart_show_note` | não são CSS var — lidos direto em `sections/main-cart.liquid` |
| Social media | `social_instagram_link`, `social_facebook_link`, `social_linkedin_link` | não são CSS var — usados em `sections/footer.liquid` |
| Social sharing | `share_image` | não é CSS var — usado em `snippets/meta-tags.liquid` como fallback de OG image |

Valores atuais e os 3 presets de esquema (`scheme-1` claro, `scheme-2`
escuro, `scheme-3` inverso) ficam em `config/settings_data.json`.

Tokens shadcn (`--primary`, `--card`, etc.) também viram utilitários Tailwind
(`bg-primary`, `text-muted-foreground`, `rounded-lg`...) via `@theme inline`
em `src/tailwind.css`, compilado para `assets/tailwind.css`. Ver
`.specs/features/design-tokens/design.md`.

## 6. JavaScript existente

| Arquivo | O que faz | O que espera no DOM |
| --- | --- | --- |
| `assets/carrinho.js` | Progressive enhancement do add-to-cart: intercepta submit, POST `/cart/add.js`, atualiza contador via GET `/cart.js`, mostra toast, faz fallback de submit nativo se a request falhar | formulário `form[action$="/cart/add"]` ou `form[data-type="add-to-cart-form"]`; botão `[type="submit"]`/`[name="add"]`; elementos `[data-cart-count]` para o contador; usa `window.mostrarAlerta` e `window.themeStrings.addedToCart` |
| `snippets/product-variant-selection.liquid` (script inline) | Ao trocar variante: atualiza id da variante, preço, estado do botão, mídia em destaque, `?variant=` na URL; controla os botões +/- da quantidade | `[data-section-id="{{ section_id }}"]`; `#{{ product_form_id }}` com `.product-variant-id`, `.product__add-to-cart`; `.product__price`; `script[data-variant-json]` (JSON com id/options/available/mídia/HTML do preço por variante); `#ProductMedia-{{ section_id }}` |
| `snippets/alerta.liquid` (script inline) | Toast global fixo; expõe `mostrarAlerta(mensagem, tipo, duracao)` e `fecharAlerta()`; fecha com ESC ou timeout | renderizar 1x no layout; consumido por `carrinho.js` e por qualquer JS custom via `window.mostrarAlerta` |
| `sections/nav.liquid` (script inline) | Abre/fecha o menu mobile alternando `aria-expanded`/`hidden` | botão hambúrguer + painel do menu mobile dentro da própria section |
| `sections/main-cart.liquid` (script inline) | Intercepta +/- e `change` de quantidade, chama `/cart/change.js` e recarrega a página (sem atualização parcial de DOM) | inputs/botões de quantidade da tabela `cart-items` |
| `sections/related-products.liquid` (custom element) | `<product-recommendations>` faz `fetch` da API de recomendações e injeta o grid | atributo `data-url` com `section_id`, `product_id`, `limit` |

## 7. Gates e como validar mudanças

Rodar sempre na raiz do repo (ver `CLAUDE.md`):

| Comando | Gate | Valida |
| --- | --- | --- |
| `npm run check` | G1 | `shopify theme check --fail-level error` (`.theme-check.yml`) |
| `npm run lint:liquid` | G1 | Lint próprio (`scripts/lint-liquid.mjs`): `\| t` dentro de `<script>` precisa terminar em `\| json` |
| `npm run test:static` | G1 | `node --test tests/static/*.test.mjs` |
| `npm run test:e2e` | G2 | Playwright contra `shopify theme dev` (exige `SHOPIFY_STORE` no `.env`; ver `.env.example`) |
| `npm run build:css` | — | Recompila `src/tailwind.css` → `assets/tailwind.css` (rode depois de mexer em classes Tailwind ou tokens) |
| `npm run dev` | — | `watch:css` + `shopify theme dev` juntos, para desenvolver com preview ao vivo numa dev store |

`AD-002` (`.specs/STATE.md`) descreve G3 (visual diff) e G4 (Lighthouse CI)
como parte da pilha de gates da feature, mas hoje só G1/G2 têm script no
`package.json` — não invente comandos `test:visual`/`test:perf` que não
existem.

Fluxo típico de validação de uma mudança:
1. `npm run build:css` se mexeu em classes Tailwind/tokens.
2. `npm run check && npm run lint:liquid && npm run test:static` (rápido, sem dev store).
3. `npm run dev` (ou só `shopify theme dev --store SUA-LOJA.myshopify.com`) para ver visualmente.
4. `npm run test:e2e` antes de considerar a tarefa pronta, se a mudança afeta comportamento renderizado (variantes, carrinho, tokens de cor, etc.).
