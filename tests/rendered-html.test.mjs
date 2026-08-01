import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the CareLedger family coverage workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>CareLedger — Therapy coverage made clear<\/title>/i);
  assert.match(html, /Keep care moving/i);
  assert.match(html, /Authorization runway/i);
  assert.match(html, /Claims at a glance/i);
  assert.match(html, /CareLedger turns therapy authorizations/i);
});

test("includes the local-first workflows and pricing guardrails", async () => {
  const [page, readme] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);

  assert.match(page, /localStorage/);
  assert.match(page, /Add coverage/);
  assert.match(page, /Add claim/);
  assert.match(page, /Mock checkout/);
  assert.match(page, /plan-name">Family/);
  assert.match(readme, /does not upload data/i);
  assert.match(readme, /or take a real payment/i);
});
