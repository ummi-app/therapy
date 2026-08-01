# Ummi operator rules

Use `.agents/skills/ummi-autonomous-operator/SKILL.md` for every autonomous product, infrastructure, release, or maintenance cycle in this repository.

The product is **Ummi**. Its mission is to help parents catch pediatric therapy authorization and billing discrepancies before care is interrupted or a balance becomes a surprise bill. It is free-only: Stripe, payments, plans, subscriptions, checkout, placeholders, mock flows, and unimplemented visible controls are prohibited.

Keep `main` deployable. Before every commit, a separate independent reviewer who did not implement the slice must approve the exact final staged diff, including ops/log changes. Any fix invalidates approval and requires a fresh review. Before every deploy, independently review the exact commit/artifact, provider diff, migrations, preview, and rollback plan. Follow `ops/SHIP_CRITERIA.md` and push every successful commit to its configured upstream immediately; stop on push failure.
