// BUG-05: o carrinho monta a URL da Cart AJAX API a partir de
// window.Shopify.routes.root, em vez de um caminho fixo '/cart/add.js'.
import { test, expect } from '@playwright/test';
import { findProduct } from './fixtures';

const hasAnyProduct = () => true;

test('BUG-05: add-to-cart usa Shopify.routes.root para montar a URL', async ({ page, request }) => {
  const product = await findProduct(request, hasAnyProduct, 'Fixture ausente: produto');

  const seenUrls: string[] = [];
  await page.route('**/cart/add.js', async (route) => {
    seenUrls.push(new URL(route.request().url()).pathname);
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto(`/products/${product.handle}`);
  await page.evaluate(() => {
    (window as any).Shopify = (window as any).Shopify || {};
    (window as any).Shopify.routes = { root: '/xx-test/' };
  });

  const addButton = page.locator('.product__add-to-cart');
  await addButton.click();

  await expect.poll(() => seenUrls.length, { timeout: 15_000 }).toBeGreaterThan(0);
  expect(seenUrls[0]).toBe('/xx-test/cart/add.js');
});
