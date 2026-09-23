// CS-06, CS-07: rendered footer wrapper carries its color_scheme setting as a class, and the
// css-variables <style> block always emits a .color-scheme-2 rule so any section can opt into it.
import { test, expect } from '@playwright/test';

test('CS-06: rendered footer has class color-scheme-1 (default) and the page defines a .color-scheme-2 rule', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('footer.footer.color-scheme-1')).toHaveCount(1);

  const hasScheme2Rule = await page.evaluate(() => {
    for (const styleEl of Array.from(document.querySelectorAll('style'))) {
      if (styleEl.textContent && styleEl.textContent.includes('.color-scheme-2')) return true;
    }
    return false;
  });
  expect(hasScheme2Rule).toBe(true);
});
