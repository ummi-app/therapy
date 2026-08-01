import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the discrepancy-first Ummi workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(
    html,
    /<title>Ummi — Catch therapy billing mistakes early<\/title>/i,
  );
  assert.match(html, /Catch problems before care stops/i);
  assert.match(html, /scheduled, attended, billed, processed, and paid/i);
  assert.match(html, /Review evidence &amp; call script/i);
  assert.match(html, /When units may run out/i);
  assert.match(html, /You’re exploring a sample family workspace/i);
  assert.match(html, /Session records checked/i);
});

test("does not expose app monetization controls or legacy identity", async () => {
  const [page, ledger, styles] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/ledger.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(page, /ummi-reconciliation-v1/);
  assert.match(page, /migrateLedgerStorage\(window\.localStorage\)/);
  assert.match(page, /const next = normalizeLedger\(candidate\)/);
  assert.match(ledger, /UMMI EVIDENCE SUMMARY/);
  const forbidden = new RegExp(
    ["care" + "ledger", "mock check" + "out", "pric" + "ing-grid", "up" + "grade-card", "subscri" + "ption"].join("|"),
    "i",
  );
  for (const source of [page, ledger, styles]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test("includes all eight required product workflows", async () => {
  const [page, engine, readme] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/ledger.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  assert.match(page, /Billing\/CPT code/);
  assert.match(page, /Provider cancelled/);
  assert.match(page, /Provider billed/);
  assert.match(page, /Insurer processed/);
  assert.match(page, /Parent paid/);
  assert.match(page, /pdfjs-dist/);
  assert.match(page, /Mark this case resolved/);
  assert.match(page, /Resolution note \(optional\)/);
  assert.match(page, /RESOLVED CASES/);
  assert.match(page, /Add another billing code/);
  assert.match(page, /Save source only/);
  assert.match(page, /data-label="Insurer processed"/);
  assert.match(page, /Edit authorization/);
  assert.match(page, /Edit session/);
  assert.match(page, /Edit claim/);
  assert.match(page, /reconciliation refreshed/);
  assert.match(page, /Used in sessions/);
  assert.match(page, /CHECK BEFORE CONTINUING/);
  assert.doesNotMatch(page, /window\.confirm/);
  assert.match(engine, /detectIssues/);
  assert.match(engine, /projectedRunout/);
  assert.match(engine, /CALL SCRIPT/);
  assert.match(engine, /REQUESTED RESOLUTION/);
  assert.match(engine, /has been pending/);
  assert.match(readme, /stay in this browser on this device/i);
});
