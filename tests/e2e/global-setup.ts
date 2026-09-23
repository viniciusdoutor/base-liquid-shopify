// T11 (GATE-01): make G2 fail when `shopify theme dev` cannot upload a theme file.
//
// Without this check, a broken theme file (e.g. a `settings_schema.json` with an invalid
// `color_scheme_group` role) makes the CLI's upload fail, but the dev server keeps serving the
// last-known-good remote copy of the theme — so every e2e test that only checks storefront
// markup keeps passing while the local changes never actually reached the store.
//
// When the upload fails, `shopify theme dev` serves a distinct fallback page (title
// "Failed to Upload Theme Files") for every request instead of the storefront. That page only
// appears once the CLI's background sync has had time to run and fail, so this polls `GET /`
// for a bounded window right after the webServer becomes reachable (Playwright starts the
// webServer before running globalSetup) and fails the whole run as soon as it shows up.
const PORT = 9292; // must match playwright.config.ts
const BASE_URL = `http://127.0.0.1:${PORT}`;
const POLL_INTERVAL_MS = 1_000;
const POLL_BUDGET_MS = 25_000;
const UPLOAD_FAILURE_TITLE = 'Failed to Upload Theme Files';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractErrorLines(html: string): string[] {
  const matches = html.matchAll(/Polaris-List__Item">([^<]+)</g);
  return Array.from(matches, (m) => m[1].trim());
}

export default async function globalSetup(): Promise<void> {
  const deadline = Date.now() + POLL_BUDGET_MS;
  while (Date.now() < deadline) {
    let body: string | null = null;
    try {
      const res = await fetch(BASE_URL);
      body = await res.text();
    } catch {
      // Server not reachable on this attempt (e.g. still restarting mid-sync); retry.
    }

    if (body !== null && body.includes(UPLOAD_FAILURE_TITLE)) {
      const details = extractErrorLines(body);
      const detailText = details.length ? `\n  - ${details.join('\n  - ')}` : '';
      throw new Error(
        `shopify theme dev could not upload one or more theme files (G2 gate).${detailText}\n` +
          'Fix the reported file(s) before re-running the e2e suite.',
      );
    }

    await sleep(POLL_INTERVAL_MS);
  }
}
