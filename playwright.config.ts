import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// G2 (AD-002): Playwright contra `shopify theme dev`. Credenciais vêm do `.env` (ver `.env.example`).
dotenv.config({ quiet: true });

if (!process.env.SHOPIFY_STORE) {
  console.error('SHOPIFY_STORE não definido no .env');
  process.exit(1);
}

// Valores vazios no .env não devem virar flags vazias para o CLI.
for (const key of ['SHOPIFY_CLI_THEME_TOKEN', 'SHOPIFY_STOREFRONT_PASSWORD']) {
  if (!process.env[key]) delete process.env[key];
}

const PORT = 9292;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx shopify theme dev --host 127.0.0.1 --port ${PORT} --live-reload off --error-overlay silent --no-color`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: true,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      SHOPIFY_FLAG_STORE: process.env.SHOPIFY_STORE,
      ...(process.env.SHOPIFY_STOREFRONT_PASSWORD
        ? { SHOPIFY_FLAG_STORE_PASSWORD: process.env.SHOPIFY_STOREFRONT_PASSWORD }
        : {}),
    },
  },
});
