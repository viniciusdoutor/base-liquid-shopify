# Liquid + Shopify na prática

Guia de referência rápida para agentes de IA customizando este tema (Online Store 2.0). Não substitui o `CLAUDE.md` do repo — complementa com conhecimento de plataforma. Toda afirmação de API/comportamento da Shopify aqui tem link para `shopify.dev`; quando não tiver certeza sobre um comportamento não listado aqui, **verifique em shopify.dev antes de inventar um filtro/objeto/endpoint**.

## Objetos e filtros mais usados em loja

Objetos de contexto:
- `product`, `product.selected_or_first_available_variant`, `product.options_with_values` — dados do produto e da variante ativa.
- `collection`, `collection.products`, `collection.filters` — listagem e filtros.
- `cart`, `cart.items`, `cart.item_count`, `cart.total_price` — carrinho atual (em centavos).
- `customer`, `shop`, `request`, `routes`, `section`, `block`, `settings` — contexto global, rotas e configs do tema.
- `settings_data` via `settings` no schema; cores/fontes chegam como CSS variables (`snippets/css-variables.liquid` neste repo — nunca fixe cor/fonte direto no CSS).

Filtros do dia a dia:
- `| t` — tradução (obrigatório em todo texto visível, ver `locales/`). [Tags: t](https://shopify.dev/docs/api/liquid/tags/t)
- `| money`, `| money_with_currency` — formata centavos como preço. [Filters: money](https://shopify.dev/docs/api/liquid/filters/money)
- `| image_url`, `| image_tag` — URL/tag de imagem responsiva (CDN, `srcset`, `width`/`height` automáticos). [Filters: image_tag](https://shopify.dev/docs/api/liquid/filters/image_tag)
- `| json` — serializa para uso seguro em `<script>`.
- `| divided_by`, `| times`, `| round` — matemática em Liquid; `divided_by` faz **divisão inteira** quando os dois operandos são inteiros. [Filters: divided_by](https://shopify.dev/docs/api/liquid/filters/divided_by)
- `| handleize`, `| url_for`, `| within` — geração de handles/URLs de coleção-produto.
- `| default`, `| escape` — fallback e sanitização de string.

## Armadilhas comuns (Errado / Certo)

**1. Filtro dentro de argumento de outro filtro**
Argumentos de filtro não podem conter filtros — o filtro externo acaba aplicado à saída inteira, não ao argumento.
```liquid
{% comment %} Errado {% endcomment %}
{{ 'products.product.price' | t: price: item.price | money }}

{% comment %} Certo {% endcomment %}
{% assign formatted_price = item.price | money %}
{{ 'products.product.price' | t: price: formatted_price }}
```

**2. Filtro dentro de parâmetro de `{% form %}`**
`{% form %}` não aceita filtros nos parâmetros — passe valores já resolvidos.
```liquid
{% comment %} Errado {% endcomment %}
{% form 'product', product | default: current_product %}

{% comment %} Certo {% endcomment %}
{% assign form_product = product | default: current_product %}
{% form 'product', form_product %}
```

**3. String dentro de `<script>` sem `| json`**
Aspas e caracteres especiais quebram o JS; `| json` escapa corretamente.
```liquid
{% comment %} Errado {% endcomment %}
<script>var ADD = "{{ 'products.product.add_to_cart' | t }}";</script>

{% comment %} Certo {% endcomment %}
<script>var ADD = {{ 'products.product.add_to_cart' | t | json }};</script>
```

**4. `divided_by` truncando centavos (parcelamento, descontos)**
Divisão de inteiro por inteiro descarta a parte decimal.
```liquid
{% comment %} Errado — 12x de um preço com centavos vira número quebrado {% endcomment %}
{{ variant.price | divided_by: 12 | money }}

{% comment %} Certo — força divisão em ponto flutuante {% endcomment %}
{% assign installment = variant.price | times: 1.0 | divided_by: 12 %}
{{ installment | money }}
```

**5. Lazy-load na imagem LCP**
A imagem principal (hero, imagem do produto) nunca deve ter `loading="lazy"`; isso atrasa o LCP.
```liquid
{% comment %} Errado {% endcomment %}
{{ product.featured_image | image_url: width: 800 | image_tag: loading: 'lazy' }}

{% comment %} Certo {% endcomment %}
{{ product.featured_image | image_url: width: 800 | image_tag: loading: 'eager', fetchpriority: 'high' }}
```
Ref.: [Never lazy-load the LCP image](https://shopify.dev/docs/storefronts/themes/best-practices/performance/never-lazy-load-lcp-image)

**6. `{% include %}` em vez de `{% render %}`**
`include` vaza escopo de variáveis do arquivo pai (efeito colateral difícil de rastrear) e está sendo descontinuado; `render` isola escopo.
```liquid
{% comment %} Errado {% endcomment %}
{% include 'product-card' %}

{% comment %} Certo {% endcomment %}
{% render 'product-card', product: product %}
```

**7. Loop manual sobre blocos em vez de `content_for 'blocks'`**
Loop manual (`{% for block in section.blocks %}`) funciona, mas só `{% content_for "blocks" %}` resolve blocos aninhados e mantém 100% da experiência do editor de temas.
```liquid
{% comment %} Errado — não renderiza blocos aninhados corretamente {% endcomment %}
{% for block in section.blocks %}{% render block %}{% endfor %}

{% comment %} Certo {% endcomment %}
{% content_for 'blocks' %}
```
Ref.: [Blocks](https://shopify.dev/docs/storefronts/themes/architecture/blocks)

**8. Loop de produto aninhado em loop de variante (ou vice-versa)**
Cada acesso a `product.variants` dentro de um loop de coleção multiplica o trabalho de renderização e pode estourar limites de performance/Liquid.
```liquid
{% comment %} Errado {% endcomment %}
{% for product in collection.products %}
  {% for variant in product.variants %}
    {{ variant.title }}
  {% endfor %}
{% endfor %}

{% comment %} Certo — use a variante selecionada, não todas {% endcomment %}
{% for product in collection.products %}
  {{ product.selected_or_first_available_variant.title }}
{% endfor %}
```

**9. Ignorar que `selected_or_first_available_variant` pode ser `nil`**
Produto sem variante disponível (todas esgotadas/arquivadas) retorna `nil` e quebra o restante da página.
```liquid
{% comment %} Errado {% endcomment %}
<span>{{ product.selected_or_first_available_variant.price | money }}</span>

{% comment %} Certo {% endcomment %}
{% if product.selected_or_first_available_variant %}
  <span>{{ product.selected_or_first_available_variant.price | money }}</span>
{% else %}
  <span>{{ 'products.product.sold_out' | t }}</span>
{% endif %}
```

**10. Confundir `asset_url` com `shopify_asset_url`**
`asset_url` serve arquivos do tema (`assets/`); `shopify_asset_url` serve libs globais hospedadas pela Shopify (ex.: `vendor/qrcode.js`). Usar o errado gera 404.
```liquid
{% comment %} Errado {% endcomment %}
<script src="{{ 'vendor/qrcode.js' | asset_url }}"></script>

{% comment %} Certo {% endcomment %}
<script src="{{ 'vendor/qrcode.js' | shopify_asset_url }}"></script>
```

**11. Chamar a API de carrinho sem prefixo de rota**
Lojas com domínio internacional/prefixo de idioma quebram se a URL do fetch for hardcoded.
```js
// Errado
fetch('/cart/add.js', { method: 'POST', body })

// Certo
fetch(`${window.Shopify.routes.root}cart/add.js`, { method: 'POST', body })
```

**12. Liquid dentro de `{% stylesheet %}` / `{% javascript %}`**
Essas tags são pré-processadas e empacotadas fora do fluxo normal de Liquid — não aceitam tags/objetos Liquid, e só carregam se a section/block for de fato renderizado na página.
```liquid
{% comment %} Errado {% endcomment %}
{% stylesheet %}
.card { color: {{ settings.accent_color }}; }
{% endstylesheet %}

{% comment %} Certo — settings viram CSS var no layout, o CSS só consome {% endcomment %}
{% stylesheet %}
.card { color: var(--accent); }
{% endstylesheet %}
```

**13. Ignorar resposta 422 do `/cart/add.js`**
Item esgotado ou quantidade indisponível retorna HTTP 422 com corpo de erro — sem tratamento, o clique simplesmente "não faz nada" aos olhos do cliente.
```js
// Errado
fetch(url, opts).then(r => r.json()).then(updateCartUI);

// Certo
fetch(url, opts).then(async (r) => {
  const data = await r.json();
  if (r.status === 422) return showError(data.description);
  updateCartUI(data);
});
```

**14. Excesso de `preload_tag`**
Cada preload compete por banda com o recurso crítico real; mais que 1-2 por página piora o LCP em vez de ajudar.

## Performance

- **Nunca** faça lazy-load da imagem LCP; use `fetchpriority: 'high'` nela. [Ref.](https://shopify.dev/docs/storefronts/themes/best-practices/performance/never-lazy-load-lcp-image)
- Use `image_tag`/`image_url` com `widths`/`sizes` corretos em vez de uma imagem única superdimensionada.
- `image_tag` já aplica `loading="eager"` para as primeiras sections (índice baixo) e `loading="lazy"` depois — use `section.index` quando precisar decidir eager/lazy manualmente em snippets reaproveitados.
- Evite loops aninhados produto×variante (armadilha #8); prefira `selected_or_first_available_variant` ou `options_with_values`.
- CSS crítico e preloads devem vir **antes** de `{{ content_for_header }}` no `<head>`.
- `preload_tag` só para 1-2 recursos realmente críticos por página (ver armadilha #14).
- Scripts não críticos: sempre `defer`.
- Ref. geral: [Performance best practices](https://shopify.dev/docs/storefronts/themes/best-practices/performance)

## Acessibilidade

- Foco sempre visível (`:focus-visible`), nunca `outline: none` sem substituto.
- Skip link no topo do `theme.liquid` (`Pular para o conteúdo`).
- Todo campo de formulário com `<label>` associado (ou `aria-label`).
- Contraste mínimo 4.5:1 em texto normal.
- Drawers/modais (carrinho, busca, menu) com **focus trap** e fechamento por `Esc`.
- Nunca usar `maximum-scale` no `<meta viewport>` — impede zoom, falha de a11y.
- Meta do Theme Store: Lighthouse acessibilidade média ≥ 90 (desktop e mobile) nas páginas home/coleção/produto. [Ref.](https://shopify.dev/docs/storefronts/themes/store/requirements)

## APIs de carrinho, variantes, busca e recomendações

**Cart AJAX** — sempre prefixado por `window.Shopify.routes.root`; use `sections` (até 5 ids) + `sections_url` para re-renderizar HTML (padrão cart drawer):
```js
const res = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ id: variantId, quantity: 1 }],
    sections: ['cart-drawer', 'cart-icon-bubble'],
    sections_url: window.location.pathname,
  }),
});
if (res.status === 422) { /* fora de estoque */ }
```
Ref.: [Cart API reference](https://shopify.dev/docs/api/ajax/reference/cart), [Section Rendering API](https://shopify.dev/docs/api/ajax/section-rendering)

**Variant picker escalável** — não gere um `<select>` por combinação; use `options_with_values` e busque a seção renderizada para a combinação escolhida:
```liquid
{% for option in product.options_with_values %}
  {% for value in option.values %}
    <a href="{{ value.product_url }}" data-available="{{ value.available }}">{{ value.name }}</a>
  {% endfor %}
{% endfor %}
```
```js
fetch(`${root}products/${handle}?option_values=${ids.join(',')}&section_id=${sectionId}`)
```
Sempre trate `product.selected_or_first_available_variant` como possivelmente `nil` (armadilha #9).

**Busca preditiva**:
```js
fetch(`${root}search/suggest?q=${q}&section_id=predictive-search&resources[type]=product,collection,query`)
```
Combobox com ARIA (`role="combobox"`, `aria-expanded`, `aria-activedescendant`).

**Recomendações de produto**:
```liquid
{{ 'recommendations/products' }}?product_id={{ product.id }}&limit=4&section_id={{ section.id }}&intent=related
```
`intent` aceita `related` (auto-gerado) ou `complementary` (precisa configurar no Search & Discovery). [Ref.](https://shopify.dev/docs/api/ajax/reference/product-recommendations)

**Checkout acelerado**:
```liquid
{% form 'product', product %}
  {{ form | payment_button }}
{% endform %}
```
No carrinho:
```liquid
{% if additional_checkout_buttons %}
  {{ content_for_additional_checkout_buttons }}
{% endif %}
```
Botões acelerados são injetados via JS no load inicial — **não funcionam em respostas de AJAX/Section Rendering**. [Ref.](https://shopify.dev/docs/api/liquid/filters/payment_button)

## Theme blocks vs section blocks — quando usar

- **Section blocks** (`{% schema %}` com array `blocks` dentro da própria section): use quando o bloco é específico daquela section e não precisa ser reaproveitado em outras.
- **Theme blocks** (arquivos em `blocks/`, renderizados via `{% content_for 'blocks' %}`): use quando o bloco deve ser reaproveitável entre sections diferentes, quando o merchant precisa poder aninhar blocos (até 8 níveis) ou reordenar livremente no editor. [Ref.](https://shopify.dev/docs/storefronts/themes/architecture/blocks)
- **Blocos estáticos** (`{% content_for "block", type: "...", id: "..." %}`): use quando o bloco é sempre o mesmo naquele lugar (não deve ser removido/duplicado pelo merchant), ex. um bloco fixo de breadcrumb.
- **Blocos privados** (arquivo prefixado com `_`, ex. `blocks/_icon.liquid`): use para blocos internos, reaproveitados só por composição de outro block/section — não aparecem para o merchant adicionar livremente pelo editor.
- Documente parâmetros de snippets/blocks reutilizáveis com LiquidDoc (`{% doc %} @param {tipo} nome - descrição {% enddoc %}`) — habilita autocomplete e validação de tipo no editor de temas. [Ref.](https://shopify.dev/docs/api/liquid/tags/doc)

## Checklist antes de entregar

- [ ] `npm run check` (Theme Check) e `npm run lint:liquid` verdes.
- [ ] `npm run test:static` e (se aplicável) `npm run test:e2e` verdes.
- [ ] Nenhum filtro dentro de argumento de outro filtro ou dentro de `{% form %}`.
- [ ] Toda string em `<script>` passa por `| json`.
- [ ] Imagem LCP com `loading="eager"` + `fetchpriority: 'high'`; demais imagens lazy.
- [ ] No máximo 1-2 `preload_tag` por página.
- [ ] Nenhum loop produto×variante aninhado desnecessário.
- [ ] Chamadas a `/cart/*.js` prefixadas com `window.Shopify.routes.root` e tratando 422.
- [ ] `selected_or_first_available_variant` sempre verificado antes de usar.
- [ ] Todo texto visível passa por `| t`; nenhuma string hardcoded em PT ou EN.
- [ ] Cores/fontes vêm de settings via CSS variables, nunca fixas no CSS.
- [ ] Foco visível, skip link, labels, contraste 4.5:1, sem `maximum-scale`, drawers com focus trap.
- [ ] Escolha de theme block vs section block vs bloco estático justificada (reuso? aninhamento? merchant pode remover?).
