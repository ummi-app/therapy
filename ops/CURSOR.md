# Hourly execution cursor

Current phase: operations scaffold committed and pushed; activation-state
reconciliation staged; `L-01` (not started)

Last reconciled run: `bootstrap-automation`. Its externally captured final
staged-tree reference `a116dca406a632280e51ba01ba65383872c4f50a` and approved
diff SHA-256 `9d4d1f139659e1daa1c556a039998bfb4981f4229574e16cc67a8d5fe1dae24b`
map to reviewed, pushed `main` commit
`d2e0574c38b30516c53aa2034c1d50c761cebd31`. The tracked contract is now
`ACTIVE`, but the external `ummi-hourly-product-builder` remains `PAUSED`
until this activation-state diff is independently approved, committed, and
pushed. Its deterministic next action is the smallest `L-01` identity and
free-only residue purge slice.

At the start of each run, reconcile this cursor against `ops/BACKLOG.md` and the repository. The source of truth is the backlog plus run-log evidence; update this file to the selected task/subtask, commit hash when applicable, blocking prerequisite, and next deterministic action before the run ends.

Selection algorithm:

1. Validate any `active` item first; select its smallest unfinished acceptance slice. If it is blocked, select its recorded next safe local action.
2. Otherwise select the lowest-numbered non-`done` `L-*` item whose preceding launch items are `done`.
3. If provider credentials/configuration block that item, record the exact prerequisite, then select the earliest non-`done` local design, test, migration, documentation, or adversarial-review slice that advances it.
4. If no safe local slice remains and a blocker's next retry time has not arrived, release the lock and exit without file changes or repeat notification. At or after the retry time, execute one bounded prerequisite audit, update the blocker evidence/backoff, and send the precise deduplicated user request only when the state changed.
5. Only stop autonomous selection at the mission stop condition.

Never skip a gate, invent access, loop on a known blocker without new evidence, or quietly change task status.
