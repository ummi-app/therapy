import assert from "node:assert/strict";
import test from "node:test";
import { buildEvidencePacket, detectIssues, extractDocument, getForecasts, getReconciliationRows, seedLedger } from "../lib/ledger.ts";

test("reconciles scheduled, attended, billed, processed, and paid values", () => {
  const row = getReconciliationRows(seedLedger).find((item) => item.session.id === "session-2");
  assert.deepEqual({ scheduled: row.scheduled, attended: row.attended, providerBilled: row.providerBilled, insurerProcessed: row.insurerProcessed, parentPaid: row.parentPaid }, { scheduled: 8, attended: 8, providerBilled: 16, insurerProcessed: 16, parentPaid: 0 });
  assert.equal(row.mismatch, true);
});

test("flags excess billing, cancelled-session billing, provider-ledger mismatch, denials, and stale claims", () => {
  const ids = new Set(detectIssues(seedLedger, "2026-07-31").map((issue) => issue.id));
  assert.ok(ids.has("units-session-2"));
  assert.ok(ids.has("units-session-3"));
  assert.ok(ids.has("reported-line-97153"));
  assert.ok(ids.has("denied-claim-2"));
  assert.ok(ids.has("pending-claim-3"));
});

test("forecasts remaining units and a runout date from recent attendance", () => {
  const forecast = getForecasts(seedLedger, "2026-07-31").find((item) => item.lineId === "line-97530");
  assert.equal(forecast.attended, 16);
  assert.equal(forecast.remaining, 144);
  assert.equal(forecast.weeklyRate, 4);
  assert.match(forecast.projectedRunout, /^\d{4}-\d{2}-\d{2}$/);
});

test("extracts authorization and EOB facts from document text", () => {
  const authorization = extractDocument("AUTHORIZATION LETTER\nAuthorization Number: OT-4401\nPatient: Maya Rivera\nProvider: Bright Path OT\nCPT Code: 97530\nApproved Units: 160\nStart Date: 05/19/2026\nEnd Date: 08/18/2026");
  assert.equal(authorization.kind, "Authorization");
  assert.equal(authorization.fields.authorizationNumber, "OT-4401");
  assert.equal(authorization.fields.billingCode, "97530");
  assert.equal(authorization.fields.approvedUnits, "160");
  const eob = extractDocument("EXPLANATION OF BENEFITS\nClaim Number: CLM-99\nService Date: 07/11/2026\nCPT: 97153\nUnits Billed: 16\nUnits Processed: 12\nProvider Billed: $1,200\nAllowed Amount: $720\nInsurance Paid: $540\nPatient Responsibility: $180");
  assert.equal(eob.kind, "EOB");
  assert.equal(eob.fields.claimNumber, "CLM-99");
  assert.equal(eob.fields.parentResponsibility, "180");
});

test("generates an evidence summary, call script, and requested resolution", () => {
  const issue = detectIssues(seedLedger, "2026-07-31").find((item) => item.id === "units-session-3");
  const packet = buildEvidencePacket(issue, seedLedger);
  assert.match(packet, /SESSION RECONCILIATION/);
  assert.match(packet, /Provider cancelled/);
  assert.match(packet, /CALL SCRIPT/);
  assert.match(packet, /Please do not move this balance to self-pay/);
  assert.match(packet, /REQUESTED RESOLUTION/);
});
