// BUG-07: gift card loads Shopify's vendor QR library instead of an inline encoder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test("BUG-07: gift_card.liquid loads the QR library via 'vendor/qrcode.js' | shopify_asset_url", () => {
  const src = readFileSync('templates/gift_card.liquid', 'utf8');
  assert.match(src, /<script\s+src="\{\{\s*'vendor\/qrcode\.js'\s*\|\s*shopify_asset_url\s*\}\}"/);
  assert.match(src, /new QRCode\(/);
  assert.doesNotMatch(src, /function QRCodeModel\(/, 'inline QR encoder must be removed');
});
