// BUG-02, BUG-03: a primeira mídia da galeria carrega eager + fetchpriority alto; as demais, lazy.
import { test, expect } from '@playwright/test';
import { findProduct, hasTwoOrMoreImages, FIXTURE_TWO_IMAGES } from './fixtures';

test('BUG-02: primeira imagem da galeria carrega eager com fetchpriority high', async ({ page, request }) => {
  const product = await findProduct(request, hasTwoOrMoreImages, FIXTURE_TWO_IMAGES);

  await page.goto(`/products/${product.handle}`);
  const images = page.locator('.product__media-item img');
  const count = await images.count();
  expect(count, 'produto deveria ter 2+ imagens de mídia renderizadas').toBeGreaterThanOrEqual(2);

  const first = images.first();
  await expect(first).toHaveAttribute('loading', 'eager');
  await expect(first).toHaveAttribute('fetchpriority', 'high');
});

test('BUG-03: demais imagens da galeria carregam lazy sem fetchpriority high', async ({ page, request }) => {
  const product = await findProduct(request, hasTwoOrMoreImages, FIXTURE_TWO_IMAGES);

  await page.goto(`/products/${product.handle}`);
  const images = page.locator('.product__media-item img');
  const count = await images.count();
  expect(count, 'produto deveria ter 2+ imagens de mídia renderizadas').toBeGreaterThanOrEqual(2);

  for (let i = 1; i < count; i++) {
    const media = images.nth(i);
    await expect(media).toHaveAttribute('loading', 'lazy');
    const fetchpriority = await media.getAttribute('fetchpriority');
    expect(fetchpriority).not.toBe('high');
  }
});
