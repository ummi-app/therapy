# Ship criteria

## Commit gate: implementer then independent reviewer

1. The implementer stages the complete intended slice, including backlog/cursor/run-log/ops changes, and records the staged-diff hash or equivalent immutable review reference.
2. A named independent reviewer who did not implement that slice reviews that exact final staged diff. They adversarially inspect authorization and forged ownership/FKs, data loss, input/output safety, errors, accessibility, mobile behavior, scope/payment residue, and test adequacy.
3. Fix every credible finding. Any source, test, configuration, or ops/log change invalidates approval: restage and obtain a fresh independent review of the new exact diff.
4. Before production, run and record the named commands `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:integration`, `npm run test:rls`, `npm run build`, and `npm run test:e2e`. Add/maintain each script as its backlog slice lands. A failed, skipped, or unavailable critical check blocks production; do not replace it with an undocumented substitute.
5. Scan the exact staged diff and full worktree for secrets; enforce the remote/public invariant that `git@github.com:ummi-app/therapy.git` may contain no secrets, personal data, private endpoints, or unreviewed generated artifacts. Complete and record a one-time reachable-history secret scan before public launch. During bootstrap and incremental `L-01` purge slices, introduce no new Stripe/payment/plan/subscription residue and record the remaining baseline. The commit that completes `L-01`, and every commit thereafter, must prove that no such code, dependency, route, environment variable, database artifact, copy, or network endpoint remains.

## Deploy gate: independently review the exact release

1. A reviewer independent of both implementation and commit approval reviews the exact clean commit, build/artifact digest, Cloudflare/provider configuration diff, Supabase migrations, preview evidence, and rollback procedure. A changed commit or artifact requires fresh deploy review.
2. Build once from the clean commit, record its digest, validate that same artifact in preview/staging, and promote the same artifact; do not rebuild a different production artifact.
3. Use backward-compatible migration sequencing (expand, deploy compatible code, migrate/backfill, verify, contract later). Complete a staging rollback drill that covers application and migration compatibility before production.
4. Verify the pinned account/project/domain, then perform public DNS/TLS and incognito smoke tests at `ummi.app`. Verify the recorded rollback action after a safe preview/staging drill; production rollback must remain immediately executable.

## Exhaustive production acceptance

Inventory every route and visible control from the production artifact. Test every CRUD/core function end to end or remove it. For each applicable route/control test empty, loading, validation, network failure, server failure, unauthorized, retry, mobile, keyboard, and refresh/session-recovery states.

Test auth completely: verification email and resend; verified/unverified and expired links; sign-up; bad credentials; forgot/reset password; expired/reset-invalid links; session refresh; sign-out; full account deletion; failed post-delete login; clean re-registration.

For every Supabase table, view, RPC, function, and storage bucket/object, maintain an explicit matrix proving anon/owner/non-owner create/read/update/delete behavior, forged ownership and foreign-key attacks, and denial-by-default. Account deletion must remove the auth identity, owned rows, files, and derived data; verify log redaction/retention and publish only factual data-handling/privacy disclosure.

Freeze and test the supported import formats, size/count limits, extracted fields, fixtures, discrepancy taxonomy, exact-match rules, runout timezone, and evidence-output fields in `L-06`; do not claim unsupported behavior.
