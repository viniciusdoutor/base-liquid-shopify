// CS-04, CS-05, LEG-01, LEG-02, RAD-05: shadcn tokens + legacy aliases emitted per color scheme.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const settingsData = JSON.parse(readFileSync('config/settings_data.json', 'utf8'));
const scheme1 = settingsData.current.color_schemes['scheme-1'].settings;
const scheme2 = settingsData.current.color_schemes['scheme-2'].settings;
const colorSale: string = settingsData.current.color_sale;

function hexToRgb(hex: string): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

// Direct token custom properties are declared as literal hex, so getPropertyValue returns the raw text.
async function rootTokenValue(page: Page, token: string): Promise<string> {
  return page.evaluate((t) => getComputedStyle(document.documentElement).getPropertyValue(t).trim().toLowerCase(), token);
}

// Legacy aliases hold `var(--x)`, so reading getPropertyValue would return the unresolved token text.
// Apply the var() to a real CSS property instead and read the browser's resolved computed style.
async function probeResolvedColor(page: Page, varName: string, wrapperClass?: string): Promise<string> {
  return page.evaluate(
    ({ varName, wrapperClass }) => {
      const wrapper = document.createElement('div');
      if (wrapperClass) wrapper.className = wrapperClass;
      const probe = document.createElement('div');
      probe.style.cssText = `background-color: var(${varName});`;
      wrapper.appendChild(probe);
      document.body.appendChild(wrapper);
      const value = getComputedStyle(probe).backgroundColor;
      wrapper.remove();
      return value;
    },
    { varName, wrapperClass },
  );
}

test('CS-05: :root --background equals scheme-1 background', async ({ page }) => {
  await page.goto('/');
  const bg = await rootTokenValue(page, '--background');
  expect(bg).toBe(scheme1.background.toLowerCase());
});

test('CS-04/CS-06: an injected .color-scheme-2 wrapper computes scheme-2 values for the 18 shadcn tokens', async ({ page }) => {
  await page.goto('/');
  const tokens = await page.evaluate(() => {
    const el = document.createElement('div');
    el.className = 'color-scheme-2';
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const names = [
      '--background', '--foreground', '--card', '--card-foreground', '--popover', '--popover-foreground',
      '--primary', '--primary-foreground', '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
      '--accent', '--accent-foreground', '--destructive', '--border', '--input', '--ring',
    ];
    const result: Record<string, string> = {};
    for (const n of names) result[n] = cs.getPropertyValue(n).trim().toLowerCase();
    el.remove();
    return result;
  });
  expect(tokens['--background']).toBe(scheme2.background.toLowerCase());
  expect(tokens['--foreground']).toBe(scheme2.foreground.toLowerCase());
  expect(tokens['--card']).toBe(scheme2.card.toLowerCase());
  expect(tokens['--card-foreground']).toBe(scheme2.card_foreground.toLowerCase());
  expect(tokens['--popover']).toBe(scheme2.card.toLowerCase());
  expect(tokens['--popover-foreground']).toBe(scheme2.card_foreground.toLowerCase());
  expect(tokens['--primary']).toBe(scheme2.primary.toLowerCase());
  expect(tokens['--primary-foreground']).toBe(scheme2.primary_foreground.toLowerCase());
  expect(tokens['--secondary']).toBe(scheme2.secondary.toLowerCase());
  expect(tokens['--secondary-foreground']).toBe(scheme2.secondary_foreground.toLowerCase());
  expect(tokens['--muted']).toBe(scheme2.muted.toLowerCase());
  expect(tokens['--muted-foreground']).toBe(scheme2.muted_foreground.toLowerCase());
  expect(tokens['--accent']).toBe(scheme2.accent.toLowerCase());
  expect(tokens['--accent-foreground']).toBe(scheme2.accent_foreground.toLowerCase());
  expect(tokens['--destructive']).toBe(scheme2.destructive.toLowerCase());
  expect(tokens['--border']).toBe(scheme2.border.toLowerCase());
  expect(tokens['--input']).toBe(scheme2.input.toLowerCase());
  expect(tokens['--ring']).toBe(scheme2.ring.toLowerCase());
});

test('LEG-01: every legacy alias resolves to its mapped shadcn token at :root (scheme-1)', async ({ page }) => {
  await page.goto('/');
  const cases: [string, string][] = [
    ['--color-background', scheme1.background],
    ['--color-text', scheme1.foreground],
    ['--color-background-contrast', scheme1.muted],
    ['--color-text-contrast', scheme1.foreground],
    ['--color-accent', scheme1.primary],
    ['--color-accent-text', scheme1.primary_foreground],
    ['--color-border', scheme1.border],
    ['--color-sale', colorSale],
    ['--cor-marca', scheme1.primary],
    ['--cor-verde', colorSale],
    ['--cor-gelo', scheme1.muted],
    ['--cor-cinza', scheme1.border],
  ];
  for (const [varName, expectedHex] of cases) {
    const resolved = await probeResolvedColor(page, varName);
    expect(resolved, `${varName} should resolve to ${expectedHex}`).toBe(hexToRgb(expectedHex));
  }
});

test('LEG-02: --color-text inside a .color-scheme-2 wrapper resolves to scheme-2 foreground, not scheme-1', async ({ page }) => {
  await page.goto('/');
  const resolved = await probeResolvedColor(page, '--color-text', 'color-scheme-2');
  expect(resolved).toBe(hexToRgb(scheme2.foreground));
  expect(resolved).not.toBe(hexToRgb(scheme1.foreground));
});

test('RAD-05: rounded-lg renders square corners when --radius is overridden to 0', async ({ page }) => {
  await page.goto('/');
  const borderRadius = await page.evaluate(() => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = '--radius: 0px;';
    const probe = document.createElement('div');
    probe.className = 'rounded-lg';
    wrapper.appendChild(probe);
    document.body.appendChild(wrapper);
    const value = getComputedStyle(probe).borderRadius;
    wrapper.remove();
    return value;
  });
  expect(borderRadius).toBe('0px');
});
