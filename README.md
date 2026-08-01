# CareLedger

CareLedger is a local-first MVP for families coordinating recurring pediatric
therapy. It makes authorization runways, claims that need attention, documents,
and follow-ups visible in one place.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## What you can use today

- Add therapy authorization plans for a child and provider.
- Review remaining approved hours across active plans.
- Track claim status, at-risk amounts, and next actions.
- Check off follow-up tasks; changes persist in this browser's local storage.
- Try the mock subscription checkout from the sidebar upgrade card.

## Important MVP boundaries

This local version does not upload data, submit claims, provide medical or legal
advice, or take a real payment. A production version should use privacy-safe
storage and a trusted payment processor before accepting protected health
information.
