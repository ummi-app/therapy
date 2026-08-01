# CareLedger

CareLedger is a device-local pediatric therapy authorization and billing
reconciliation MVP. It helps a parent catch unit-count, attendance, claim, and
payment discrepancies before care is interrupted or a balance becomes a
surprise bill.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To exercise document extraction immediately, import one of the files in
`examples/careledger-samples/` from the Evidence screen.

## Implemented workflows

- Track authorization units separately by billing or CPT code.
- Log scheduled, attended, child-cancelled, and provider-cancelled sessions.
- Compare scheduled, attended, provider-billed, insurer-processed, and
  parent-paid units for every session.
- Import text-based PDF, TXT, CSV, or pasted authorization/EOB/statement text;
  extract key fields and create the corresponding local record.
- Detect cancelled-session billing, excess billed units, provider-ledger
  mismatches, denied and stale claims, and overpayments.
- Forecast unit runout and authorization renewal windows from recent usage.
- Generate a call script, evidence summary, and correction or appeal request.
- Surface in-app reminders when claims stall or renewals approach.
- Export and restore a private JSON backup and try the mock subscription flow.

## Privacy and MVP boundaries

Records and imported document text stay in this browser on this device. The app
does not upload documents, connect to an insurer or provider, submit claims,
send notifications outside the app, provide medical or legal advice, or take a
real payment. Scanned-image PDFs require OCR before import. Verify every number
against the original authorization, EOB, and provider statement.
