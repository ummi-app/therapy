import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const artifactRoot = process.argv[2] === "--artifact" ? process.argv[3] : null;

if (process.argv.length > (artifactRoot ? 4 : 2)) {
  throw new Error("Usage: node scripts/verify-free-only.mjs [--artifact <directory>]");
}
if (artifactRoot && (!existsSync(artifactRoot) || !statSync(artifactRoot).isDirectory())) {
  throw new Error(`Artifact directory is unavailable: ${artifactRoot}`);
}

const brandAssets = [
  {
    label: "Open Graph image",
    source: "public/og.png",
    artifact: "client/og.png",
    sha256: "d2d9586165efe9f90f762ec7965de510d4912a0ad8660ada49c383581c7a1741",
    validate: (data) =>
      data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      data.readUInt32BE(16) === 1731 &&
      data.readUInt32BE(20) === 909,
  },
  {
    label: "Ummi favicon",
    source: "public/favicon.svg",
    artifact: "client/favicon.svg",
    sha256: "dbd18ca63934c0a5b722cf7bf07b46a0b6b29b3eb887e7865ae0771601151700",
    validate: (data) => {
      const svg = data.toString("utf8");
      return /<svg\b[^>]*\bwidth="64"[^>]*\bheight="64"[^>]*\bviewBox="0 0 64 64"/.test(svg) && /<title[^>]*>Ummi<\/title>/.test(svg);
    },
  },
];

// Product source scanning is deterministic from the Git index. Policy/agent
// instructions and this verifier are excluded because they name prohibited
// concepts; `tests/free-only.test.mjs` is the sole excluded negative fixture.
const excludedSourcePaths = ["AGENTS.md", "scripts/verify-free-only.mjs", "tests/free-only.test.mjs"];

const forbidden = [
  ["legacy product identity", /careledger|care ledger/i],
  ["payment processor", /\bstripe(?:Client)?\b/i],
  ["paid tier or plan", /\bpaid[-\s]?(?:tier|plan)s?\b/i],
  ["billing portal", /\bbilling\s+portal\b/i],
  ["per-month price copy", /(?:\$|USD\s*)\s*\d+(?:[.,]\d{2})?\s*(?:\/|per\s*)(?:month|mo)\b/i],
  ["payment-processor or collection copy", /\b(?:payment\s+(?:processor|processing|method|collection|gateway)|(?:collect|accept|process)\s+(?:a\s+)?payments?)\b/i],
  ["payment environment/config", /\b(?:(?:NEXT_PUBLIC_)?(?:UMMI_)?(?:PAYMENT|STRIPE|BILLING|CHECKOUT|PRICING|SUBSCRIPTION)_[A-Z0-9_]+|(?:PAYMENT|STRIPE)_[A-Z0-9_]+)\b/i],
  ["monetization route/file name", /(?:^|[/.])(?:subscribe|subscription|upgrade|pricing|checkout|payment|paid[-_](?:plan|tier))(?:[/.]|$)/i],
  ["monetization API/host", /(?:\/api\/(?:subscribe|subscription|upgrade|pricing|checkout|payment|billing)\b|https?:\/\/[^\s"']*(?:payment|billing|checkout|stripe)[^\s"']*)/i],
  ["standalone monetization export", /\bexport\s+const\s+(?:subscribe|subscription|upgrade|pricing|checkout|payment)\b/i],
  ["monetization artifact declaration", /\b(?:const|let|var|export\s+const)\s+(?:subscription|billingPortalUrl|paymentState|stripeClient)\b/i],
  ["monetization identifier", /\b(?:subscribe|subscription|upgrade|pricing|checkout)\w*\b|\b(?:billingPortalUrl|paymentState|stripeClient)\b/i, "source"],
  ["monetization storage key", /localStorage\.(?:getItem|setItem)\([^)]*(?:plan|tier|subscription|payment)/i],
  ["monetization state", /(?:\b(?:const|let|var|export\s+const)\s+(?:subscribe|subscription|upgrade|pricing|checkout|plan|tier|payment|paymentState)\s*=\s*["']?(?:pro|personal|family|premium|paid)|useState\(\s*["'](?:pro|personal|family|premium|paid)["'])/i],
  ["monetization component", /\b(?:function|class)\s+(?:Subscribe|Upgrade|Pricing|Checkout)(?:Modal|Page|Card|Button)?\b/],
  ["monetization CSS/UI", /(?:\.(?:subscribe|subscription|upgrade|pricing|checkout|paid[-_](?:plan|tier))\b|<(?:a|button|div|section|article|span|p)\b[^>]*(?:class|className)=["'][^"']*(?:subscribe|subscription|upgrade|pricing|checkout|paid[-_](?:plan|tier))|<(?:a|button|div|section|article|span|p)\b[^>]*>[\s\S]{0,120}\b(?:subscribe|upgrade|pricing|checkout|go\s+pro|premium\s+access\s+costs)\b)/i],
];

function allFiles(root) {
  const result = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) result.push(...allFiles(path));
    else if (entry.isFile()) result.push(path);
  }
  return result;
}

function sourceFiles() {
  return execFileSync("git", ["ls-files", "-z"], { encoding: "buffer" })
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter(
      (path) =>
        !path.startsWith("ops/") &&
        !path.startsWith(".agents/") &&
        !excludedSourcePaths.includes(path),
    );
}

function readIndexed(path) {
  return execFileSync("git", ["show", `:${path}`], { encoding: "buffer", maxBuffer: 5 * 1024 * 1024 });
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function validateBrandAssets(root) {
  for (const asset of brandAssets) {
    const path = root ? join(root, asset.artifact) : asset.source;
    if (!existsSync(path)) throw new Error(`${asset.label} is missing: ${path}`);
    const data = root ? readFileSync(path) : readIndexed(path);
    if (sha256(data) !== asset.sha256 || !asset.validate(data)) {
      throw new Error(`${asset.label} failed approved identity validation: ${path}`);
    }
  }
}

validateBrandAssets(artifactRoot);
const scope = artifactRoot
  ? allFiles(artifactRoot).map((path) => ({ path: relative(artifactRoot, path), absolute: path }))
  : sourceFiles().map((path) => ({ path, absolute: path }));

const failures = [];
for (const file of scope) {
  const exactWorker = artifactRoot ? "client/pdf.worker.min.mjs" : "public/pdf.worker.min.mjs";
  if (file.path === exactWorker) continue;
  const text = (artifactRoot ? readFileSync(file.absolute) : readIndexed(file.path)).toString("utf8");
  for (const [label, pattern, scopeType] of forbidden) {
    if (scopeType === "source" && artifactRoot) continue;
    if (pattern.test(file.path) || pattern.test(text)) failures.push(`${file.path}: ${label}`);
  }
}

if (failures.length) throw new Error(`Free-only verification failed:\n${failures.join("\n")}`);
const scannedCount = scope.filter((file) => file.path !== (artifactRoot ? "client/pdf.worker.min.mjs" : "public/pdf.worker.min.mjs")).length;
console.log(`Free-only verification passed for ${artifactRoot ? `artifact ${artifactRoot}` : "tracked product sources"} (${scannedCount} files; exclusions: ops/, .agents/, ${excludedSourcePaths.join(", ")}, ${artifactRoot ? "client/pdf.worker.min.mjs" : "public/pdf.worker.min.mjs"}).`);
