# Run log

Append one entry per hourly cycle and one per deploy. Use ISO-8601 timestamps. Never include secrets or personal data.

## Template

```text
## <timestamp> — <run ID> — <task ID / slice>
Lock: <acquired/released; automation ID; executor; cwd>
Prior result: <previous staged-tree ref mapped to actual commit/push; or initial run>
Selection: <cursor rule and evidence>
Work: <files/actions>
Blocker: <fingerprint, first/last seen, attempts, next retry, prerequisite; or none>
Implementer review: <staged-diff ref; findings/fixes>
Independent commit review: <reviewer identity; findings/fixes; exact final staged-tree ref and approval captured externally, then reconciled by next run>
Validation: <named lint/typecheck/unit/integration/RLS/build/browser-E2E commands and results>
Secret/public scan: <staged/full-tree/history status>
Commit intent: <message and branch; external final staged-tree ref; or none>
Independent deploy review: <reviewer, commit/artifact/provider/migrations/preview/rollback approval; or none>
Deploy: <environment, artifact digest, URL/id, acceptance, rollback evidence; or none>
Status/next: <backlog/cursor/terminal-marker state>
```

## 2026-08-01T20:56:23Z — policy-recovery — Luna/high reconciliation after L-01

Lock: no hourly lock; automation `ummi-hourly-product-builder` paused before recovery
Prior result: L-01 source slice committed and pushed as `a1862dc` (`feat: rename product to Ummi and remove monetization surfaces`)
Selection: user explicitly requested restoration of the Luna/high policy after it was incorrectly excluded from the L-01 commit
Work: restored Luna/high in the operator skill, automation contract, and decision record; preserved the recoverable concurrent-edit stash; corrected the L-01 status evidence below
Blocker: none
Implementer review: exact policy/reconciliation diff inspected; no product files included
Independent commit review: required for this exact final staged diff before commit
Validation: targeted policy-reference check, automation-state check, and `git diff --check`
Secret/public scan: no new secret-bearing content
Commit intent: `chore: restore Luna high automation policy and reconcile L-01` on `main`
Independent deploy review: none; no deploy
Deploy: none
Status/next: policy reconciliation committed/pushed as `41606225aa502ea7c5cf8fcf363ca88b98335be9`; the user has reactivated the external automation, so the next run may select `L-02`

## 2026-08-01T19:03:39Z — bootstrap-automation — operations scaffold

Lock: manual bootstrap; hourly automation `ummi-hourly-product-builder` created paused; Terra medium executor; task cwd verified
Prior result: initial run
Selection: user explicitly requested the durable mission, finite ship definition, hourly pipeline, logs, continuous commits, and independent review before product execution
Work: added repo operator rules, mission/scope, authority/pinned targets, finite backlog/cursor, automation lifecycle and lock helper, decisions, run-log protocol, and repo-local operator skill; deleted the Product Hunt automation
Blocker: none
Implementer review: GPT-5.6 Terra medium scaffold pass; lock/test and skill-validation issues corrected
Independent commit review: GPT-5.6 Sol high first pass found twelve issues covering review independence, authority, scheduling, acceptance depth, auth recovery, RLS/deletion, payment residue, rollback, validation, public-repo safety, finite semantics, and concurrency; all findings were addressed; exact final staged-tree approval is captured externally and reconciled in the next run
Validation: skill quick validation, lock acquire/overlap/status/release behavior, shell syntax, repository diff checks
Secret/public scan: pinned public remote verified; staged/full-tree scan required before commit; no credential values belong in tracked files
Commit intent: `chore: add autonomous Ummi delivery pipeline` on `main`; external final staged-tree reference
Independent deploy review: none; no deploy in this run
Deploy: none
Status/next: automation remains paused until this exact reviewed scaffold is committed and pushed; then activate it and begin `L-01`

## 2026-08-01T19:07:27Z — ummi-hourly-product-builder-20260801T190500Z — operations scaffold reconciliation

Lock: acquired by `ummi-hourly-product-builder-20260801T190500Z`, then released when the unexpectedly early run was stopped; hourly automation `ummi-hourly-product-builder`; GPT-5.6 Terra medium executor; `/Users/rohan/repos/therapy-coverage-ledger`
Prior result: prior external staged-tree reference was not mapped to a commit; `main` and `origin/main` both resolve to `06d833126dc208d6c04d693767fd0cef08f3b272`, while the intended bootstrap scaffold exists as uncommitted files
Selection: `ops/CURSOR.md` requires reconciliation before selection; `ops/AUTOMATION.md` keeps the automation paused until this reviewed scaffold is pushed, so this bounded recovery slice precedes `L-01`
Work: reconciled local/upstream state; staged the complete operations scaffold and updated cursor/run evidence for its recovery
Blocker: `L-08:required-validation-scripts:missing-scripts`; first/last seen `2026-08-01T19:07:20Z`; attempts `1`; next retry when `L-08` is selected; prerequisite is adding the named validation scripts. This blocks release only, not this operations-scaffold recovery commit.
Implementer review: earlier staged trees were invalidated after adversarial reviews found unsafe age-only lock recovery, noisy blocker retries, a bootstrap payment-residue deadlock, inaccurate run evidence, an incomplete-acquisition lock wedge, and missing clean-tree/upstream/staging isolation; fixed every finding and restaged only the explicit scaffold file set
Independent commit review: all earlier reviews were invalidated by their fixes; pending fresh named reviewer approval of the exact final staged tree
Validation: `npm run lint` passed; `npm test` passed (`npm run build` plus 11 node tests); `bash -n scripts/automation-lock.sh` passed; lock tests proved atomic publication, harmless orphaned pre-publication state, acquire/release, overlap denial, no age reclaim, explicit-owner recovery, wrong-owner denial, and late-old-owner release denial; operator skill quick validation passed; `git diff --check` passed. `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, and `npm run test:e2e` are unavailable (recorded for `L-08`).
Secret/public scan: staged diff and full worktree secret-value scans passed with no credential-pattern matches; reachable-history secret-value scan passed with no matches; public remote is `git@github.com:ummi-app/therapy.git`. The broader excluded-identity purge remains `L-01` work.
Commit intent: `chore: add autonomous Ummi delivery pipeline` on `main`; final staged-tree reference and independent approval captured externally after review
Independent deploy review: none; no deploy
Deploy: none
Status/next: commit and push this reviewed recovery slice; keep automation paused, then select the smallest `L-01` slice

## 2026-08-01T19:31:41Z — bootstrap-automation reconciliation — activation-state record

Lock: no hourly lock acquired; bounded tracked-state reconciliation only; external hourly automation remains paused
Prior result: external final staged-tree reference `a116dca406a632280e51ba01ba65383872c4f50a` and approved staged-diff SHA-256 `9d4d1f139659e1daa1c556a039998bfb4981f4229574e16cc67a8d5fe1dae24b` map to actual reviewed, pushed `main` commit `d2e0574c38b30516c53aa2034c1d50c761cebd31`
Selection: reconcile the prior reviewed scaffold result before external activation, as required by `ops/AUTOMATION.md`; no product implementation is selected in this bounded slice
Work: changed only the tracked automation status, cursor, and run evidence; preserved terminal marker `not-complete`
Blocker: none
Implementer review: exact three-file activation-state allowlist inspected before staging
Independent commit review: `final_review_ummi_scaffold_v2` independently approved the prior scaffold's exact final staged tree; this new activation-state diff requires a separate independent review before commit
Validation: prior scaffold validation recorded as passing: `npm run lint`; `npm test` (build plus 11 node tests); `bash -n scripts/automation-lock.sh`; lock behavior tests; operator-skill quick validation; and `git diff --check`. Named typecheck/unit/integration/RLS/E2E scripts remain unavailable and are tracked in `L-08`; no deploy is authorized.
Secret/public scan: no secrets or personal data added by this three-file operational reconciliation; the prior scaffold recorded clean staged/full-tree/reachable-history scans. Public remote remains `git@github.com:ummi-app/therapy.git`.
Commit intent: activation-state reconciliation on `main`; capture this exact staged-tree reference and independent approval externally before commit
Independent deploy review: none; no deploy
Deploy: none
Status/next: tracked status is `ACTIVE`; external `ummi-hourly-product-builder` remains `PAUSED` until this exact diff is independently approved, committed, and pushed, then activate it. Next deterministic product action: smallest `L-01` purge slice.

## 2026-08-01T19:36:00Z — manual-l01-20260801T193600Z — L-01 identity and free-only purge

Lock: acquired by root-managed manual run `manual-l01-20260801T193600Z`; not released by this implementer; task cwd `/Users/rohan/repos/therapy-coverage-ledger`
Prior result: `main` and `origin/main` both verified at `db9aa4ec0b74227f609d104f2f70cf77aa5aea46` before edits; that activation commit maps to tree `62f84d0e223b712d2cd93e9202169309667e0412`, diff `1138c2ae6509dbe53969ef755c8fa3253df09e1424953cbf4000ef32b3cab924`, reviewer `review_ummi_activation`, and externally verified `ACTIVE` status
Selection: cursor rule 2 selected the lowest-numbered queued item, `L-01`; this is its complete bounded source/build purge slice
Work: renamed all runtime/product identity and download/storage identifiers to Ummi; renamed `examples/careledger-samples` to `examples/ummi-samples`; replaced the legacy-name social image and aligned the favicon to Ummi; removed the mock pricing/upgrade/plan/checkout modal, state, controls, and styles; normalized local-storage hydration, backup restore, backup export, and one-time legacy-key migration to the exact allowed Ledger shape, stripping legacy and unknown nested fields; allowlisted supported extracted document fields; clarified that claim/EOB payment facts are reconciliation data; added deterministic index-blob tracked-source and local-built-artifact free-only scans, approved brand-asset hash/dimension checks, exact PDF-worker exclusions, and staged-index/adversarial regression coverage
Intended-file allowlist: `.gitignore`, `AGENTS.md`, `README.md`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `examples/careledger-samples/{authorization-letter,eob,provider-statement}.txt` (rename only), `examples/ummi-samples/{authorization-letter,eob,provider-statement}.txt`, `lib/ledger.ts`, `ops/{AUTOMATION,BACKLOG,CURSOR,DECISIONS,MISSION,RUN_LOG,SHIP_CRITERIA}.md`, `package.json`, `package-lock.json`, `public/{favicon.svg,og.png}`, `scripts/verify-free-only.mjs`, and `tests/{free-only,ledger,rendered-html}.test.mjs`
Blocker: none
Implementer review: inspected the explicit allowlist and whole diff; retained insurer-paid, family-responsibility, and parent-paid claim facts while removing only Ummi monetization surfaces
Independent commit review: pending separate reviewer approval of the final staged tree
Validation: final command output is recorded from the exact staged tree before review; it includes lint, production build/test, index-blob source and local-artifact verifiers, missing-artifact rejection, staged-index-vs-clean-working-tree regression, and diff checks. The verifier output names its deterministic scanned-file count and exact exclusions rather than relying on stale hardcoded counts. `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, and `npm run test:e2e` remain unavailable and continue as an L-08 pre-production blocker; no deploy attempted.
Secret/public scan: prior reachable-history public-repository scan remains recorded in the bootstrap run; this slice added no secret-bearing configuration. Exact staged/full-tree secret scans remain required by the commit reviewer before commit.
Commit intent: `feat: rename product to Ummi and remove monetization surfaces` on `main`; final staged-tree reference and approval pending external independent review
Independent deploy review: none; no deploy
Deploy: none; L-10 must repeat the verifier against the deployed production artifact
Status/next: L-01 source slice committed/pushed as `a1862dc`; this entry is the separately reviewed ops-only reconciliation/closure, after which L-02 may be selected when automation resumes.

## 2026-08-01T20:51:53Z — manual-l01-close-20260801T204800Z — L-01 result reconciliation/closure

Lock: owned by root-managed manual run `manual-l01-close-20260801T204800Z`; not acquired or released by this reconciler; task cwd `/Users/rohan/repos/therapy-coverage-ledger`
Prior result: approved final staged tree `c9903e1e0987273d697120a4d16b288400134248` and binary staged-diff SHA-256 `c27bf322d8fe2a946d3c84e106ac1e233f049e848170b7ce93e1c367882c59fe` reconcile exactly to independently approved, pushed `main` commit `a1862dcf80168cc58900c1f07892f3aa103d0cf3` (`feat: rename product to Ummi and remove monetization surfaces`); `HEAD` and `origin/main` both resolve to that commit
Selection: `ops/CURSOR.md` required the separately reviewed ops-only closure after the L-01 product commit/push; with L-01 acceptance now evidenced, cursor rule 2 selects L-02
Work: updated only `ops/BACKLOG.md`, `ops/CURSOR.md`, and this run log to mark L-01 done and L-02 active; preserved the concurrent Luna/high policy patch as untouched `stash@{0}` (`ce2c9453213cd09b53aaaf02c542fa79d9aa5799`) for later authorized reconciliation; scheduler was then paused for this authorized policy recovery
Blocker: none
Implementer review: exact three-file ops-only closure allowlist inspected before staging; no product files or stash entries modified
Independent commit review: pending separate reviewer approval of this exact ops-only final staged tree; product commit approval was reviewer `review_l01_ummi_purge_v4`
Validation: product commit evidence verified: `npm run lint` passed; `npm test` passed (production build plus 21 tests); source verifier passed for 34 files; artifact verifier passed for 43 files; staged/full-worktree/reachable-history secret scans, public-repository check, scheduler-state check, and lock check passed. `npx tsc --noEmit` fails only on pre-existing missing Cloudflare ambient module/`Fetcher`/`D1Database` declarations; this remains tracked under L-08. This closure does not authorize or claim deployment.
Secret/public scan: prior product evidence confirms clean staged/full-worktree/reachable-history scans and pinned public remote; this ops-only closure adds no secrets or personal data
Commit intent: `chore: close L-01 purge and select L-02` on `main`; capture this exact final staged-tree reference and independent approval externally before commit
Independent deploy review: none; no deploy
Deploy: none
Status/next: L-01 done; L-02 active; terminal marker remains `not-complete`. Next deterministic action is the smallest L-02 data-flow inventory and versioned Supabase schema/RLS-plan slice.

## 2026-08-01T21:14:42Z — ummi-hourly-product-builder-20260801T210751Z — L-02a data-flow and RLS foundation

Lock: recovered orphaned owner `manual-l02-schema-20260801T210000Z` after Codex thread/process liveness checks found no matching active run; acquired `ummi-hourly-product-builder-20260801T210751Z`; automation `ummi-hourly-product-builder`; GPT-5.6 Luna high; `/Users/rohan/repos/therapy-coverage-ledger`
Prior result: `HEAD` and `origin/main` both verified at `fb3d5b2e8d5572481d9812f1bfc1725c2dbc74cd`; prior ops reconciliation commit is pushed and no staged-tree drift remained
Selection: reconciled `ops/BACKLOG.md` and `ops/CURSOR.md`; `L-02` is the active lowest unfinished item and cursor explicitly selected its smallest data-flow inventory plus versioned Supabase schema/RLS-plan slice, `L-02a`
Work: added the current/target data-flow inventory and migration/RLS contract in `ops/L-02-SUPABASE-PLAN.md`; added versioned owner-scoped Supabase foundation tables, restrictive business FKs, grants, and four-policy RLS families in `supabase/migrations/20260801210700_ledger_foundation.sql`; added the self-contained provider-side pgTAP scenario contract in `supabase/tests/20260801210700_rls_matrix.sql`; added credential-free local contract coverage in `tests/l02-schema-contract.test.mjs`; wired `npm run test:rls` to `supabase test db`; tightened the free-only verifier's environment-name check so lowercase reconciliation columns such as `billing_code` remain allowed while uppercase prohibited environment names remain blocked; updated backlog, cursor, decision, and this run log
Intended-file allowlist: `ops/BACKLOG.md`, `ops/CURSOR.md`, `ops/DECISIONS.md`, `ops/L-02-SUPABASE-PLAN.md`, `ops/RUN_LOG.md`, `package.json`, `scripts/verify-free-only.mjs`, `supabase/migrations/20260801210700_ledger_foundation.sql`, `supabase/tests/20260801210700_rls_matrix.sql`, `tests/l02-schema-contract.test.mjs`
Blocker: `L-08:required-validation-scripts:missing-scripts`; first seen in prior run evidence, last seen `2026-08-01T21:35:22Z`, attempts `3`, next retry when L-08 is selected; exact prerequisite is adding the named `typecheck`, `test:unit`, `test:integration`, and `test:e2e` scripts. This blocks production release, not this local design/migration slice. Separate `L-02:provider-test:local-db-unavailable` first seen `2026-08-01T21:35:22Z`, attempts `1`, next retry when a disposable Supabase database is available; `npm run test:rls` is now wired but local Postgres at `127.0.0.1:54322` refused connection. No notification repeated because these fingerprints are recorded here.
Implementer review: initial local contract test syntax and free-only false positive on the allowed lowercase `billing_code` field were found and fixed; independent reviewer `Singer` identified four P1 gaps, which were fixed; fresh reviewer `Planck` identified four more issues, which were fixed; fresh reviewer `Anscombe` identified four final issues, which were fixed; fresh reviewer `Einstein` identified one P1 pgTAP result-shape bug in owner/non-owner mutation assertions, which was fixed; fresh reviewer `Mencius` identified one P2 omission of evidence clipboard/download sinks from the data-flow inventory, which was fixed and revalidated; the immutable staged-tree and binary-diff references are captured externally after this final run-log append
Independent commit review: prior exact-tree reviews by `Singer`, `Planck`, `Anscombe`, `Einstein`, and `Mencius` were invalidated by their requested fixes; pending fresh independent adversarial review of the new exact final staged tree after this run-log append; any finding or fix invalidates approval and requires a new review
Validation: `npm run lint` passed; `npm test` passed with production build and 23 tests; `npm run build` passed; `npm run verify:free-only` passed for 37 tracked product sources; `npm run verify:free-only:build` passed; `git diff --check` passed. Required `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, and `npm run test:e2e` were each exercised and are unavailable because scripts are not defined; recorded under L-08. `npm run test:rls` is defined and was exercised but failed only because local Postgres at `127.0.0.1:54322` is unavailable; provider pgTAP execution remains deferred until a disposable Supabase test target is authorized and configured.
Secret/public scan: exact staged diff and full worktree secret-value scans clean; reachable-history secret-value scan found 0 matches; origin exactly `git@github.com:ummi-app/therapy.git`; free-only staged-index verifier passed after the verifier fix; no real user data or secret values added
Commit intent: `feat: add Supabase data model and RLS contract` on `main`; final staged-tree reference and independent approval captured externally before commit
Independent deploy review: none; this is a local source/migration contract slice with no provider/configuration change and no deploy
Deploy: none
Status/next: `L-02` remains active with `L-02a` recorded; terminal marker remains `not-complete`; next deterministic action is provider-side disposable execution of the RLS matrix when the configured gate is available, then reconcile findings before L-03 auth
