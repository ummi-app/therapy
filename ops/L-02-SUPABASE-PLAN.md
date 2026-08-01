# L-02 data-flow and Supabase persistence plan

Status: foundation slice recorded on 2026-08-01. This document is the
contract for the first schema migration and its RLS test matrix. It does not
authorize a live Supabase write; L-09 owns target configuration and promotion.

## Current data-flow inventory

The current MVP is device-local and has no authenticated server data path.

| Source or sink | Current behavior | Sensitive data boundary | Launch implication |
| --- | --- | --- | --- |
| Seed workspace | `lib/ledger.ts` exports a synthetic `seedLedger`; the client clones it on first render. | Synthetic child, coverage, session, claim, and EOB facts only. | Seed data must be replaced or clearly isolated when authenticated persistence lands. |
| Browser state | `app/page.tsx` owns the `Ledger` React state and derives rows, issues, forecasts, reminders, and evidence in the browser. | The ledger can contain a child's name, provider/insurer facts, notes, document text, and payment facts. | Derived reconciliation output is not a separate database source of truth in this slice. |
| Local storage | `ummi-reconciliation-v1` stores the normalized ledger after hydration; `migrateLedgerStorage` strips unknown fields and removes the one-time legacy key. | Same data remains on the user's device. | L-03/L-04 must replace this with an authenticated, owner-scoped sync path without copying another account's data. |
| Import | Text-based PDF, TXT, CSV, or pasted text is read in the browser; PDF text extraction uses the bundled worker. | File bytes and extracted text currently remain in the browser. | The launch contract keeps file bytes local; only user-confirmed normalized source text is persisted in `imported_documents`. |
| Backup | Settings exports/restores the normalized ledger as a local JSON file. | Export may contain all local ledger and document text. | Account deletion and privacy copy must distinguish local exports from server records. |
| Evidence packet | The Evidence screen builds a call script, summary, and correction request in the browser; the user may copy text to the clipboard or download a text file. | The packet can contain child, provider, claim, EOB, and family-responsibility facts and leaves the browser only through that explicit user action. | No packet is uploaded or retained by Ummi; clipboard history and downloaded files are outside app-controlled retention and must be called out in factual privacy copy. |
| Rendered UI | Watchlist, Coverage, Sessions, Claims, and Documents render from the same ledger state. | No route currently receives a user identity or calls a provider API. | Auth, loading, unauthorized, retry, and refresh behavior is L-03/L-07 work. |
| Network/runtime | No Supabase client, API route, D1 table, or external insurer/provider endpoint is used by the product. The Cloudflare worker currently serves the application/assets. | No server persistence exists to isolate today. | The migration is additive source groundwork only; no provider or hosting settings change here. |

## Target launch data flow

1. Supabase Auth creates and refreshes the user's email/password session (L-03).
2. The browser sends only authenticated CRUD requests to the pinned Supabase
   project. Every persisted row carries `owner_id = auth.uid()` and every
   cross-table foreign key includes `owner_id`.
3. `children` is the root business record. Authorizations, authorization
   lines, sessions, and claims reference the same owner. Restrictive business
   foreign keys prevent a parent delete from erasing descendants; L-04 removes
   owned rows explicitly in reverse dependency order.
4. Imported source text and the allowlisted extracted fields are stored in
   `imported_documents` only after the user confirms the import. Original file
   bytes never leave the browser and no Storage bucket is provisioned for this
   launch contract.
5. Reminders and issue resolutions are owner-scoped records. Open issues,
   reconciliation rows, forecasts, evidence packets, and money-at-risk totals
   remain deterministic client-side projections of owned rows; they are not
   trusted as authorization boundaries. Copying or downloading an evidence
   packet is a local user-directed sink, not a server persistence path; Ummi
   retains no copy after the browser action.
6. Sign-out clears the active client cache. Account deletion must remove all
   owned descendants in reverse dependency order, then the Auth identity,
   through the documented L-04 deletion flow before allowing a clean
   re-registration. Business-record foreign keys use `RESTRICT` so an ordinary
   parent edit/delete cannot silently erase historical sessions or claims.

No insurer, provider, claim-submission, notification, payment-collection,
Stripe, plan, subscription, or checkout endpoint is part of this flow.

## Versioned migration plan

| Version | Source artifact | Purpose | Compatibility/rollback |
| --- | --- | --- | --- |
| `20260801210700` | `supabase/migrations/20260801210700_ledger_foundation.sql` | Create the owner-scoped tables, constraints, indexes, grants, and RLS policies for the supported ledger shape. | Additive only. Roll back by restoring the prior database snapshot or dropping the not-yet-used tables in a reviewed prelaunch drill; never run a destructive rollback after real users exist. |
| `L-03` follow-up | Future migration, not included here | Add only auth-facing profile/session metadata if the verified auth flow needs it. `auth.users` remains Supabase-owned. | Expand first; deploy compatible code; migrate; verify. |
| `L-04` follow-up | Future migration, not included here | Add deletion/audit metadata only if required by the tested deletion flow. Do not persist derived reconciliation rows without a new decision. | Backward-compatible addition; deletion test must cover all owned rows and any future storage objects. |

The first migration deliberately does not create a view, RPC, Edge Function,
trigger, or Storage bucket. This keeps the authority surface small and makes a
missing object an explicit denial-by-default result. Any future object requires
an updated inventory, migration, matrix, and independent review.

## Relational mapping and integrity rules

| Current `Ledger` field | Target table/column | Required invariant |
| --- | --- | --- |
| authorization `child` | `children.display_name` + `authorizations.child_id` | A child belongs to exactly one owner; an authorization can only reference that owner's child. |
| authorization metadata | `authorizations.service_name`, `provider_name`, `authorization_number`, `starts_on`, `ends_on` | Dates are valid and the end date is not before the start date. |
| authorization `lines[]` | `authorization_lines` | Code, unit label, approved units, and provider-reported units are preserved; units are non-negative integers. |
| session | `therapy_sessions` | Authorization, line, and owner must agree through composite foreign keys; status controls attended-unit semantics in application validation. |
| claim | `claims` | Authorization and session must agree; claim payment facts are reconciliation data, not Ummi collection. Amounts and units are non-negative. |
| imported document | `imported_documents` | Only allowlisted extracted fields are accepted by the client; source text is user-owned text, not executable content. |
| reminder | `reminders` | Reminder state is private to the owner and may be toggled without affecting source records. |
| resolved issue | `issue_resolutions` | Resolution identity is owner plus the client-generated issue ID/fingerprint; it is not an authorization grant. |

Every table uses a UUID primary key plus `owner_id`. Cross-owner references
fail at the database constraint even if an attacker guesses another UUID.
Every table also has a direct owner policy so a forged `owner_id` fails the RLS
`WITH CHECK` condition on insert/update.

## Exhaustive object inventory and RLS matrix

The first migration provisions exactly these eight public tables:

| Object | anon | owner | non-owner | forged ownership / FK | delete behavior |
| --- | --- | --- | --- | --- | --- |
| `children` | Deny all | CRUD own rows | No rows and no writes | `owner_id != auth.uid()` fails RLS; no cross-owner parent exists | Direct delete is restricted while descendants exist; L-04 deletes descendants first. |
| `authorizations` | Deny all | CRUD own rows | No rows and no writes | Owner check plus `(owner_id, child_id)` FK rejects another owner's child | Direct delete is restricted while lines/sessions/claims exist. |
| `authorization_lines` | Deny all | CRUD own rows | No rows and no writes | Owner check plus authorization FK rejects foreign parent | Direct delete is restricted while sessions reference the line. |
| `therapy_sessions` | Deny all | CRUD own rows | No rows and no writes | Owner check plus authorization and line composite FKs reject forged/foreign links | Direct delete is restricted while claims reference the session. |
| `claims` | Deny all | CRUD own rows | No rows and no writes | Owner check plus matching authorization/session composite FKs rejects mismatched links | Leaf rows are removed explicitly during account deletion. |
| `imported_documents` | Deny all | CRUD own rows | No rows and no writes | No parent FK; forged owner still fails RLS | Removed with the owner. |
| `reminders` | Deny all | CRUD own rows | No rows and no writes | Forged owner fails RLS; no cross-owner reference | Removed with the owner. |
| `issue_resolutions` | Deny all | CRUD own rows | No rows and no writes | Forged owner fails RLS; issue ID is not trusted for access | Removed with the owner. |

The policies are symmetric for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
`owner_id` is checked in both `USING` and `WITH CHECK`, so an owner cannot
reassign a row by updating that column. The migration grants table DML only to
`authenticated`; RLS remains the final row-level boundary. `service_role` is
not used by the browser and is not granted to application code.

### Non-table object matrix

| Object class | Inventory result | Required test |
| --- | --- | --- |
| Public views | None in `20260801210700` | Assert zero launch views; any future view needs owner-safe policies or a security-invoker definition. |
| Public RPCs | None | Assert the named RPC is absent; no client may bypass table policies. |
| Public functions/triggers | None | Assert no launch trigger/function is introduced implicitly. |
| Supabase Storage buckets/objects | None; original files stay local | Assert the bucket inventory is empty for the Ummi target. If a future bucket is approved, add owner-path policies and deletion tests before use. |
| Auth-owned objects | `auth.users` only, managed by Supabase | Test through L-03/L-04 auth and deletion flows; do not alter its RLS/schema here. |

## Policy-test contract

`supabase/tests/20260801210700_rls_matrix.sql` is a self-contained provider-side
pgTAP scenario contract: it enables pgTAP, creates synthetic auth users, and
sets JWT claims directly. It must be run against a disposable Supabase
database after the migration is applied. `tests/l02-schema-contract.test.mjs`
is the local, credential-free guard that ensures this source slice still
contains every object, policy family, and required scenario before provider
execution exists.

The provider test must prove all of the following for every table above:

Required scenario IDs: `anon-deny-all`, `owner-a-crud`,
`non-owner-b-denied`, `forged-owner-denied`, `forged-child-fk-denied`,
`forged-line-fk-denied`, `forged-session-claim-fk-denied`,
`owner-delete-isolation`, and `no-extra-object-surface`.

1. `anon` cannot select, insert, update, or delete.
2. Owner A can create and CRUD rows whose `owner_id` is A.
3. Owner B cannot read or mutate A's rows, including by guessing IDs.
4. Owner A cannot insert/update a row with B's `owner_id`.
5. Owner A cannot use an A-owned row to reference B's child, authorization,
   authorization line, or session; composite foreign keys must reject each
   forged/mismatched relationship.
6. Deletion of an A-owned root removes only A's descendants and never B's
   records. A second deletion is harmless and no orphan remains.
7. The catalog contains RLS enabled and four policies for each public table,
   with no launch views, application RPCs/functions, triggers, or Storage
   buckets. Extension-owned functions are excluded from the application
   function count.

These tests use synthetic UUIDs and names only. No personal health, financial,
credential, or production data belongs in fixtures or logs.
