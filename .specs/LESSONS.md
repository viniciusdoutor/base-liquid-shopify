# LESSONS - auto-maintained by scripts/lessons.py

> Machine-owned. Do NOT hand-edit. Changes are overwritten on the next `lessons.py` write.
> Canonical state lives in `.specs/lessons.json`. Edit lessons only via the script.
> promote_threshold=2 distinct features · window_days=45 · quarantine_threshold=2

## Confirmed (load these at Specify/Design)

Corroborated across multiple features. Safe to apply as guidance.

_none_

## Candidates (under observation - do NOT load as guidance yet)

Seen once or not yet corroborated. Tracked, not trusted.

_none_

## Quarantined (failed when applied - ignore)

A confirmed lesson that recurred alongside failure. Kept for the maintainer to review.

### L-001 - When an AC requires loading a local asset via a filter such as shopify_asset_url, assert the referenced file actually exists in the theme (e.g. git ls-files), not just that the Liquid markup pattern matches - Theme Check does not flag a shopify_asset_url path whose file is missing
- signal: `spec_precision_gap` · recurrence: 1 feature(s) · scope: `assets` · harmful: 2
- features: ai-foundation
- evidence: BUG-07 / tests/static/gift-card.test.mjs:8 (assets)
- last seen: 2026-09-23T16:37:40Z
