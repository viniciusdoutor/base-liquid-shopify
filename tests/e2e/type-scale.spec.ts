// BUG-06: a escala de tipografia (--f0..--f8) é fluida entre mobile e desktop.
import { test, expect } from '@playwright/test';

async function probeF8FontSizePx(page: import('@playwright/test').Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.createElement('div');
    el.id = 'f8-probe';
    el.style.cssText = 'position:absolute;visibility:hidden;font-size:var(--f8);';
    document.body.appendChild(el);
    const px = parseFloat(getComputedStyle(el).fontSize);
    el.remove();
    return px;
  });
}

test('BUG-06: font-size computado de var(--f8) é maior em 1440px do que em 375px', async ({ page }) => {
  await page.goto('/');

  await page.setViewportSize({ width: 375, height: 800 });
  const mobileSize = await probeF8FontSizePx(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopSize = await probeF8FontSizePx(page);

  expect(desktopSize).toBeGreaterThan(mobileSize);
});
