// E2E-01, E2E-03: o harness sobe o `theme dev` e a home responde.
import { test, expect } from '@playwright/test';

test('E2E-03: GET / responde 200 e contém main#MainContent', async ({ page }) => {
  const response = await page.goto('/');
  expect(response, 'sem resposta para /').not.toBeNull();
  expect(response!.status()).toBe(200);
  await expect(page.locator('main#MainContent')).toHaveCount(1);
});
