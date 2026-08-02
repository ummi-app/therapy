# Ummi operator rules

Use `.agents/skills/ummi-autonomous-operator/SKILL.md` for every autonomous product, infrastructure, release, or maintenance cycle in this repository.

The product is **Ummi**. Its mission is to help parents catch pediatric therapy authorization and billing discrepancies before care is interrupted or a balance becomes a surprise bill. It is free-only: Stripe, app payment collection, paid plans, subscriptions, checkout, placeholders, mock flows, and unimplemented visible controls are prohibited. Claim and EOB payment facts (such as insurer-paid and family-responsibility amounts) are essential reconciliation data and remain allowed.

Keep `main` deployable. Before every commit, a separate independent reviewer who did not implement the slice must approve the exact final staged diff, including ops/log changes. Any fix invalidates approval and requires a fresh review. Before every deploy, independently review the exact commit/artifact, provider diff, migrations, preview, and rollback plan. Follow `ops/SHIP_CRITERIA.md` and push every successful commit to its configured upstream immediately; stop on push failure.

For commit-gate adversarial reviews, use the repository's configured Cline CLI with OpenRouter model `deepseek/deepseek-v4-pro` in read-only mode, following the exact-review protocol in `ops/SHIP_CRITERIA.md`. Luna High remains the implementer; Cline/DeepSeek is the named independent reviewer. If Cline or its configured model is unavailable, do not substitute a Codex model or commit: record the blocker and require explicit user direction.
