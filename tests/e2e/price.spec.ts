// BUG-01, E2E-06: o preço "a partir de" do card sai formatado pelo filtro money.
import { test, expect } from '@playwright/test';
import { findProduct, hasVariablePrices, FIXTURE_VARIABLE_PRICES } from './fixtures';

// Regex para o valor em centavos formatado como dinheiro (ex.: 995 -> "9,95" ou "9.95";
// 262995 -> "2.629,95" / "2,629.95"), independente do símbolo da moeda.
function moneyPattern(cents: number): RegExp {
  const major = String(Math.floor(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '[.,\\s]?');
  const minor = String(cents % 100).padStart(2, '0');
  return new RegExp(`(^|[^\\d])${major}[.,]${minor}(?!\\d)`);
}

test('BUG-01: card de produto com preços variáveis mostra price_min formatado, não os centavos crus', async ({ page, request }) => {
  const product = await findProduct(request, hasVariablePrices, FIXTURE_VARIABLE_PRICES);
  const js = await (await request.get(`/products/${product.handle}.js`)).json();
  const priceMin: number = js.price_min;
  expect(Number.isInteger(priceMin), 'price_min deve vir em centavos').toBe(true);

  await page.goto('/collections/all');
  const card = page.locator('.card-product', { has: page.locator(`a[href*="/products/${product.handle}"]`) }).first();
  const priceText = (await card.locator('.price').innerText()).trim();

  expect(priceText).toMatch(moneyPattern(priceMin));
  expect(priceText).not.toContain(String(priceMin));
});
