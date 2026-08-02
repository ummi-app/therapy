# Decisions

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-08-01 | Rename the public product to Ummi. | Establishes one durable product identity. |
| 2026-08-01 | Launch free-only. | Ummi payment collection, Stripe, paid plans, subscriptions, and checkout are out of scope; claim/EOB payment facts remain core reconciliation data. |
| 2026-08-01 | Pin production to `ummi-app/therapy`, Supabase `ptwlncpljcfssoarbatc`, Cloudflare `465be161024b651d369bf5b091b46dfe`, and `ummi.app`. | Prevents cross-project live writes. |
| 2026-08-01 | Authorize prelaunch replacement/deletion of obsolete config/DNS/domain/auth/RLS/storage only within pinned targets. | Allows launch work while protecting post-user data. |
| 2026-08-01 | Use GPT-5.6 Terra medium under a persisted single-flight hourly automation. | Provides bounded autonomous execution. |
| 2026-08-01 | Change the persisted hourly automation executor to GPT-5.6 Luna at high reasoning. | Aligns the repository contract with the user-approved automation configuration. |
| 2026-08-01 | Stop after `L-01`–`L-10`, exhaustive production acceptance, and terminal marker. | Prevents autonomous scope expansion. |
| 2026-08-01 | Keep original imported file bytes local; persist only user-confirmed normalized document text and allowlisted extracted fields, with no launch Storage bucket. | Preserves the current privacy boundary and makes the L-02 persistence/RLS surface explicit. |
| 2026-08-01 | Use restrictive business-record foreign keys and an explicit reverse-order account-deletion workflow; ordinary parent deletes must not erase historical claims or sessions. | Preserves reconciliation history and makes destructive deletion a tested account-level operation in L-04. |
| 2026-08-02 | Delegate independent adversarial commit review to configured local Cline CLI with OpenRouter `deepseek/deepseek-v4-pro` at high thinking, read-only. | Preserves Luna High for implementation while providing a separately invoked model for exact staged-tree review without allowing reviewer writes. |
