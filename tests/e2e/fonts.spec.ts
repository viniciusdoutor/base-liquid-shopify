// RAD-03, RAD-04: font-sans/font-heading map to the theme's body/heading font families.
import { test, expect } from '@playwright/test';

function firstFont(fontFamilyList: string): string {
  return fontFamilyList.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
}

async function probe(page: import('@playwright/test').Page, className: string, cssVar: string) {
  return page.evaluate(
    ({ className, cssVar }) => {
      const el = document.createElement('div');
      el.className = className;
      document.body.appendChild(el);
      const computedFontFamily = getComputedStyle(el).fontFamily;
      const rootVarValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar);
      el.remove();
      return { computedFontFamily, rootVarValue };
    },
    { className, cssVar },
  );
}

test('RAD-03: .font-sans computed font-family starts with settings.type_body_font (--font-body-family)', async ({ page }) => {
  await page.goto('/');
  const { computedFontFamily, rootVarValue } = await probe(page, 'font-sans', '--font-body-family');
  expect(firstFont(computedFontFamily)).toBe(firstFont(rootVarValue));
});

test('RAD-04: .font-heading computed font-family starts with settings.type_header_font (--font-heading-family)', async ({ page }) => {
  await page.goto('/');
  const { computedFontFamily, rootVarValue } = await probe(page, 'font-heading', '--font-heading-family');
  expect(firstFont(computedFontFamily)).toBe(firstFont(rootVarValue));
});
