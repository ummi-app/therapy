# Hourly execution cursor

Current phase: `L-02` active. `L-01` is done: independently approved staged
tree `c9903e1e0987273d697120a4d16b288400134248` (binary diff SHA-256
`c27bf322d8fe2a946d3c84e106ac1e233f049e848170b7ce93e1c367882c59fe`) was
committed and pushed as `a1862dcf80168cc58900c1f07892f3aa103d0cf3`. The next
deterministic action is the smallest `L-02` data-flow inventory and versioned
Supabase schema/RLS-plan slice.

Last reconciled runs: the bootstrap final staged-tree reference
`a116dca406a632280e51ba01ba65383872c4f50a` and approved diff SHA-256
`9d4d1f139659e1daa1c556a039998bfb4981f4229574e16cc67a8d5fe1dae24b` map to
reviewed, pushed `main` commit `d2e0574c38b30516c53aa2034c1d50c761cebd31`.
The activation final staged-tree reference
`62f84d0e223b712d2cd93e9202169309667e0412` and approved diff SHA-256
`1138c2ae6509dbe53969ef755c8fa3253df09e1424953cbf4000ef32b3cab924` were
independently approved by `review_ummi_activation`, committed/pushed as
`db9aa4ec0b74227f609d104f2f70cf77aa5aea46`, and then externally verified
`ACTIVE`. `manual-l01-20260801T193600Z` completed the repository and local
production-artifact identity/free-only purge with named verifier evidence. Its
reviewed product result was reconciled in the separate
`manual-l01-close-20260801T204800Z` ops-only closure; selection now advances
to `L-02`, not deployment.

At the start of each run, reconcile this cursor against `ops/BACKLOG.md` and the repository. The source of truth is the backlog plus run-log evidence; update this file to the selected task/subtask, commit hash when applicable, blocking prerequisite, and next deterministic action before the run ends.

Selection algorithm:

1. Validate any `active` item first; select its smallest unfinished acceptance slice. If it is blocked, select its recorded next safe local action.
2. Otherwise select the lowest-numbered non-`done` `L-*` item whose preceding launch items are `done`.
3. If provider credentials/configuration block that item, record the exact prerequisite, then select the earliest non-`done` local design, test, migration, documentation, or adversarial-review slice that advances it.
4. If no safe local slice remains and a blocker's next retry time has not arrived, release the lock and exit without file changes or repeat notification. At or after the retry time, execute one bounded prerequisite audit, update the blocker evidence/backoff, and send the precise deduplicated user request only when the state changed.
5. Only stop autonomous selection at the mission stop condition.

Never skip a gate, invent access, loop on a known blocker without new evidence, or quietly change task status.
