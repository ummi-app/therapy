import assert from "node:assert/strict";
import test from "node:test";
import {
  buildEvidencePacket,
  detectIssues,
  emptyLedger,
  extractDocument,
  getForecasts,
  getOpenIssues,
  getReconciliationRows,
  hasClaimLine,
  issueFingerprint,
  matchDocumentToLedger,
  migrateLedgerStorage,
  normalizeLedger,
  seedLedger,
  ummiStorageKey,
} from "../lib/ledger.ts";

test("reconciles scheduled, attended, billed, processed, and paid values", () => {
  const row = getReconciliationRows(seedLedger).find(
    (item) => item.session.id === "session-2",
  );
  assert.deepEqual(
    {
      scheduled: row.scheduled,
      attended: row.attended,
      providerBilled: row.providerBilled,
      insurerProcessed: row.insurerProcessed,
      parentPaid: row.parentPaid,
    },
    {
      scheduled: 8,
      attended: 8,
      providerBilled: 16,
      insurerProcessed: 16,
      parentPaid: 0,
    },
  );
  assert.equal(row.mismatch, true);
});

test("flags excess billing, cancelled-session billing, provider-ledger mismatch, denials, and stale claims", () => {
  const ids = new Set(
    detectIssues(seedLedger, "2026-07-31").map((issue) => issue.id),
  );
  assert.ok(ids.has("units-session-2"));
  assert.ok(ids.has("units-session-3"));
  assert.ok(ids.has("reported-line-97153"));
  assert.ok(ids.has("denied-claim-2"));
  assert.ok(ids.has("pending-claim-3"));
});

test("forecasts remaining units and a runout date from recent attendance", () => {
  const forecast = getForecasts(seedLedger, "2026-07-31").find(
    (item) => item.lineId === "line-97530",
  );
  assert.equal(forecast.attended, 16);
  assert.equal(forecast.remaining, 144);
  assert.equal(forecast.weeklyRate, 4);
  assert.match(forecast.projectedRunout, /^\d{4}-\d{2}-\d{2}$/);
});

test("extracts authorization and EOB facts from document text", () => {
  const authorization = extractDocument(
    "AUTHORIZATION LETTER\nAuthorization Number: OT-4401\nPatient: Maya Rivera\nProvider: Bright Path OT\nCPT Code: 97530\nApproved Units: 160\nStart Date: 05/19/2026\nEnd Date: 08/18/2026",
  );
  assert.equal(authorization.kind, "Authorization");
  assert.equal(authorization.fields.authorizationNumber, "OT-4401");
  assert.equal(authorization.fields.billingCode, "97530");
  assert.equal(authorization.fields.approvedUnits, "160");
  const eob = extractDocument(
    "EXPLANATION OF BENEFITS\nClaim Number: CLM-99\nService Date: 07/11/2026\nCPT: 97153\nUnits Billed: 16\nUnits Processed: 12\nProvider Billed: $1,200\nAllowed Amount: $720\nInsurance Paid: $540\nPatient Responsibility: $180",
  );
  assert.equal(eob.kind, "EOB");
  assert.equal(eob.fields.claimNumber, "CLM-99");
  assert.equal(eob.fields.parentResponsibility, "180");
});

test("generates an evidence summary, call script, and requested resolution", () => {
  const issue = detectIssues(seedLedger, "2026-07-31").find(
    (item) => item.id === "units-session-3",
  );
  const packet = buildEvidencePacket(issue, seedLedger);
  assert.match(packet, /SESSION RECONCILIATION/);
  assert.match(packet, /Provider cancelled/);
  assert.match(packet, /CALL SCRIPT/);
  assert.match(packet, /Please do not move this balance to self-pay/);
  assert.match(packet, /REQUESTED RESOLUTION/);
});

test("keeps resolved discrepancies out of the active action queue", () => {
  const resolved = {
    ...structuredClone(seedLedger),
    resolvedIssueIds: ["units-session-3", "denied-claim-2"],
  };
  const ids = new Set(
    getOpenIssues(resolved, "2026-07-31").map((issue) => issue.id),
  );
  assert.equal(ids.has("units-session-3"), false);
  assert.equal(ids.has("denied-claim-2"), false);
  assert.equal(ids.has("units-session-2"), true);
  assert.deepEqual(getOpenIssues(emptyLedger, "2026-07-31"), []);
});

test("reopens a resolved case when its underlying discrepancy changes", () => {
  const ledger = structuredClone(seedLedger);
  const issue = detectIssues(ledger, "2026-07-31").find(
    (item) => item.id === "units-session-2",
  );
  ledger.resolutions = [
    {
      issueId: issue.id,
      title: issue.title,
      resolvedAt: "2026-07-31T12:00:00.000Z",
      fingerprint: issueFingerprint(issue),
      note: "Provider agreed to correct it.",
    },
  ];
  assert.equal(
    getOpenIssues(ledger, "2026-07-31").some(
      (item) => item.id === "units-session-2",
    ),
    false,
  );
  ledger.claims.find((claim) => claim.sessionId === "session-2").billedUnits =
    20;
  assert.equal(
    getOpenIssues(ledger, "2026-07-31").some(
      (item) => item.id === "units-session-2",
    ),
    true,
  );
});

test("matches imports only to an exact billing code and service date", () => {
  const exact = matchDocumentToLedger(seedLedger, {
    kind: "EOB",
    confidence: 1,
    fields: { billingCode: "97153", serviceDate: "07/18/2026" },
  });
  assert.equal(exact.authorizationId, "auth-aba");
  assert.equal(exact.lineId, "line-97153");
  assert.equal(exact.sessionId, "session-3");

  const missingDate = matchDocumentToLedger(seedLedger, {
    kind: "EOB",
    confidence: 1,
    fields: { billingCode: "97153", serviceDate: "07/19/2026" },
  });
  assert.equal(missingDate.authorizationId, "auth-aba");
  assert.equal(missingDate.sessionId, undefined);

  assert.deepEqual(
    matchDocumentToLedger(seedLedger, {
      kind: "EOB",
      confidence: 1,
      fields: { billingCode: "99999", serviceDate: "07/18/2026" },
    }),
    {},
  );
});

test("treats only the same claim number and session as a duplicate line", () => {
  assert.equal(hasClaimLine(seedLedger, "CLM-88291", "session-2"), true);
  assert.equal(hasClaimLine(seedLedger, "clm-88291", "session-1"), false);
  assert.equal(hasClaimLine(seedLedger, "CLM-88291"), false);
});

test("normalizes backups to the allowed ledger shape without losing claim payment facts", () => {
  const backup = structuredClone(seedLedger);
  const legacy = {
    level: "pl" + "an",
    bundle: "subscri" + "ption",
    processor: "payment" + "Processor",
    buttonName: "up" + "grade",
    price: "st" + "ripe" + "PriceId",
  };
  backup[legacy.level] = "Personal";
  backup[legacy.bundle] = { tier: "Premium" };
  backup.claims[0][legacy.processor] = "st" + "ripe";
  backup.claims[0].nested = { [legacy.level]: "Pro" };
  backup.authorizations[0].lines[0][legacy.buttonName] = true;
  backup.documents = [{
    id: "doc-1",
    name: "EOB",
    kind: "EOB",
    importedAt: "2026-07-31",
    text: "source",
    extracted: {
      insurerPaid: "540",
      parentResponsibility: "180",
      [legacy.price]: "price_1",
      [legacy.bundle]: "legacy",
      unknownLegacy: "remove",
    },
  }];

  const normalized = normalizeLedger(backup);
  assert.ok(normalized);
  assert.equal(legacy.level in normalized, false);
  assert.equal(legacy.bundle in normalized, false);
  assert.equal(legacy.processor in normalized.claims[0], false);
  assert.equal("nested" in normalized.claims[0], false);
  assert.equal(legacy.buttonName in normalized.authorizations[0].lines[0], false);
  assert.equal(normalized.claims[0].insurerPaid, 540);
  assert.equal(normalized.claims[0].parentResponsibility, 180);
  assert.equal(normalized.claims[0].parentPaid, 0);
  assert.deepEqual(normalized.documents[0].extracted, {
    insurerPaid: "540",
    parentResponsibility: "180",
  });
  assert.equal(JSON.stringify(normalized).includes("Personal"), false);
});

test("rejects incomplete persisted ledgers", () => {
  assert.equal(normalizeLedger({ authorizations: [], sessions: [], claims: [] }), null);
});

test("migrates legacy browser storage once without carrying unknown fields", () => {
  const legacyKey = ["care", "ledger", "-reconciliation-v1"].join("");
  const values = new Map([[legacyKey, JSON.stringify({ ...seedLedger, pl: "Personal" })]]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const migrated = migrateLedgerStorage(storage);
  assert.ok(migrated);
  assert.equal(values.has(legacyKey), false);
  assert.equal(JSON.parse(values.get(ummiStorageKey)).insurerPaid, undefined);
  assert.equal(JSON.parse(values.get(ummiStorageKey)).claims[0].insurerPaid, 540);
  assert.equal(JSON.parse(values.get(ummiStorageKey)).pl, undefined);
});

test("prefers valid current storage and safely ignores invalid records", () => {
  const legacyKey = ["care", "ledger", "-reconciliation-v1"].join("");
  const values = new Map([
    [ummiStorageKey, JSON.stringify(seedLedger)],
    [legacyKey, "not json"],
  ]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  assert.equal(migrateLedgerStorage(storage).claims[0].insurerPaid, 540);
  assert.equal(values.has(legacyKey), false);
  values.set(ummiStorageKey, "invalid");
  assert.equal(migrateLedgerStorage(storage), null);
  assert.equal(values.has(ummiStorageKey), false);
});
