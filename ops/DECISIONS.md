# Decisions

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-08-01 | Rename the public product to Ummi. | Establishes one durable product identity. |
| 2026-08-01 | Launch free-only. | Payments, Stripe, plans, subscriptions, and checkout are out of scope. |
| 2026-08-01 | Pin production to `ummi-app/therapy`, Supabase `ptwlncpljcfssoarbatc`, Cloudflare `465be161024b651d369bf5b091b46dfe`, and `ummi.app`. | Prevents cross-project live writes. |
| 2026-08-01 | Authorize prelaunch replacement/deletion of obsolete config/DNS/domain/auth/RLS/storage only within pinned targets. | Allows launch work while protecting post-user data. |
| 2026-08-01 | Use GPT-5.6 Terra medium under a persisted single-flight hourly automation. | Provides bounded autonomous execution. |
| 2026-08-01 | Stop after `L-01`–`L-10`, exhaustive production acceptance, and terminal marker. | Prevents autonomous scope expansion. |
