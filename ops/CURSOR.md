# Hourly execution cursor

Current phase: operations scaffold reconciliation complete; `L-01` (not started)

Last reconciled run: `ummi-hourly-product-builder-20260801T190500Z`. The
bootstrap scaffold described in the prior run log was present only as an
uncommitted worktree change; `main` and `origin/main` both remained at
`06d833126dc208d6c04d693767fd0cef08f3b272`. Commit and push the reviewed
scaffold before activating the hourly automation, then select the smallest
`L-01` purge slice.

At the start of each run, reconcile this cursor against `ops/BACKLOG.md` and the repository. The source of truth is the backlog plus run-log evidence; update this file to the selected task/subtask, commit hash when applicable, blocking prerequisite, and next deterministic action before the run ends.

Selection algorithm:

1. Validate any `active` item first; select its smallest unfinished acceptance slice. If it is blocked, select its recorded next safe local action.
2. Otherwise select the lowest-numbered non-`done` `L-*` item whose preceding launch items are `done`.
3. If provider credentials/configuration block that item, record the exact prerequisite, then select the earliest non-`done` local design, test, migration, documentation, or adversarial-review slice that advances it.
4. If no safe local slice remains and a blocker's next retry time has not arrived, release the lock and exit without file changes or repeat notification. At or after the retry time, execute one bounded prerequisite audit, update the blocker evidence/backoff, and send the precise deduplicated user request only when the state changed.
5. Only stop autonomous selection at the mission stop condition.

Never skip a gate, invent access, loop on a known blocker without new evidence, or quietly change task status.
