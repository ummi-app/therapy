# Finite launch backlog

Status is `queued`, `active`, `blocked`, or `done`. A task is `done` only with acceptance evidence in `ops/RUN_LOG.md`; `blocked` records one exact non-secret prerequisite, fingerprint, backoff, and next safe local action.

| ID | Status | Deliverable / acceptance condition |
| --- | --- | --- |
| L-01 | active | Repository-wide purge of CareLedger identity plus all Ummi monetization/Stripe/paid-plan/subscription/checkout code, dependencies, routes, environment names, database artifacts, copy, and network endpoints. `npm run verify:free-only` and `npm run verify:free-only:build` prove the tracked product sources and locally built production artifact clean; L-10 repeats the artifact scan against the deployed production artifact. Claim/EOB payment facts are allowed reconciliation data. Current slice awaits independent approval, commit, and push; then run a separately reviewed ops-only reconciliation/closure before marking this item done. |
| L-02 | queued | Inventory existing data flows and define a versioned Supabase schema/migration plan plus exhaustive table/view/RPC/function/storage RLS matrix and policy tests for anon/owner/non-owner/forged ownership/FKs. |
| L-03 | queued | Implement real Supabase email/password auth: verification/resend, bad/expired links, sign-in, forgot/reset/expired reset, session refresh, sign-out, complete deletion, failed post-delete login, and clean re-registration. |
| L-04 | queued | Persist all supported parent data with account isolation; prove deletion removes auth identity, rows, files, and derived data and document factual data handling/log redaction/retention. |
| L-05 | queued | Complete authenticated CRUD for child, coverage, authorization, session, claim, correction, and deletion; every visible control works or is removed. |
| L-06 | queued | Freeze/test import formats, limits, fields, and fixtures; discrepancy taxonomy, exact-match rules, runout timezone, and evidence-output fields; implement only that agreed behavior. |
| L-07 | queued | Inventory every route/control and complete responsive accessible empty/loading/validation/network/server/unauthorized/retry/mobile/keyboard/refresh behavior. |
| L-08 | queued | Add named lint/typecheck/unit/integration/RLS/build/browser-E2E scripts and critical-path coverage; critical command unavailability blocks release. |
| L-09 | queued | Configure pinned Cloudflare/Supabase/DNS/auth/RLS/storage targets under prelaunch authority; document non-secret variables, same-artifact preview/promotion, migration sequence, and rollback drill. |
| L-10 | queued | Run independent release review, production acceptance, public DNS/TLS/incognito smoke, deploy Ummi, verify rollback readiness, and set terminal automation marker. |

Do not add scope. Split an active item into ordered commit-sized child rows only when necessary, preserving its acceptance condition.
