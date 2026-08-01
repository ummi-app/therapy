# Hourly automation contract

| Field | Value |
| --- | --- |
| Executor | GPT-5.6 Terra, medium reasoning |
| Automation project cwd | `/Users/rohan/repos` |
| Task repository cwd | `/Users/rohan/repos/therapy-coverage-ledger` |
| Cadence | Hourly at minute `5`, one run at a time |
| Automation ID | `ummi-hourly-product-builder` |
| Status | `PAUSED`; activate only after a reviewed commit has been pushed |
| Persisted state | This file, `ops/CURSOR.md`, `ops/BACKLOG.md`, and `ops/RUN_LOG.md` in the pinned repository |
| Terminal marker | `not-complete`; set `complete:<release commit>` only after the mission stop condition |

## Single-flight and lifecycle

Acquire the lock with `scripts/automation-lock.sh acquire <run-id>` before reading or changing state. The helper fully writes an owner record and then atomically publishes `ops/.hourly.lock`; interruption before publication leaves no lock, and interruption after publication leaves a complete recoverable lock. It never reclaims by age: if a lock exists, exit without work and log nothing. To recover a crashed owner, first verify through the Codex thread/automation tools that the exact owner run is inactive or completed, then run `UMMI_LOCK_OWNER_INACTIVE_CONFIRMED=yes scripts/automation-lock.sh recover <owner-run-id>` and record the evidence in the next run. Acquire a new lock separately. Release only with the matching owner ID after persisting cursor/log state; a late prior owner cannot release its successor's lock. Never overlap runs.

After locking and before selection or edits, require branch `main`, a configured upstream, and a clean index/worktree. Reconcile `HEAD` to its upstream: push an already-reviewed known local commit before any new work, but stop on behind, diverged, unreviewed-ahead, or unexpected dirty state. Fingerprint unexpected changes and leave them untouched. Record an explicit intended-file allowlist before implementation, stage only those exact files (never broad `git add`), and compare status plus the final diff with that allowlist. Any unexpected or overlapping external edit blocks the commit rather than being swept into it.

At terminal completion, disable/pause `ummi-hourly-product-builder` and set the terminal marker. Every later invocation checks the marker before lock acquisition and is a no-op that reports completion; it does not reopen work.

## Commit-result reconciliation

A commit cannot contain its own hash or staged-tree hash without changing that hash. Before selecting new work, reconcile the previous run's externally captured staged-tree reference and commit intent against Git history/upstream state, then record that prior result in the new tracked run entry. The automation result captures the current final staged-tree reference, intended message, branch, reviewer, and approval outside the reviewed tree. Do not edit the staged tree after approval. The next run brings that result into the tracked log. The terminal ops commit records the already-deployed source commit and artifact digest; that source commit, not the later ops-only marker commit, is the release commit.

## Blockers

Fingerprint a blocker from task ID, target, operation, and normalized non-secret error. Persist first/last-seen time, attempt count, next retry time, and exact prerequisite in the run log. Do not repeat an unchanged blocker notification; retry only after exponential bounded backoff or new evidence/credentials. Deduplicate concurrent and repeat reports by fingerprint. Continue the deterministic safe local action selected by `ops/CURSOR.md`.
