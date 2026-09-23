// BUG-04 (regressão): trocar de opção atualiza o input.product-variant-id
// para a variante correspondente e não emite nenhum pageerror.
import { test, expect } from '@playwright/test';
import { findProduct } from './fixtures';

const hasMultipleVariants = (p: { variants: unknown[] }) => p.variants.length >= 2;
const FIXTURE_MULTIPLE_VARIANTS = 'Fixture ausente: produto com 2+ variantes';

test('BUG-04: trocar de variante atualiza o id e não gera pageerror', async ({ page, request }) => {
  const product = await findProduct(request, hasMultipleVariants, FIXTURE_MULTIPLE_VARIANTS);
  const productJson = await (await request.get(`/products/${product.handle}.js`)).json();
  const variants: { id: number; option1: string }[] = productJson.variants;

  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto(`/products/${product.handle}`);

  const idInput = page.locator('input.product-variant-id');
  const initialId = await idInput.inputValue();
  const target = variants.find((v) => String(v.id) !== initialId);
  expect(target, 'produto deveria ter uma variante diferente da inicial').toBeTruthy();

  const option = page.locator(`.product__option input[type="radio"][value="${target!.option1}"]`);
  await option.first().check({ force: true });

  await expect(idInput).toHaveValue(String(target!.id));
  expect(pageErrors, `pageerrors: ${pageErrors.map((e) => e.message).join('; ')}`).toHaveLength(0);
});
