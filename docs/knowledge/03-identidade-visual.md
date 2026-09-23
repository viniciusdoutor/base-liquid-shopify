# Identidade visual — tokens de cor, tipografia e Tailwind

Doc de referência rápida para um agente que vai trocar cores, fontes ou
radius deste tema, ou portar um componente shadcn/ui. Leia primeiro
`CLAUDE.md` e `docs/knowledge/01-mapa-do-tema.md`. Passo a passo operacional
(trocar identidade sem tocar CSS, criar section nova) está em
`docs/knowledge/04-receitas.md`; copy/CRO em `docs/knowledge/05-ecommerce-e-copy-ptbr.md`
— este doc não repete aquele conteúdo, só explica **como o sistema de design
funciona por baixo**.

Fonte de verdade do desenho: `.specs/features/design-tokens/design.md` e
`spec.md` (feature F1, tokens shadcn). Se algo aqui divergir do código, o
código e esses specs ganham.

## 1. Como o sistema funciona

```
config/settings_schema.json                  config/settings_data.json
  color_scheme_group "color_schemes"            current.color_schemes
  (16 campos color + role map)      ─┐          scheme-1 / scheme-2 / scheme-3
  range "radius"                     │──────────────┐
                                      ▼              ▼
                        snippets/css-variables.liquid   (runtime, Liquid, todo request)
                        for scheme in settings.color_schemes:
                          [:root,] .color-<id> {
                            --background; --foreground; --card; --primary; ...
                            --color-background: var(--background);  ← alias legado
                            ...
                          }
                        :root { --radius; --sale; --font-*; --f0..--f8; ... }
                                      │
                                      ▼
                        src/tailwind.css   (build time, npm run build:css)
                        @theme inline {
                          --color-primary: var(--primary);
                          --radius-lg: var(--radius); ...
                        }
                                      │
                                      ▼
                        assets/tailwind.css  (compilado, COMMITADO no git)
                        .bg-primary { background-color: var(--primary); }
                        .rounded-lg { border-radius: var(--radius-lg); }
                                      │
                                      ▼
                        layout/theme.liquid carrega tailwind.css no <head>
                        → classes bg-primary/text-foreground/rounded-lg
                          funcionam em qualquer .liquid do tema
```

**Por que `@theme inline`, e não o modo padrão do Tailwind v4:** em modo
normal, `--color-primary` seria resolvido para o valor de `--primary` no
momento em que o Tailwind gera o CSS (build time) e ficaria fixo nesse valor.
Com `inline`, a utility gerada emite `background-color: var(--primary)`
literalmente — a resolução acontece no navegador, em runtime. Isso é o que
permite uma section com `class="color-scheme-2"` reescopar `bg-primary` para
a cor do esquema 2 sem recompilar nada.

**Por que os aliases legados (`--color-*`, `--cor-*`) são redeclarados dentro
de CADA bloco `.color-<id>`, e não só em `:root`:** uma custom property CSS
que guarda `var(--x)` é calculada no momento/escopo em que foi *declarada*,
não em que é *usada*. Se `--color-text: var(--foreground)` existisse só em
`:root`, ela congelaria no valor de `--foreground` do scheme-1 para sempre —
mesmo dentro de um wrapper `.color-scheme-2`. Declarando o alias de novo
dentro de `.color-scheme-2 { ... }`, ele herda o `--foreground` daquele
escopo. Nunca remova essa duplicação sem migrar as ~99 referências legadas
primeiro (seção 4).

## 2. Tabela de tokens

| Token CSS | Campo no editor (`color_schemes.*.settings`) | Classe Tailwind | Uso típico em loja |
| --- | --- | --- | --- |
| `--background` | `background` | `bg-background` | Fundo da página/section |
| `--foreground` | `foreground` | `text-foreground` | Texto principal |
| `--card` / `--card-foreground` | `card` / `card_foreground` | `bg-card text-card-foreground` | Card de produto, box de conteúdo destacado |
| `--popover` / `--popover-foreground` | (= `card` / `card_foreground`, ver A-05) | `bg-popover` | Dropdown, tooltip, menu flutuante |
| `--primary` / `--primary-foreground` | `primary` / `primary_foreground` | `bg-primary text-primary-foreground` | Botão de comprar, CTA principal, link de destaque |
| `--secondary` / `--secondary-foreground` | `secondary` / `secondary_foreground` | `bg-secondary text-secondary-foreground` | Botão secundário ("Adicionar ao carrinho" quando "Comprar agora" é o primary) |
| `--muted` / `--muted-foreground` | `muted` / `muted_foreground` | `bg-muted text-muted-foreground` | Faixas de fundo neutras (benefícios, newsletter), texto auxiliar/legenda |
| `--accent` / `--accent-foreground` | `accent` / `accent_foreground` | `bg-accent text-accent-foreground` | Hover de item de menu, item selecionado, destaque leve |
| `--destructive` | `destructive` | `bg-destructive text-white`, `text-destructive` | Erro de formulário, badge "esgotado", mensagem de remoção |
| `--border` | `border` | `border-border` | Bordas de card, input, divisórias |
| `--input` | `input` | `border-input` (em campos de formulário) | Borda de `<input>`/`<select>` |
| `--ring` | `ring` | `ring-ring` | Anel de foco (acessibilidade de teclado) |
| `--sale` | `color_sale` (setting global, fora do grupo de esquemas) | `bg-sale`, `text-sale` | Preço promocional, badge de desconto/Pix |
| `--radius` | `radius` (setting global) | base de `rounded-sm/md/lg/xl` | Raio de borda geral do tema |

`primary`/`secondary`/`muted`/`accent` sempre vêm em par com seu
`*-foreground` — nunca use um sem o outro (ver princípios, seção 9).

## 3. Esquemas padrão e onde `color_scheme` já existe

Três esquemas em `config/settings_data.json` → `current.color_schemes`:

- **scheme-1** (claro): `background #ffffff` / `foreground #0a0a0a` — padrão do `:root`, usado quando nenhuma section define esquema próprio.
- **scheme-2** (escuro): `background #0a0a0a` / `foreground #fafafa`.
- **scheme-3** (inverso): `background #171717` / `foreground #fafafa` — mesmo texto claro do scheme-2, fundo um degrau mais claro; útil para uma faixa que precisa destacar sem ser tão escura quanto o scheme-2.

Uma section escolhe esquema com o setting `type: "color_scheme"` e aplica a
classe no wrapper:

```liquid
<footer class="footer color-{{ section.settings.color_scheme }}">
```

Hoje (confira no código antes de reusar o padrão, pode mudar):
`sections/footer.liquid`, `sections/rich-text.liquid` e
`sections/image-banner.liquid` têm o setting `color_scheme` (default
`scheme-1`). Sections sem esse setting herdam o esquema do `:root`
(scheme-1) — se uma section nova precisar de fundo próprio, adicione o
mesmo padrão de setting + classe, não fixe uma cor no schema.

O grupo `color_scheme_group` também define `role` (mapa de papel semântico →
campo, usado pelo editor de temas do Shopify para pré-visualizar
combinações): `background.solid` → `background`, `text` → `foreground`,
`primary_button`/`on_primary_button` → `primary`/`primary_foreground`, etc.
**Nota:** o campo `role.background.gradient` exige um setting do tipo
`color_background` (versão em gradiente do fundo) — esse campo está sendo
adicionado em paralelo em `config/settings_schema.json` (id provável
`background_gradient`). Se você o encontrar já presente, trate-o como a
variante em gradiente do token `--background` daquele esquema; não invente
um token CSS novo para ele sem checar se `design.md`/`spec.md` do F1 foram
atualizados nesse meio tempo.

## 4. Tipografia, radius e variáveis legadas

**Fontes:** `settings.type_header_font` / `settings.type_body_font` (Shopify
`font_picker`) viram `--font-heading-family` / `--font-body-family` em
`css-variables.liquid`, que por sua vez alimentam `--font-heading` /
`--font-sans` no `@theme inline` do Tailwind. Use `font-heading` em
títulos e `font-sans` no resto — nunca hardcode `font-family` num `.liquid`.

O valor do `font_picker` é um handle da Shopify Fonts library, formato
`familia_<n|i><peso>` (`n` = normal, `i` = itálico; peso de 1 a 9, ex. 4 =
regular, 7 = bold) — **não** é o nome legível da fonte. Handles confirmados
na documentação da Shopify Fonts library (verifique novos handles lá antes de
usar; o editor de temas também tem um seletor visual que grava o handle
certo sozinho):
- `assistant_n4` / `assistant_n7` — Assistant regular/bold (default deste
  tema, ver `config/settings_schema.json`).
- `lora_n4` / `lora_n7` — Lora (serifada) regular/bold.
- `playfair_display_n4` — Playfair Display (serifada, display) regular.
- `inter_n4` — Inter regular.
Nunca invente um handle sem confirmar — um handle inexistente faz o editor
cair silenciosamente na fonte padrão do tema.

**Escala fluida:** `--f0` (menor) até `--f8` (maior), cada um um
`clamp(mínimo, calc(...vw...), máximo)` interpolado entre viewport de 375px e
1440px. Use essas variáveis (via CSS custom, não há utilitário Tailwind
dedicado ainda) em vez de `font-size` fixo em px/rem — é o que garante
tamanho de texto consistente entre mobile e desktop sem media query manual.

**Radius:** `settings.radius` (0–24px) vira `--radius`, e o Tailwind deriva
`--radius-sm = radius - 4px`, `--radius-md = radius - 2px`,
`--radius-lg = radius`, `--radius-xl = radius + 4px` — fórmula padrão shadcn
v4. Use `rounded-sm/md/lg/xl`, não um valor de radius fixo. Existem também
`buttons_radius`, `inputs_radius`, `media_radius` **independentes**, em px
puro (não ligados a `--radius`/Tailwind) — são variáveis legadas de CSS
antigo (`--buttons-radius` etc.), mantidas para o CSS pré-F1 que ainda as usa
(a maioria das sections `main-*`, `nav`, `collection-*`, `contact-form`,
`main-cart`, `product-media-gallery`, `localization-form` — confira com
`grep -rl -- "--buttons-radius\|--inputs-radius\|--media-radius" sections/ snippets/`).

**Qual mudar para uma identidade nova:** os dois grupos coexistem e nenhum
substitui o outro hoje — **para uma mudança de radius consistente em todo o
tema, mude os dois**:
- `radius` — não aparece em `config/settings_data.json` por padrão (o schema
  já define `default: 10`); se for mudar, **adicione a chave** em
  `current`/`presets` de `settings_data.json`. Afeta `rounded-sm/md/lg/xl`
  (Tailwind), usado pelas sections mais novas (`footer`, `image-banner`,
  `rich-text` e qualquer section nova que siga o esqueleto de
  `docs/knowledge/04-receitas.md`, receita b).
- `buttons_radius` / `inputs_radius` / `media_radius` — já existem em
  `settings_data.json` (`current`/`presets`), em px puro, e continuam
  alimentando o CSS legado listado acima.

Mudar só um dos dois grupos deixa o tema com dois raios de borda diferentes
(sections novas com um canto, sections legadas com outro) — foi esse o erro
do piloto Aurora Café: mudou `buttons_radius`/`media_radius` e deixou `radius`
no default do schema.

**Variáveis legadas e plano de migração:** `--color-background`,
`--color-text`, `--color-background-contrast`, `--color-text-contrast`,
`--color-accent`, `--color-accent-text`, `--color-border`, `--color-sale`,
`--cor-marca`, `--cor-verde`, `--cor-gelo`, `--cor-cinza` são aliases 1:1 para
os tokens novos (ex.: `--cor-marca: var(--primary)`), mantidos porque ~99
referências no CSS/Liquid de sections antigas ainda os usam (LEG-01/LEG-02 no
spec do F1). **Nunca** atribua uma cor fixa a um alias legado — edite sempre
o token shadcn correspondente em `color_schemes`. O plano de migração (fora
do escopo do F1, é a próxima feature — hoje chamada `ui-primitives` no
`spec.md`) é reescrever as sections antigas para usar classes Tailwind
diretamente e então poder remover os aliases; até lá, trate-os como
somente-leitura.

## 5. Tailwind neste tema

- **Sem preflight:** só as camadas `theme` e `utilities` são importadas em
  `src/tailwind.css` (`@import "tailwindcss/theme.css" layer(theme);` /
  `.../utilities.css" layer(utilities) source(none);`). O reset de CSS vem
  de `assets/normalizar.css` (carregado antes) — o preflight do Tailwind
  conflitaria com ele.
- **`@source` restrito às pastas do tema:** `layout/`, `sections/`,
  `snippets/`, `blocks/`, `templates/` — nada fora disso (nem `docs/`) é
  escaneado, porque `source(none)` desliga a varredura automática do projeto
  inteiro. Isso existe para a *freshness gate* (abaixo) não depender de
  arquivos fora do tema, como prosa em Markdown que por acaso contenha uma
  palavra igual a uma classe (ex. "outline").
- **Safelist:** classes shadcn combinadas com prefixos de cor
  (`{bg,text,border,ring}-{background,foreground,card,...,sale}`) mais
  `rounded-{sm,md,lg,xl}` e `font-{sans,heading}` são forçadas via
  `@source inline(...)`, porque classes montadas dinamicamente a partir de
  uma setting (não aparecem como texto literal num `.liquid`) não são vistas
  pelo scanner do Tailwind.
- **Comandos:** `npm run build:css` compila `src/tailwind.css` →
  `assets/tailwind.css` uma vez; `npm run watch:css` recompila a cada
  mudança; `npm run dev` roda `watch:css` e `shopify theme dev` em paralelo
  (via `concurrently`).
- **`assets/tailwind.css` é commitado no git** e há um teste de freshness
  (`tests/static/tailwind.test.mjs`, requirement TW-05) que builda de novo
  em um diretório temporário e falha se o resultado não bater byte a byte
  com o arquivo commitado. **Nunca edite `assets/tailwind.css` à mão.**
- **Se uma classe não aparece no CSS compilado:** (1) rode
  `npm run build:css` e cheque se você esqueceu — é comum editar um
  `.liquid`, testar no navegador sem rebuildar e achar que "não funciona";
  (2) confira se a classe usa um token que existe na tabela da seção 2 —
  Tailwind só gera utilities para tokens declarados em `@theme inline`;
  (3) se a classe é montada dinamicamente a partir de uma setting (string
  interpolada, não literal no arquivo), adicione o padrão a
  `@source inline(...)` em `src/tailwind.css`; (4) rode
  `npm run test:static` para confirmar que a freshness gate passa antes de
  commitar.

## 6. CSS além das classes Tailwind — ordem de preferência

Quando uma section precisa de um visual que as classes utilitárias não cobrem
(grid com número de colunas dinâmico, animação, etc.), siga esta ordem — **nunca
pule direto para CSS solto com hex fixo**:

1. **Classes Tailwind com os tokens do tema primeiro**: `bg-muted`,
   `text-primary`, `text-primary-foreground`, `rounded-lg`, `gap-6`,
   `grid-cols-4`, `border-border`... (tabela da seção 2 + `src/tailwind.css`
   para a lista completa). Se usar uma classe nova que ainda não existe no
   CSS compilado, rode `npm run build:css` e **commite `assets/tailwind.css`**
   junto (gate TW-05 falha se o compilado não bater com o fonte).
2. **Somente o que as classes não conseguem expressar** vai em
   `{% stylesheet %}` (não `<style>` solto, em section nova) — usando as
   mesmas CSS custom properties dos tokens (`var(--primary)`,
   `var(--muted-foreground)`, `var(--radius)`...), nunca um valor fixo.
   `{% stylesheet %}` não aceita objetos/tags Liquid dentro (ver
   `docs/knowledge/02-liquid-shopify-na-pratica.md`, item 12): para variar por
   setting (ex. número de colunas), passe o valor via CSS custom property
   inline no wrapper (`style="--n: {{ section.settings.columns }};"`) e
   consuma com `var(--n)` no `{% stylesheet %}`. Sections mais antigas do tema
   ainda usam `<style>` simples (pré-datam esta convenção) — não é motivo
   para copiar o padrão numa section nova.
3. **Nunca hex direto** em `class`, `style` ou `{% stylesheet %}`/`<style>` —
   nem para "só uma cor auxiliar"; se o token certo não existe, é sinal de
   que falta um token no design system (avise, não invente um valor solto).

## 7. Ícones (`snippets/icon.liquid`)

Ícones são SVG inline (`stroke="currentColor"`, então herdam a cor do texto —
combine com uma classe `text-*`, nunca `fill`/`stroke` fixo). Nomes
disponíveis hoje (lista completa e atualizada em
`docs/knowledge/01-mapa-do-tema.md`, seção 4):

- **UI**: `search`, `account`, `cart`, `close`, `chevron`, `trash`.
- **Comércio/confiança** (frete, parcelamento, Pix, selos, trocas, contato):
  `truck`, `credit-card`, `pix`, `shield-check`, `refresh`, `gift`, `leaf`,
  `chat`.
- **Social**: `instagram`, `facebook`, `linkedin`.

Precisa de um ícone que não está na lista? Adicione um bloco
`{%- when 'nome' -%}` novo em `snippets/icon.liquid` seguindo o padrão
existente (SVG 24×24, `fill="none"`, `stroke="currentColor"`,
`aria-hidden="true"`, `focusable="false"`) — nunca mapeie um conceito
("Pix", "frete") para um ícone de nome/semântica não relacionada só porque
já existe.

## 8. Como criar uma identidade nova a partir de um briefing ou referência

1. **Reúna as cores de referência.** Se vier de um site React com
   shadcn/tweakcn, normalmente as cores estão em OKLCH (`oklch(L C H)`) num
   bloco `:root`/`.dark`. Converta cada uma para hex com qualquer conversor
   OKLCH → sRGB (ex. `culori`, que já é devDependency do tema — ver
   `A-08`/script `import:theme` no `spec.md` — ou qualquer conversor online).
   Referência de conferência (paleta "neutral" do shadcn):
   `oklch(1 0 0)` = `#ffffff`, `oklch(0.145 0 0)` = `#0a0a0a`,
   `oklch(0.205 0 0)` = `#171717`.
2. **Garanta contraste 4.5:1** entre cada par fundo/texto que vai coexistir
   (`background`/`foreground`, `card`/`card_foreground`,
   `primary`/`primary_foreground`, etc.) — use um checador de contraste
   (WebAIM, ou peça para calcular). Isso é requisito de acessibilidade (WCAG
   AA para texto normal), não só estética.
3. **Preencha os 16 campos por esquema.** Edite
   `config/settings_data.json` → `current.color_schemes.scheme-1/2/3`
   → `settings.*` com os hex convertidos. Não toque em
   `config/settings_schema.json` para isso — a estrutura de campos já
   existe; só o *data* muda. Se o briefing só tiver uma paleta clara, ajuste
   pelo menos `scheme-1`; derive `scheme-2` escurecendo mantendo os mesmos
   pares de contraste, em vez de inventar uma paleta nova do zero.
4. **Fontes e radius:** `type_header_font`/`type_body_font` (nome de fonte
   do Google Fonts/Shopify Fonts library, formato `familia_estiloPeso`) e
   `radius` (px) também em `settings_data.json`.
5. **Rode `npm run dev`** e confira visualmente home, produto e coleção nos
   esquemas usados (footer geralmente usa um esquema diferente do resto).

## 9. Princípios

shadcn/ui aqui é **referência de nomenclatura e proporção**, não um contrato
1:1 — o objetivo é portar componentes React trocando `className` por `class`
sem reescrever CSS, não replicar o visual exato do site de origem.

- Uma cor de destaque (`primary`) por loja — "cor principal" e "cor
  secundária" do briefing viram `accent`/uso pontual, não um segundo `primary`.
- Pares fundo/texto sempre juntos: nunca defina `background` sem revisar
  `foreground`, nem use `bg-primary` com `text-*` que não seja
  `text-primary-foreground`.
- Densidade única por página: use `--spacing-sections` como referência de
  ritmo vertical em vez de misturar section compacta com section "solta".
- Radius consistente: `radius: 0` já propaga para `rounded-sm/md/lg/xl`; não
  fixe `border-radius` manual em paralelo.
- Sem cards dentro de cards (evite `bg-card` aninhado em outro `bg-card`).
- Sem gradiente/glassmorphism em tudo — um elemento de destaque (hero) sim,
  botão + card + header ao mesmo tempo é ruído.
- Desenhe os estados vazio/carregando/erro (carrinho vazio, busca sem
  resultado, produto esgotado, cupom inválido) — fazem parte do fluxo real.

### Errado / Certo

```css
/* Errado: cor fixa direto no CSS — não muda com o esquema nem no editor */
.faixa-beneficios { background-color: #f5f5f5; color: #171717; }
```
```liquid
{# Certo: token shadcn, resolve por esquema e some se o lojista trocar a cor #}
<div class="faixa-beneficios bg-muted text-muted-foreground">
```

```liquid
{# Errado: usa foreground de um par com o background de outro #}
<button class="bg-primary text-secondary-foreground">Comprar</button>
```
```liquid
{# Certo: par completo #}
<button class="bg-primary text-primary-foreground">Comprar</button>
```

```liquid
{# Errado: variável legada usada como se fosse a fonte da verdade #}
<p style="color: var(--cor-verde);">Em promoção</p>
```
```liquid
{# Certo: token novo direto — alias legado é só para CSS antigo que já o usa #}
<p class="text-sale">Em promoção</p>
```

```liquid
{# Errado: radius hardcoded ignora a setting do lojista #}
<div class="produto-card" style="border-radius: 8px;">
```
```liquid
{# Certo: escala derivada de settings.radius #}
<div class="produto-card rounded-lg">
```

```json
// Errado: cor nova só no scheme-1 — footer/section com scheme-2 fica com a paleta antiga
{ "scheme-1": { "settings": { "primary": "#ff0000" } } }
```
```json
// Certo: atualizar o mesmo campo em todos os esquemas usados no tema
{
  "scheme-1": { "settings": { "primary": "#ff0000", "primary_foreground": "#ffffff" } },
  "scheme-2": { "settings": { "primary": "#ff6b6b", "primary_foreground": "#171717" } }
}
```

```liquid
{# Errado: classe montada por interpolação sem estar na safelist — some no build #}
<div class="bg-{{ section.settings.tom }}-500">
```
```liquid
{# Certo: mapear para um token existente, ou adicionar o padrão a @source inline(...) #}
<div class="bg-{{ section.settings.tom }}"> {# ex.: tom = "primary" | "muted" | "accent" #}
```
