# E-commerce e copy PT-BR

Guia de negócio/UX/copy para agentes de IA customizando este tema para clientes de e-commerce brasileiros. Fatos de plataforma (Shopify) citam `shopify.dev`; recomendações de CRO/copy são heurísticas de usabilidade (estilo Baymard) e boas práticas de mercado — aplique com bom senso ao contexto do cliente, nunca como regra absoluta.

## Checklist de CRO por página

### Home (o que verificar, o porquê em meia linha)
1. Proposta de valor clara acima da dobra — decide em segundos se o visitante fica ou sai.
2. Categorias de navegação visíveis, não só busca — nem todo cliente sabe o nome do produto que quer.
3. Prova social (avaliações, selos, "X clientes") perto do topo — reduz ceticismo de quem não conhece a marca.
4. Um CTA principal por seção, sem competir com outros — vários CTAs iguais confundem a prioridade.
5. Frete e prazo comunicados cedo — é a maior dúvida de quem compra pela primeira vez na loja.
6. Busca com autocomplete funcionando de verdade — atalho para quem já sabe o que quer.
7. Fotos reais do produto, não só lifestyle — molda a expectativa e reduz troca/devolução depois.
8. LCP rápido no mobile — maioria do tráfego BR é mobile e abandona página lenta antes de ver a oferta.

### Coleção
1. Poucos filtros, só os relevantes (cor, tamanho, preço) — excesso de filtro paralisa a decisão.
2. Contagem de itens por filtro — cliente evita clicar em filtro que pode zerar o resultado.
3. Ordenação padrão sensata (relevância/mais vendidos) — ordenação ruim esconde os melhores produtos.
4. Preço, nome e variação (cor/tamanho) visíveis no card — permite decidir sem abrir o produto.
5. Paginação/"carregar mais" sem perder a posição do scroll — perder contexto frustra e faz desistir.
6. Estoque baixo/esgotado sinalizado no card — evita clique em produto que não pode comprar.
7. Breadcrumb visível — cliente se perde em navegação profunda por subcategorias.
8. Filtros aplicados visíveis e fáceis de remover — cliente precisa saber o que está filtrando agora.

### Produto
1. Preço e parcelamento visíveis sem rolar a página — parcelamento pesa na decisão de compra no Brasil.
2. Seletor de variante só permite escolher combinação disponível — evita erro descoberto só no fim do fluxo.
3. Galeria com zoom e múltiplos ângulos — reduz a incerteza tátil de não poder tocar o produto.
4. "Comprar agora" e "Adicionar ao carrinho" diferenciados quando ambos existem — evita clique errado.
5. Frete calculável por CEP direto na página do produto — custo/prazo pesa antes mesmo do carrinho.
6. Política de troca/devolução visível na página, não só no rodapé — reduz ansiedade antes da compra.
7. Avaliações com fotos de outros clientes — prova social mais confiável que só uma nota em estrelas.
8. Erro claro ao tentar comprar item esgotado (ver `/cart/add.js` 422 no doc 02) — feedback evita frustração silenciosa.

### Carrinho
1. Resumo de custos transparente (produto + frete + descontos) antes do checkout — "custo surpresa" é a principal causa de abandono.
2. Frete estimado por CEP dentro do próprio carrinho — decide se segue a compra sem esperar o checkout.
3. Editar quantidade/remover item sem recarregar a página — fricção técnica derruba conversão.
4. Botões de checkout acelerado visíveis (Shop Pay etc., ver doc 02) — atalho reduz etapas de digitação.
5. Cross-sell discreto (1-2 itens, não uma vitrine) — carrinho lotado de sugestões distrai do checkout.
6. Mensagem clara se um item ficou indisponível — cliente precisa entender por que não conseguiu avançar.
7. Campo de cupom visível com feedback de sucesso/erro — campo escondido leva o cliente a procurar cupom fora do site.
8. Carrinho persiste entre sessões — quem sai e volta depois não pode perder o progresso.

## Especificidades do Brasil

**Parcelamento ("ou 12x de R$ X sem juros")** — calcule em Liquid preservando os centavos (divisão inteira trunca, ver armadilha #4 do doc 02):
```liquid
{% assign installments = 12 %}
{% assign installment_price = variant.price | times: 1.0 | divided_by: installments %}
{% assign installment_money = installment_price | money %}
{{ 'products.product.installments' | t: count: installments, price: installment_money }}
```
Nunca prometa "sem juros" se a integração de pagamento cobra juros no parcelamento — copy tem que refletir a condição real configurada no checkout.

**Desconto Pix** — mostre o valor com desconto e o percentual, arredondando antes de formatar para evitar sub-centavo:
```liquid
{% assign pix_price = variant.price | times: 0.95 | round %}
{{ pix_price | money }} {{ 'products.product.pix_discount' | t: percent: 5 }}
```
Só anuncie o desconto se ele existir de fato no meio de pagamento configurado — não é um valor "de vitrine".

**Frete por CEP** — a Shopify recomenda o fluxo assíncrono em vez de chamar `shipping_rates.json` direto (sujeito a *throttling*): `POST /cart/prepare_shipping_rates.json` para iniciar o cálculo e `GET /cart/async_shipping_rates.json` (mesmos parâmetros) até parar de retornar vazio.
```js
await fetch(`${root}cart/prepare_shipping_rates.json?shipping_address[zip]=${cep}`, { method: 'POST' });
const rates = await fetch(`${root}cart/async_shipping_rates.json?shipping_address[zip]=${cep}`).then(r => r.json());
```
Ref.: [Cart API reference](https://shopify.dev/docs/api/ajax/reference/cart)

**CDC — arrependimento em 7 dias** — compra feita fora do estabelecimento físico (todo e-commerce) dá direito a arrependimento em até 7 dias corridos após o recebimento (Art. 49, Código de Defesa do Consumidor). Deixe isso explícito na política de trocas — é obrigação legal, não diferencial de marketing.

**Selos de confiança, WhatsApp, trocas** — selos (SSL, Reclame Aqui, "Site Blindado" etc.) perto do CTA de compra ajudam quem não conhece a marca; botão de WhatsApp deve levar a atendimento real, não só decorativo; política de troca deve ser simples de achar e de executar — prometer "troca fácil" e depois exigir um processo burocrático quebra a confiança criada.

**Como mostrar sem mentir**: todo elemento de confiança (parcelamento, desconto, frete, selo, prazo) só entra na página se existir de verdade na configuração da loja/checkout. Copy nunca compensa uma configuração que falta — corrija a configuração.

## Copy PT-BR

**Fórmulas**
- **PAS** (Problema → Agitação → Solução): nomeie a dor, intensifique por que ela importa, apresente o produto como resolução direta.
- **FAB** (Feature → Advantage → Benefit): característica → vantagem técnica → benefício real na vida do cliente.
- **Benefício > característica**:
```
Errado: "Tecido 100% algodão penteado 180g/m²."
Certo:  "Tecido macio que não esquenta no verão — 100% algodão penteado."
```

**Headlines** — comece pelo benefício ou pela dor resolvida, não pelo nome técnico do produto. "Chega de pé dolorido no fim do dia" convence mais que "Tênis com palmilha em gel".

**CTAs** — verbo de ação + resultado, nunca só o verbo genérico:
```
Errado: "Clique aqui" / "Saiba mais" / "Enviar"
Certo:  "Calcular meu frete" / "Ver como funciona" / "Garantir meu desconto"
```

**Microcopy**
- Carrinho vazio: explique o próximo passo, não só "seu carrinho está vazio" — ex. "Seu carrinho está vazio. Que tal começar por aqui?" com link para uma coleção.
- Checkout: cada campo com exemplo de formato (CEP `00000-000`, CPF `000.000.000-00`).
- Erros: diga o que aconteceu e o que fazer — "Esse cupom expirou. Veja as promoções ativas" em vez de "Erro".
- Estados vazios (busca sem resultado, coleção sem produto): sempre ofereça uma saída (sugestão, link, contato), nunca um beco sem saída.

**Prova social** — número real de avaliações, nome/cidade de quem avaliou, foto real quando possível; texto genérico ("ótimo produto") vale menos que um comentário específico.

**Urgência honesta** — mostre contagem real de estoque, prazo real de uma promoção com data de término fixa (que não reseta ao atualizar a página); nunca simule urgência que não existe.

**Não faça**
- Clichês vazios: "oferta imperdível", "não perca essa chance única", "compre agora!!!".
- Falsa escassez: "só restam 2 unidades" quando o estoque real é outro.
- Contador regressivo que reinicia sozinho a cada visita.
- Exageros não sustentáveis: "o melhor do Brasil", "número 1 em qualidade" sem prova.
- Excesso de caixa alta e emoji tentando compensar copy fraca.
- Prometer benefício (frete grátis, parcelamento sem juros, troca grátis) que não está de fato configurado no checkout.

## Princípios de design (referência shadcn)

Usar como inspiração de sistema, não como biblioteca a instalar neste tema Liquid:
- **Tokens em pares fundo/texto** (`background`/`foreground`, `card`/`card-foreground`) — nunca defina uma cor de texto sem já saber sobre qual fundo ela cai.
- **Uma cor de destaque** por vez — se tudo é destaque, nada é; use `accent`/`primary` para a ação principal da tela, o resto em tons neutros.
- **Um sistema de densidade por tipo de página** — listagem (coleção) mais densa, página de produto mais espaçosa; não misture as duas densidades na mesma tela.
- **Radius consistente** — um valor de `--radius` (e suas variações `sm`/`md`/`lg`) usado em todo o tema, nunca arredondamentos aleatórios por componente.
- **Sem cards dentro de cards** — hierarquia visual por espaçamento e tipografia, não por empilhar bordas/sombras.
- **Estados vazio/carregando/erro desenhados de propósito** — cada tela que pode ficar vazia, carregando ou com erro tem um layout pensado para isso, não um texto solto.
- **Ícones discretos e consistentes** — mesmo peso/estilo de ícone em todo o tema; ícone nunca compete visualmente com o conteúdo principal.
- **Composição antes de reinventar** — combine os padrões já existentes no tema (botão, input, card, badge) antes de criar um componente visual novo do zero.
