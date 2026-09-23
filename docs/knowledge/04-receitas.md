# Receitas — passo a passo para customizar o tema

Pré-requisito: leia `CLAUDE.md` e `docs/knowledge/01-mapa-do-tema.md`. Todas as
receitas assumem terminal na raiz do repo e Shopify CLI disponível via `npx
shopify` (nunca instale global, nunca rode `shopify theme push` sem pedido
explícito do usuário).

## a. Trocar identidade visual (cores, fontes, radius, logo) sem tocar CSS

**Quando usar:** cliente novo quer a paleta/tipografia/logo dele, sem mexer em
nenhum `.liquid`/`.css`.

**Arquivos a tocar:** `config/settings_data.json` (valores) — e, se o cliente
quiser presets extras selecionáveis no editor, `config/settings_schema.json`
não muda (a estrutura de campos já existe); só `settings_data.json` guarda
valores. Alternativa recomendada: fazer isso pelo **editor de temas**
(admin → Themes → Customize → Theme settings), que grava no mesmo
`settings_data.json`.

**Passos:**
1. Abra `config/settings_data.json` → chave `current`.
2. Cores: edite os 16 campos de cada esquema em `color_schemes.scheme-1`
   (claro), `scheme-2` (escuro), `scheme-3` (inverso) — `background`,
   `foreground`, `card`, `card_foreground`, `primary`, `primary_foreground`,
   `secondary`, `secondary_foreground`, `muted`, `muted_foreground`,
   `accent`, `accent_foreground`, `destructive`, `border`, `input`, `ring`.
   Use hex. Mantenha contraste AA entre `*` e `*_foreground`.
3. Cor de promoção: `color_sale` (hex, fora do `color_scheme_group`).
4. Fontes: `type_header_font` / `type_body_font` aceitam qualquer handle da
   Shopify Fonts library, formato `familia_<n|i><peso>` (ex.: `assistant_n7`
   = Assistant peso 700 normal; outros handles confirmados:
   `lora_n4`/`lora_n7`, `playfair_display_n4`, `inter_n4` — ver
   `docs/knowledge/03-identidade-visual.md` seção 4 antes de usar um handle
   novo). `heading_scale` / `body_scale` são percentuais (100 = tamanho
   padrão da escala fluida `--f0`..`--f8`).
5. Radius: **dois grupos independentes, mude os dois para uma identidade
   nova** (detalhe em `docs/knowledge/03-identidade-visual.md` seção 4) —
   `radius` (alimenta `--radius` e `rounded-sm/md/lg/xl` do Tailwind; **não
   existe em `settings_data.json` por padrão**, adicione a chave se for
   mudar) e `buttons_radius`/`inputs_radius`/`media_radius` (já existem em
   `settings_data.json`, em px puro, alimentam CSS legado de sections
   `main-*`/`nav`/`collection-*`/etc.). Mudar só um grupo deixa sections
   novas e antigas com cantos diferentes.
6. Logo/favicon: `logo`, `logo_width`, `favicon` — se for editar pelo código,
   o valor é uma referência de arquivo já enviado (`shopify://shop_images/...`);
   normalmente é mais simples subir pelo editor de temas (upload direto).
7. Nunca crie um settings id novo aqui sem também declará-lo em
   `config/settings_schema.json` e dar um label em
   `locales/en.default.schema.json` — senão o editor não mostra o campo e o
   `theme check` acusa setting não usado/indefinido. **O `id` do
   `settings_schema.json` é a chave usada em `settings_data.json`**: um
   setting `{ "id": "color_sale", ... }` no schema vira a chave
   `current.color_sale` (e `presets.<preset>.color_sale`) no data — mesma
   lógica dentro de um `color_scheme_group`: o `id` de cada campo da
   `definition` (ex. `primary`) vira
   `current.color_schemes["scheme-1"].settings.primary`. Editar o schema sem
   tocar o data não muda nada visível; editar o data com uma chave que não
   existe no schema é ignorado silenciosamente (ou acusado pelo `theme
   check`, dependendo do caso) — sempre os dois arquivos juntos.

**Como verificar:** `npm run check && npm run test:static`, depois
`npm run dev` e olhar visualmente (home, produto, carrinho) nos dois
color-schemes usados no tema. Se possível, `npm run test:e2e` (cobre
`tests/e2e/type-scale.spec.ts`, que confere a escala de fonte).

**Erros comuns:** editar cor só no `scheme-1` e esquecer `scheme-2`/`scheme-3`
(o header/rodapé pode usar outro esquema depois do F1 design-tokens); usar
nome de fonte que não existe na Shopify Fonts library (o `font_picker` do
editor de temas é a forma segura de pegar o id certo); esquecer que
`--color-*`/`--cor-*` são **aliases legados** apontando para os tokens novos
— não declare cor fixa neles, edite sempre os 16 campos de `color_schemes`.

## b. Criar uma section nova

**Quando usar:** o cliente pede um bloco de conteúdo que nenhuma section
existente cobre (ex.: "FAQ", "depoimentos", "grid de logos de marcas").

**Arquivos a tocar:** `sections/<nome>.liquid` (novo),
`locales/en.default.schema.json` (labels do editor), `locales/en.default.json`
(textos visíveis, se houver algum texto fixo fora dos settings),
`templates/<algum>.json` (se for adicionar no template em vez de deixar só
como preset).

**Passos** (exemplo: `sections/faq.liquid`):
1. Crie o arquivo com cabeçalho de comentário PT (siga o padrão das sections
   existentes: O QUE FAZ / ONDE É USADA / PRINCIPAIS PARTES / OBSERVAÇÕES —
   veja `sections/rich-text.liquid` como referência mais simples).
2. Marque no wrapper a classe de esquema de cor, se a section tiver fundo
   próprio: `class="color-{{ section.settings.color_scheme }}"` com o
   setting `color_scheme` (`type: "color_scheme"`, `default: "scheme-1"`) —
   padrão usado hoje em `sections/footer.liquid`, `rich-text.liquid` e
   `image-banner.liquid` (testado por `tests/static/section-color-scheme.test.mjs`,
   CS-06/CS-07). Veja o esqueleto completo logo abaixo.
3. Classes Tailwind com os tokens shadcn primeiro (`bg-background`,
   `text-foreground`, `bg-card text-card-foreground`, `border-border`,
   `rounded-lg`, `gap-6`...; ver `src/tailwind.css` para a lista completa).
   Só o que essas classes não expressam vai em `{% stylesheet %}` (nunca hex
   fixo) — ordem completa e exemplos em
   `docs/knowledge/03-identidade-visual.md` seção 6.
4. Todo texto visível passa por `| t` com chave em
   `locales/en.default.json` (nunca string fixa em português ou inglês
   direto no `.liquid`).
5. Escreva o `{% schema %}` com `name` e labels de settings/blocks como
   `"t:sections.faq.name"`, `"t:sections.faq.settings.heading.label"` etc.
   (nunca string literal no `name`/`label` do schema — sempre `t:`).
6. Adicione o preset:
   ```json
   "presets": [{ "name": "t:sections.faq.name" }]
   ```
   para a section aparecer em "Add section" no editor.
7. Preencha as chaves em `locales/en.default.schema.json`, seguindo o
   formato de uma section existente, ex. (baseado em
   `sections.rich_text` já presente no arquivo):
   ```json
   "sections": {
     "faq": {
       "name": "FAQ",
       "settings": { "heading": { "label": "Heading" } },
       "blocks": {
         "question": {
           "name": "Question",
           "settings": {
             "question": { "label": "Question" },
             "answer": { "label": "Answer" }
           }
         }
       }
     }
   }
   ```
8. Renderize snippets existentes em vez de duplicar lógica
   (`{% render 'icon', name: '...' %}`, `{% render 'price', ... %}` etc.) —
   nunca use `{% include %}`.
9. Se a section deve nascer já visível numa página, adicione uma entrada em
   `templates/<template>.json` (`sections`, `order`); se for só reutilizável
   pelo editor, o preset do passo 6 já basta.
10. Rode os gates (ver seção g).

**Esqueleto mínimo copy-paste** (color_scheme + blocks + presets + `t:`,
padrão de `sections/footer.liquid` — troque `example`/`item` pelo nome real):

```liquid
<div class="example color-{{ section.settings.color_scheme }} bg-background text-foreground">
  {%- for block in section.blocks -%}
    <div class="example__item" {{ block.shopify_attributes }}>
      <p>{{ block.settings.text | escape }}</p>
    </div>
  {%- endfor -%}
</div>

{% schema %}
{
  "name": "t:sections.example.name",
  "tag": "section",
  "settings": [
    { "type": "color_scheme", "id": "color_scheme", "default": "scheme-1", "label": "t:sections.example.settings.color_scheme.label" }
  ],
  "blocks": [
    {
      "type": "item",
      "name": "t:sections.example.blocks.item.name",
      "settings": [
        { "type": "text", "id": "text", "default": "Text", "label": "t:sections.example.blocks.item.settings.text.label" }
      ]
    }
  ],
  "presets": [
    { "name": "t:sections.example.name", "blocks": [{ "type": "item" }] }
  ]
}
{% endschema %}
```

**Como verificar:** `npm run check && npm run lint:liquid && npm run
test:static`; depois `npm run dev` e adicione a section pelo editor numa
página de teste; confirme que o `theme check` não acusa `MissingTemplate`,
`TranslationKeyExists`/`UnusedAssign` etc.

**Erros comuns:** esquecer o `t:` no `name` do schema (aparece a chave crua
no editor); esquecer de adicionar a chave correspondente em
`en.default.schema.json` (o editor mostra a chave literal, ex.
`t:sections.faq.name`, em vez do texto); usar `image_url` sem `widths`/`sizes`
em imagens grandes (penaliza LCP/CLS); section sem preset nem entrada em
template (fica órfã, inacessível pelo editor).

## c. Adicionar um block a uma section existente (ex.: main-product)

**Quando usar:** cliente quer um novo tipo de conteúdo dentro de uma section
que já existe (ex.: bloco de "selo de garantia" na página de produto).

**Arquivos a tocar:** `sections/main-product.liquid`,
`locales/en.default.schema.json`, `templates/product.json` (se quiser que o
bloco já venha por padrão).

**Passos:**
1. No `{% schema %}` de `sections/main-product.liquid`, adicione um objeto em
   `"blocks"`, ex.:
   ```json
   {
     "type": "guarantee",
     "name": "t:sections.main_product.blocks.guarantee.name",
     "limit": 1,
     "settings": [
       { "type": "text", "id": "guarantee_text", "label": "t:sections.main_product.blocks.guarantee.settings.guarantee_text.label" }
     ]
   }
   ```
2. No corpo da section, dentro do `{%- for block in section.blocks -%}` /
   `{%- case block.type -%}` existente, adicione
   `{%- when 'guarantee' -%}` com o HTML, incluindo sempre
   `{{ block.shopify_attributes }}` no elemento raiz do bloco (necessário
   para o editor destacar/editar o bloco corretamente).
3. Adicione as chaves em `locales/en.default.schema.json` sob
   `sections.main_product.blocks.guarantee`.
4. Opcional: adicione o bloco em `templates/product.json`
   (`blocks` + `block_order`) para já vir habilitado por padrão em lojas
   novas — não é obrigatório, o lojista pode adicionar pelo editor.
5. Se o bloco precisa de JS (ex.: abrir um `<details>`), prefira HTML nativo
   (`<details>`/`<dialog>`) a escrever JS novo.

**Como verificar:** gates de G1 + `npm run dev`, adicionar o bloco pelo
editor na página de um produto e conferir que aparece/edita corretamente
(inclusive reordenar blocks, que depende do `shopify_attributes`).

**Erros comuns:** esquecer `shopify_attributes` (bloco não fica clicável no
editor); usar um `type` de block já usado por outra section sem problema
(blocks são escopados por section, não há conflito entre sections
diferentes); esquecer `limit` quando o bloco só faz sentido uma vez.

## d. Montar/alterar a home a partir de um briefing

**Quando usar:** cliente manda um briefing tipo "hero grande, depois 3
coleções em destaque, depois texto sobre a marca, depois newsletter".

**Arquivos a tocar:** `templates/index.json` (único arquivo necessário —
não crie sections novas se as existentes já cobrem o briefing).

**Passos:**
1. Mapeie cada bloco do briefing para uma section existente com preset:
   `image-banner` (hero), `featured-collection` (vitrine de 1 coleção),
   `collection-list` (grade de N coleções), `rich-text` (texto/CTA
   centralizado), `related-products` só faz sentido em produto — não é
   section de home.
2. Edite `templates/index.json`: cada entrada de `"sections"` tem uma chave
   livre (ex. `"hero"`, `"featured"`) e `"order"` define a sequência
   exibida. Exemplo (o arquivo já tem `hero` + `featured`; para inserir uma
   seção de texto entre eles):
   ```json
   {
     "sections": {
       "hero": { "type": "image-banner", "blocks": { "...": {} }, "block_order": ["..."], "settings": { "height": "large", "text_alignment": "center" } },
       "brand": { "type": "rich-text", "blocks": { "heading": { "type": "heading", "settings": { "heading": "About us" } } }, "block_order": ["heading"] },
       "featured": { "type": "featured-collection", "settings": { "heading": "Featured collection", "collection": "all", "products_to_show": 4, "columns_desktop": 4 } }
     },
     "order": ["hero", "brand", "featured"]
   }
   ```
3. Para settings de tipo `collection`, use o `handle` real da coleção da loja
   (ex. `"collection": "novidades"`), não invente um handle — confirme no
   admin ou via `npx shopify theme console` (`collections['handle'].title`).
4. Só crie uma section nova (**receita b**) se nenhuma combinação de sections
   + blocks existentes cobre o pedido do briefing; se a section já existe mas
   falta um tipo de conteúdo dentro dela, é um block novo (**receita c**), não
   uma section nova. Árvore de decisão completa em
   `.claude/skills/customize-theme/SKILL.md`, seção "Fluxo".

**Como verificar:** `npm run check && npm run test:static`, depois
`npm run dev` e abrir a home no editor de temas para o cliente revisar
visualmente (ordem, textos, imagens).

**Erros comuns:** usar `"type"` de section que não existe em `sections/`
(quebra o template); esquecer `block_order` ao definir `blocks` (blocks sem
ordem não aparecem); repetir uma chave de section (`"hero"` duas vezes) —
tem que ser única dentro do `"sections"` object.

## e. Adaptar um componente React/Tailwind/shadcn para Liquid

**Quando usar:** cliente manda um componente de referência (ex. de um site
Next.js/shadcn) e pede "fica assim no nosso site".

**Contexto importante deste tema:** os tokens de cor têm os **mesmos nomes**
do shadcn/ui (`bg-primary`, `text-muted-foreground`, `bg-card`,
`border-border`, `rounded-lg`, etc. — ver `src/tailwind.css` e
`.specs/features/design-tokens/design.md`), então classes shadcn quase
sempre funcionam copiando o `className` quase 1:1. Mas o Tailwind está
configurado **sem preflight** (`@import "tailwindcss/utilities.css"` sem
`base`/preflight — ver comentário em `src/tailwind.css`), porque o tema já
tem reset próprio em `assets/normalizar.css` + `assets/base.css`. Antes de
portar, confira se esses dois arquivos já cobrem o elemento (`button`,
`input`, `h1`..`h6`) — se cobrirem, pode sobrar estilo herdado que o
componente de referência não esperava (compare visualmente).

**Tabela de tradução:**

| React/Tailwind/shadcn | Liquid neste tema |
| --- | --- |
| `className="bg-primary text-primary-foreground rounded-lg"` | `class="bg-primary text-primary-foreground rounded-lg"` (tokens já existem, copiar direto) |
| Props do componente (`title`, `imageUrl`, `ctaLabel`...) | Settings/blocks no `{% schema %}` da section (ex. `{ "type": "text", "id": "heading" }`) |
| `.map(item => <Card key={item.id} .../>)` | `{% for item in collection %}` ... `{% endfor %}` (sections/blocks já são loops nativos: `for block in section.blocks`, `for product in collection.products`) |
| `useState` para abrir/fechar, tabs, toggle simples | Preferir HTML nativo com estado no próprio DOM: `<details>`/`<summary>` para toggle, ou um `<script>` mínimo tipo `snippets/product-variant-selection.liquid`/`sections/nav.liquid` (querySelector + toggle de classe/atributo, sem framework) |
| `next/image` | `image_url: width: N \| image_tag: loading:, widths:, sizes:, alt:` — para a imagem de maior prioridade visual (hero/LCP) use `loading: 'eager', fetchpriority: 'high'` (ver `sections/image-banner.liquid`); para o resto, `loading: 'lazy'` (ver `snippets/card-product.liquid`) |
| `<Dialog>` / `<Sheet>` (Radix/shadcn) | `<dialog>` nativo (`showModal()`/`close()` via um `<script>` pequeno) — sem lib nova |
| `<Accordion>` | `<details><summary>...</summary>...</details>` nativo, estiliza com CSS/Tailwind |
| `<Select>` (shadcn, custom) | `<select>` nativo estilizado — não porte um combobox custom sem necessidade real |
| `cn(...)` / `cva(...)` (classe condicional) | `{% if %}`/`{% case %}` Liquid montando a string de classes, ou 2-3 classes fixas + uma condicional simples inline: `class="button{% if block.settings.style == 'secondary' %} button--secondary{% endif %}"` |
| Ícones SVG inline no componente | `{% render 'icon', name: '...' %}` se o ícone já existir em `snippets/icon.liquid`; senão adicione um `{%- when 'nome' -%}` novo lá |
| Preço formatado (`Intl.NumberFormat`) | `{% render 'price', product: ..., use_variant: ..., show_compare: ... %}` |

**Passos:**
1. Identifique se o componente vira uma **section nova** (receita b), um
   **block** de uma section existente (receita c) ou só um **snippet**
   (parcial sem schema, chamado de dentro de uma section).
2. Traduza o JSX linha a linha usando a tabela acima.
3. Troque toda cor/spacing "mágico" do componente de referência pelos tokens
   do tema (`bg-primary`, não `bg-[#171717]`); se o componente usa uma cor
   que não existe nos 16 tokens, decida com o cliente qual token shadcn ela
   mais se aproxima em vez de criar uma cor solta.
4. Texto vira `| t` + chave em `locales/`; nunca deixe texto em inglês fixo
   vindo do componente de referência.
5. Rode `npm run build:css` sempre que usar uma classe Tailwind nova (o
   scanner do Tailwind lê `layout/`, `sections/`, `snippets/`, `blocks/`,
   `templates/` — ver `@source` em `src/tailwind.css`); classes montadas
   dinamicamente por settings (ex. concatenando uma cor escolhida no editor)
   precisam entrar na safelist `@source inline(...)` do mesmo arquivo, senão
   o Tailwind não as gera.

**Como verificar:** `npm run build:css`, gates de G1, `npm run dev` e
comparar lado a lado com o componente de referência (light/dark scheme).

**Erros comuns:** copiar `className` com utilitário Tailwind que depende de
`@tailwindcss/forms`/plugin não instalado neste projeto; usar `useState`
mental (esperar re-render reativo) num template server-rendered — o Liquid
não tem estado de componente, cada interação client-side precisa de JS
explícito ou de um elemento nativo com estado próprio (`<details>`,
`<dialog>`, `<input type="checkbox">`).

## f. Adicionar um idioma (pt-BR) e traduzir textos

**Quando usar:** loja vai atender clientes em português.

**Escopo dos dois pares de arquivo** (não confunda um com o outro):
- `locales/en.default.json` / `locales/pt-BR.json` — **strings visíveis pro
  cliente** na loja (botões, mensagens, labels de formulário) — todo `| t`
  usado em `.liquid` fora de `{% schema %}` busca a chave aqui.
- `locales/en.default.schema.json` / `locales/pt-BR.schema.json` — **labels
  do editor de temas** (o `name`/`label`/`info` de settings e blocks dentro
  de `{% schema %}`, visto só por quem customiza a loja no admin, nunca pelo
  cliente final).
- `pt-BR.json` tem que espelhar exatamente as chaves de `en.default.json`
  (mesma estrutura aninhada, só valores traduzidos) — mesma regra entre
  `pt-BR.schema.json` e `en.default.schema.json`. Toda chave `t:` nova
  (receitas b/c) precisa existir nos **dois arquivos de schema**; se só
  existir no idioma padrão, o Shopify usa o inglês como fallback silencioso
  em vez de dar erro — o `theme check` não pega chave faltando em `pt-BR.*`.

**Arquivos a tocar:** `locales/pt-BR.json` (novo), `locales/pt-BR.schema.json`
(novo) — não edite `en.default.json`/`en.default.schema.json` para isso
(eles continuam sendo o idioma padrão/fallback).

**Passos:**
1. Copie `locales/en.default.json` para `locales/pt-BR.json` e traduza todos
   os valores (não as chaves).
2. Copie `locales/en.default.schema.json` para `locales/pt-BR.schema.json` e
   traduza os `name`/`label`/`info`/`content` (labels do editor de temas).
3. Não marque `pt-BR.json` como `"default"` no nome do arquivo — só o
   arquivo `en.default.*` é o idioma padrão da loja; `pt-BR` fica como
   idioma adicional (o lojista habilita em Admin → Settings → Languages,
   depois de o tema estar publicado com o arquivo presente).
4. Se adicionar uma section/setting nova depois (receitas b/c), replique a
   chave em **ambos** os arquivos de schema (`en.default.schema.json` e
   `pt-BR.schema.json`) — o `theme check` não obriga isso, mas o editor cai
   pro inglês silenciosamente se faltar a chave em `pt-BR.schema.json`.

**Como verificar:** `npm run check` (Theme Check valida estrutura de JSON de
locale); `npm run dev` e trocar o idioma da loja/preview para conferir que os
textos aparecem em português (inclusive labels do editor).

**Erros comuns:** traduzir só `en.default.json` e esquecer
`*.schema.json` (editor continua em inglês); quebrar a estrutura de chaves
aninhadas (a estrutura de `pt-BR.json` tem que espelhar exatamente a de
`en.default.json`, só os valores mudam); usar `pt_BR` com underscore em vez
de `pt-BR` com hífen (Shopify usa códigos IETF com hífen).

## g. Rodar e depurar localmente

**Quando usar:** sempre, antes de considerar qualquer tarefa pronta.

**Passos:**
1. **Setup:** copie `.env.example` para `.env` e preencha `SHOPIFY_STORE`
   (domínio `.myshopify.com` de uma dev store); `SHOPIFY_CLI_THEME_TOKEN` e
   `SHOPIFY_STOREFRONT_PASSWORD` são opcionais localmente (usados em CI ou se
   a dev store tiver senha de vitrine).
2. **Dev com CSS ao vivo:** `npm run dev` (roda `watch:css` +
   `shopify theme dev` juntos via `concurrently`) — abre preview local
   apontando pra dev store, com hot reload de Liquid e rebuild automático de
   `assets/tailwind.css` a cada mudança em `src/tailwind.css`/classes usadas.
   Se só quiser o preview sem watch de CSS: `npx shopify theme dev --store
   SUA-LOJA.myshopify.com`.
3. **Theme Check (lint oficial Shopify):** `npm run check` — roda
   `shopify theme check --fail-level error` com a config de
   `.theme-check.yml` (`extends: theme-check:recommended`). Erros de
   sintaxe Liquid e boas práticas (setting não usado, tradução faltando,
   `{% include %}` proibido pela convenção do projeto etc.) aparecem aqui.
4. **Lint próprio:** `npm run lint:liquid` — só garante que `| t` dentro de
   `<script>` termina em `| json` (`scripts/lint-liquid.mjs`), regra que o
   Theme Check não cobre.
5. **Testes estáticos:** `npm run test:static` — `node --test
   tests/static/*.test.mjs`, sem precisar de dev store (valida shape de
   `settings_schema.json`/`settings_data.json`, ordem de tags no layout,
   scripts do `package.json`, EOL LF, etc.).
6. **Testes e2e (Playwright):** `npm run test:e2e` — sobe
   `shopify theme dev` de verdade (via `webServer` do `playwright.config.ts`,
   porta 9292) e roda os specs de `tests/e2e/` (carrinho, preço, mídia de
   produto, seleção de variante, escala tipográfica, smoke test). Exige
   `SHOPIFY_STORE` válido no `.env`; falha cedo se não tiver produto
   compatível na dev store (ver `tests/e2e/fixtures.ts` — nunca faz skip
   silencioso).
7. **Avaliar Liquid isoladamente (sem editar arquivo):** `npx shopify theme
   console --store SUA-LOJA.myshopify.com` abre um REPL que avalia
   expressões Liquid **sem** os delimitadores `{{ }}`/`{% %}` — ex. digitar
   `product.title` ou `collections['handle'].title` direto no prompt. Útil
   para confirmar um handle de coleção, checar um objeto (`settings.radius`,
   `shop.enabled_payment_types`) ou testar um filtro antes de colocar no
   `.liquid`.
8. **Depuração visual rápida:** `{{ variavel | json }}` temporário no
   `.liquid` para inspecionar um objeto no HTML renderizado (remova antes de
   finalizar — o `lint:liquid`/`theme check` não pegam isso automaticamente
   fora de `<script>`).

**Ordem recomendada antes de entregar uma tarefa:**
`npm run build:css` (se mexeu em CSS/Tailwind) → `npm run check` →
`npm run lint:liquid` → `npm run test:static` → `npm run dev` (checagem
visual) → `npm run test:e2e` (se a mudança afeta comportamento renderizado).

**Erros comuns:** rodar `test:e2e` sem `SHOPIFY_STORE` no `.env` (falha
imediata, de propósito — ver `playwright.config.ts`); deixar a porta 9292
ocupada por um `theme dev` anterior (o Playwright reusa servidor existente
via `reuseExistingServer: true`, então normalmente não é problema, mas se o
processo antigo travou, mate-o antes); rodar `shopify theme push` sem pedido
explícito do usuário (proibido por `CLAUDE.md`).
