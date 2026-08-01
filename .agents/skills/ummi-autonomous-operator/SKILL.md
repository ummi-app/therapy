---
name: ummi-autonomous-operator
description: Run the Ummi pediatric-therapy ledger through a deterministic, single-flight hourly launch pipeline with independent review, exact-target Supabase/Cloudflare operations, production acceptance, and terminal completion. Use for any autonomous Ummi product, release, Supabase, Cloudflare, or launch-readiness work.
---

# Ummi Autonomous Operator

Read all `ops/*.md` files before changing state. The automation project cwd is `/Users/rohan/repos`; its prompt is pinned to task repository cwd `/Users/rohan/repos/therapy-coverage-ledger`. Use GPT-5.6 Luna at high reasoning and honor the pinned targets in `ops/AUTHORITY.md`.

## Hourly cycle

1. Check `ops/AUTOMATION.md`: `ummi-hourly-product-builder` runs hourly at minute 5 and remains `PAUSED` until a reviewed commit is pushed. If its terminal marker is complete, make no changes and report completion. Acquire the single-flight lock with `scripts/automation-lock.sh acquire <run-id>` before selection.
2. Before edits, require `main`, a configured upstream, a clean index/worktree, and reconciled `HEAD`/upstream state exactly as `ops/AUTOMATION.md` specifies. Push only a known already-reviewed prior commit; otherwise preserve and fingerprint unexpected state. Reconcile the prior run's staged-tree reference with the actual commit/upstream result, then reconcile cursor, backlog, and run-log evidence. Select exactly as `ops/CURSOR.md` requires. On a blocker, fingerprint, back off, deduplicate, and continue its safe local action. Record the exact intended-file allowlist before implementation.
3. Implement only the smallest selected acceptance slice. Keep Ummi free, complete, and within the frozen launch contract.
4. Stage only the explicit intended-file allowlist, including its operational files; never use broad staging. Recheck status and leave any unexpected external edit untouched; an overlap or dirty precondition blocks the commit. The implementer reviews the whole exact diff, then a separate named independent reviewer reviews the exact final staged diff. Any change requires fresh independent approval.
5. Run every named required validation. Critical check failure/unavailability blocks release work. Scan staged/full-tree secrets and enforce the public-repository invariant; complete the one-time history scan before launch.
6. Capture the immutable staged-tree reference, commit intent, reviewer, and approval in the external automation result because they cannot be embedded without changing the reviewed tree. Commit only the independently approved exact diff and push immediately; do not edit the staged tree after approval. Stop after push failure. Persist state and release the lock with `scripts/automation-lock.sh release <run-id>`. Reconcile the result into the next tracked run entry.
7. For a deploy, require a second independent deploy review of the exact clean commit/artifact digest, provider diff, migration plan, preview, and rollback. Promote the same previewed artifact only after the full production-acceptance matrix passes.

## Boundaries and completion

Use prelaunch authority only inside the exact pinned targets, inventorying and protecting data first. Once real users exist, halt destructive live operations except tested migration/account deletion. Never expose secrets or service-role credentials.

Never report “nothing to do” before the stop condition. At completion, set the terminal marker and pause/disable the automation; future invocations are no-ops until a user-approved backlog item is added.
