# Ummi mission and finite launch scope

## Mission

Help parents catch pediatric therapy authorization and billing discrepancies before care is interrupted or a balance becomes a surprise bill.

## Launch slice

Ship one free, public web app named **Ummi**. A parent can verify an email, create/sign in to an account, recover access, manage only their own child, coverage, authorization, session, and claim records, import the frozen supported document formats, see actionable discrepancy/runout alerts, generate an evidence summary, and permanently delete their account and data.

The hosted app persists each account's data in Supabase with RLS and is served at `https://ummi.app` on Cloudflare. Existing reconciliation logic is only a starting point. The authoritative finite behavior contract is `ops/BACKLOG.md`; do not add features beyond it.

## Explicit exclusions

No payment collection by Ummi, Stripe, paid pricing/plans, subscriptions, checkout, insurer/provider integrations, claim submission, legal/medical advice, scanned-image OCR, or outbound notifications. Claim and EOB payment facts are allowed reconciliation data; they do not represent payment collection by Ummi. Remove excluded or incomplete ideas; never ship them as disabled controls or future promises.

## Stop condition

Stop autonomous delivery only when every `L-*` item is `done`, the exhaustive production acceptance in `ops/SHIP_CRITERIA.md` passes at `ummi.app` with Supabase persistence, `ops/RUN_LOG.md` records the release commit/artifact digest/deployment evidence, and `ops/AUTOMATION.md` has the terminal marker. Future invocations are a no-op except reporting completion until the user adds an approved backlog item.
