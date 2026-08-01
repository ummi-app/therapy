import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url);
const verifier = new URL("../scripts/verify-free-only.mjs", import.meta.url);

async function artifactFixture(source) {
  const fixture = await mkdtemp(join(tmpdir(), "ummi-free-only-"));
  const client = join(fixture, "client");
  await mkdir(client);
  await cp(new URL("../public/og.png", import.meta.url), join(client, "og.png"), {
    recursive: false,
    force: true,
  });
  await cp(new URL("../public/favicon.svg", import.meta.url), join(client, "favicon.svg"), {
    recursive: false,
    force: true,
  });
  await writeFile(join(fixture, "adversarial.js"), source);
  return fixture;
}

async function indexedSourceFixture() {
  const fixture = await mkdtemp(join(tmpdir(), "ummi-index-source-"));
  await mkdir(join(fixture, "public"));
  await cp(new URL("../public/og.png", import.meta.url), join(fixture, "public", "og.png"));
  await cp(new URL("../public/favicon.svg", import.meta.url), join(fixture, "public", "favicon.svg"));
  execFileSync("git", ["init"], { cwd: fixture, stdio: "pipe" });
  return fixture;
}

function mustFailArtifact(path, label = "artifact") {
  assert.throws(
    () => execFileSync("node", [verifier.pathname, "--artifact", path], { cwd: root.pathname, stdio: "pipe" }),
    new RegExp(`Free-only verification failed`, "i"),
    label,
  );
}

test("rejects adversarial monetization artifacts across route, env, state, and UI surfaces", async () => {
  const fixtures = [
    'export const subscribe = () => 0;',
    'fetch("/api/upgrade");',
    'UMMI_PAYMENT_API_KEY;',
    'export const plan = "Pro";',
    'export const checkoutRoute = "/api/checkout";',
    'const subscription = { active: true };',
    'localStorage.setItem("plan", "Pro");',
    'fetch("https://payments.example.test/collect");',
    'const billingPortalUrl = "/portal";',
    'const paymentState = {};',
    'const stripeClient = {};',
    'PAYMENT_API_KEY;',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;',
    'const tier = "Premium";',
    '<div className="pricing-card"></div>',
    '<span>Subscribe</span>',
    '<p>Upgrade to Pro</p>',
    '<div>Go Pro</div>',
    '<p>Premium access costs $15</p>',
    '.upgrade-card { color: red; }',
    '.subscription { color: blue; }',
  ];
  for (const [index, source] of fixtures.entries()) {
    const fixture = await artifactFixture(source);
    try {
      mustFailArtifact(fixture, `fixture ${index}: ${source}`);
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  }
});

test("documents the exact source-scan exclusions while ordinary tests stay in scope", () => {
  const output = execFileSync("node", [verifier.pathname], { cwd: root.pathname, encoding: "utf8" });
  assert.match(output, /tests\/free-only\.test\.mjs/);
  assert.match(output, /tracked product sources/);
});

test("rejects changed branded assets in an otherwise valid artifact", async () => {
  const changes = [
    ["og.png", Buffer.from("not-an-approved-png"), /Open Graph image failed approved identity validation/],
    ["favicon.svg", "<svg viewBox=\"0 0 64 64\" />", /Ummi favicon failed approved identity validation/],
  ];
  for (const [name, content, expected] of changes) {
    const fixture = await artifactFixture("export const insurerPaid = 540;");
    try {
      await writeFile(join(fixture, "client", name), content);
      assert.throws(
        () => execFileSync("node", [verifier.pathname, "--artifact", fixture], { cwd: root.pathname, stdio: "pipe" }),
        expected,
      );
    } finally {
      await rm(fixture, { recursive: true, force: true });
    }
  }
});

test("only excludes the exact PDF worker artifact path", async () => {
  const fixture = await artifactFixture("export const insurerPaid = 540;");
  try {
    await writeFile(join(fixture, "client", "pdf.worker.min.mjs"), "const subscription = {}; ");
    execFileSync("node", [verifier.pathname, "--artifact", fixture], { cwd: root.pathname, stdio: "pipe" });
    await writeFile(join(fixture, "client", "pdf.worker.min.mjs.backup"), "const subscription = {}; ");
    mustFailArtifact(fixture);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test("reads staged source blobs rather than cleaner working-tree bytes", async () => {
  const fixture = await indexedSourceFixture();
  try {
    const source = join(fixture, "source.js");
    await writeFile(source, "const subscription = {}; ");
    execFileSync("git", ["add", "public", "source.js"], { cwd: fixture, stdio: "pipe" });
    await writeFile(source, "const insurerPaid = 540;");
    assert.throws(
      () => execFileSync("node", [verifier.pathname], { cwd: fixture, stdio: "pipe" }),
      /Free-only verification failed/,
    );
    await rm(source);
    assert.throws(
      () => execFileSync("node", [verifier.pathname], { cwd: fixture, stdio: "pipe" }),
      /Free-only verification failed/,
    );
    await writeFile(join(fixture, "public", "og.png"), "wrong staged brand");
    execFileSync("git", ["add", "public/og.png"], { cwd: fixture, stdio: "pipe" });
    await cp(new URL("../public/og.png", import.meta.url), join(fixture, "public", "og.png"));
    assert.throws(
      () => execFileSync("node", [verifier.pathname], { cwd: fixture, stdio: "pipe" }),
      /Open Graph image failed approved identity validation/,
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
