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

- Add, edit, remove, and update usage on therapy authorization plans.
- Track claims, change their status, filter them, and remove records you no longer need.
- Maintain a document readiness checklist with optional private reference links.
- Add and complete follow-up tasks in a combined care timeline.
- Back up the complete workspace to JSON and restore it on this device.
- Try the mock subscription checkout from the sidebar upgrade card.

## Important MVP boundaries

This local version does not upload data, submit claims, provide medical or legal
advice, or take a real payment. Records are stored only in this browser on this
device. A production version should use authenticated, privacy-safe storage and
a trusted payment processor before accepting protected health information.
