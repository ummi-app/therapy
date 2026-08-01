# Operating authority and pinned targets

## Exact targets

| System | Authorized target |
| --- | --- |
| Public repository | `git@github.com:ummi-app/therapy.git` |
| Supabase project | `ptwlncpljcfssoarbatc` |
| Cloudflare account | `465be161024b651d369bf5b091b46dfe` |
| Public domain | `ummi.app` |

Verify all four identifiers before a live write. A mismatch is a hard stop.

## Prelaunch authority

Before real users exist, the user authorizes configuration, replacement, and deletion of obsolete configuration, DNS/domain records, auth settings, RLS policies, storage objects/configuration, and deployment configuration within the exact targets above, without routine approval. Inventory affected resources first and preserve an export/snapshot or documented rollback where possible.

After real users exist, stop destructive live work unless it is a tested backward-compatible migration or an individual account deletion flow. Inventory and protect real user data first; require explicit direction for other destructive actions, new accounts/projects/domains, spending commitments, third-party integrations, or legal/privacy claims beyond factual disclosure.

## Normal authority and secrets

Inspect the repository/public documentation, edit repo files, run local checks, commit reviewed slices, push the configured upstream, and deploy the pinned Cloudflare target only after ship gates pass. Prefer additive migrations and same-artifact promotion.

Never print, commit, log, or expose secrets/client service-role keys. Use approved provider secret settings and least-privilege credentials. Commit only non-secret variable names. Use synthetic test records; do not place personal health/financial data in logs or tests.

## Live safety

Confirm two-account isolation and all RLS behavior before production. Retain the previous deployment identifier and tested rollback action. Stop and report evidence for data exposure, authorization failure, incorrect target, unexpected data inventory, or failed rollback.
