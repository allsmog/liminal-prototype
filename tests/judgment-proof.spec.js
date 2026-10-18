// Signed judgment record (cut 13 → offline verifier). Every verdict here comes
// from actually running the verifier published at receipts/2026-10-06/bundle/
// verify.mjs as a child `node` process on the bundle the page downloads. No
// assertion reads a success message off the page in place of a verifier run.
//
//   golden    · a pinned record + pinned demo key → pinned packet hash + signature
//   valid     · correct path → download → unzip → self-test, unpinned, pinned
//   tampered  · one byte in the correction, the AI's original, the decision
//   wrong key · a different pinned fingerprint · a swapped public key
//   version   · unknown canonical version · contradictory signature tuple
//   unsigned  · a browser without Ed25519 → bundle verifies as UNVERIFIED (exit 2)
//   failed save · no vault → no proof issued, nothing to download
//   restart   · persistent profile, browser closed and relaunched → the same
//               bytes reopen and verify; the demo key survives
//   dispositions · accept / reject / defer each verify with their own decision
import { test, expect, chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash, createPrivateKey, createPublicKey } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { buildRecord, OPERATOR, FIXTURE } from "../lib/judgment.js";
import * as proofLib from "../lib/judgment-proof.js";

const ROOT = resolve(import.meta.dirname, "..");
const VERIFIER = join(ROOT, "receipts/2026-10-06/bundle/verify.mjs");
const SCENE = "/cuts/13-judgment.html";
const CORRECTION =
  "Only E12 is routine calendar administration. E13 scheduled the design-review calls for the Q3 launch, which is product work.";
const WHY = "Bianca's run came off the launch checklist. The usage export has no ticket column, so the agent could not have seen that.";
const A2 = FIXTURE.assertions.find((a) => a.id === "A2").text;
const sha = (b) => createHash("sha256").update(b).digest("hex");

/* ─── verifier + bundle helpers ───────────────────────────────────── */
function verify(dir, ...args) {
  const r = spawnSync(process.execPath, [join(dir, "verify.mjs"), dir, ...args], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
function selfTest(dir) {
  const r = spawnSync(process.execPath, [join(dir, "verify.mjs"), "--self-test"], { encoding: "utf8" });
  return { code: r.status, out: r.stdout + r.stderr };
}
function unzip(zipPath) {
  const out = mkdtempSync(join(tmpdir(), "jd-proof-"));
  const r = spawnSync("unzip", ["-q", zipPath, "-d", out], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`unzip failed: ${r.stderr}`);
  const [folder] = readdirSync(out);
  return join(out, folder);
}
function copyBundle(dir) {
  const out = mkdtempSync(join(tmpdir(), "jd-copy-"));
  cpSync(dir, out, { recursive: true });
  return out;
}
const readJson = (dir, f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const writeJson = (dir, f, v) => writeFileSync(join(dir, f), JSON.stringify(v, null, 2) + "\n");

/* ─── page helpers ────────────────────────────────────────────────── */
async function open(page, url = SCENE) {
  await page.goto(url, { waitUntil: "load" });
  await expect(page.locator("body")).toHaveClass(/ready/);
}
async function judgeCorrect(page) {
  await open(page);
  await page.locator('details[data-ev="ev-usage"] summary').click();
  await page.locator('details[data-ev="ev-tickets"] summary').click();
  await page.locator('[data-assert="A2"]').click();
  await page.fill("#jd-corrected", CORRECTION);
  await page.locator('[data-tag="assumes_facts_not_in_evidence"]').click();
  await page.fill("#jd-rationale", WHY);
  await page.locator("#jd-review").click();
  await page.locator("#jd-confirm").click();
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "recorded");
}
async function judgeOther(page, d) {
  await open(page);
  await page.locator(`[data-dispo="${d}"]`).click();
  if (d === "reject") await page.fill("#jd-rationale", "The saving rests on A2, and A2 rests on task titles.");
  if (d === "defer") { await page.locator('[data-window="7d"]').click(); await page.fill("#jd-rationale", "Ask Bianca what E13 was."); }
  await page.locator("#jd-review").click();
  await page.locator("#jd-confirm").click();
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "recorded");
}
async function downloadBundle(page) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#jd-proof-dl").click()]);
  const zipPath = join(mkdtempSync(join(tmpdir(), "jd-zip-")), dl.suggestedFilename());
  await dl.saveAs(zipPath);
  return { zipPath, dir: unzip(zipPath), name: dl.suggestedFilename() };
}

/* ─── golden vector · no browser, pinned key, pinned bytes ─────────── */
// A fixed Ed25519 seed for tests only. It is public by being in this file,
// which is exactly why it can never stand for anyone.
const TEST_SEED = Buffer.from("4c696d696e616c2063757420313320746573742d6f6e6c79206b657920210000", "hex");
async function testKeyPair() {
  const der = Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), TEST_SEED]);
  const spki = createPublicKey(createPrivateKey({ key: der, format: "der", type: "pkcs8" })).export({ format: "der", type: "spki" });
  return {
    privateKey: await crypto.subtle.importKey("pkcs8", der, { name: "Ed25519" }, false, ["sign"]),
    publicKey: await crypto.subtle.importKey("raw", spki.subarray(-32), { name: "Ed25519" }, true, ["verify"]),
  };
}
const GOLDEN_IDS = {
  packetId: "7d1c2a4e-5b3f-4c6d-8e9f-0a1b2c3d4e5f",
  readId: "0f1e2d3c-4b5a-4968-8776-655443322110",
  correctionId: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
};
const GOLDEN = {
  packetHash: "4d5895688813bf6ba46f4f029c2028350df2dc1c75bd12a0a2f91255a67f179c",
  signature: "0aeaa1549fabc40ecb03e6f1514dbdbef281e410dee0df5bb316a48ec1121c2f54b2ba710fd1e297a37baeb6ba436073a00b9ca7cbfc959bf00497ce1550e60f",
  fingerprint: "268f744374f886ec8e75f436f6812264fca750097d7eb41116663509ac19b378",
};

test("golden: a pinned correction and a pinned test key give pinned bytes the verifier accepts", async () => {
  const record = buildRecord({
    judgment: { disposition: "correct", assertionId: "A2", correctedText: CORRECTION, tag: "assumes_facts_not_in_evidence", rationale: WHY },
    inspected: ["ev-usage", "ev-tickets"], actor: OPERATOR, confirmedAt: Date.UTC(2026, 9, 18, 12, 0, 0),
  });
  const proof = await proofLib.proveRecord(record, { ids: GOLDEN_IDS, keyPair: await testKeyPair(), now: Date.UTC(2026, 9, 18, 12, 0, 1) });
  expect(proof.signed).toBe(true);
  expect(proof.signature.packet_hash).toBe(GOLDEN.packetHash);
  expect(proof.signature.packet_signature).toBe(GOLDEN.signature);
  expect(proof.fingerprint).toBe(GOLDEN.fingerprint);

  const verifier = Object.fromEntries(Object.entries(proofLib.VERIFIER_FILES).map(([k, p]) => [k, readFileSync(join(ROOT, p))]));
  const dir = mkdtempSync(join(tmpdir(), "jd-golden-"));
  for (const f of proofLib.bundleFiles(proof, record, verifier)) writeFileSync(join(dir, f.name), f.bytes);
  const pinned = verify(dir, "--expect-fingerprint", GOLDEN.fingerprint);
  expect(pinned.out).toContain("VERIFIED: Signature and independently pinned signer are valid.");
  expect(pinned.out).toContain(`Computed hash: ${GOLDEN.packetHash}`);
  expect(pinned.out).toContain("Canonical payload: liminal.founder_packet.v2");
  expect(pinned.code).toBe(0);
  rmSync(dir, { recursive: true, force: true });
});

/* ─── browser paths ───────────────────────────────────────────────── */
test("valid: the recorded correction downloads as a bundle the unchanged verifier accepts", async ({ page }) => {
  await judgeCorrect(page);
  const proof = page.locator("#jd-proof");
  await expect(proof).toHaveAttribute("data-signed", "yes");
  await expect(proof).toContainText(/demonstration key · generated in this browser · not tied to a person or organization/);
  await expect(proof).toContainText(/does not cover which evidence you opened/);
  await expect(page.locator(".jd-record")).toContainText(/not a signature/); // the content hash is still labelled as one
  const fp = (await page.locator(".jd-fp").textContent()).trim();
  expect(fp).toMatch(/^[0-9a-f]{64}$/);

  const { dir, name } = await downloadBundle(page);
  expect(name).toMatch(/^liminal-judgment-[0-9a-f]{8}\.zip$/);
  // the verifier in the bundle is the published one, byte for byte
  expect(sha(readFileSync(join(dir, "verify.mjs")))).toBe(sha(readFileSync(VERIFIER)));

  const st = selfTest(dir);
  expect(st.out).toContain("SELF-TEST PASSED: 5/5");
  expect(st.code).toBe(0);
  const unpinned = verify(dir);
  expect(unpinned.out).toContain("INTEGRITY VALID");
  expect(unpinned.out).toContain("SIGNER UNPINNED");
  expect(unpinned.code).toBe(0);
  const pinned = verify(dir, "--expect-fingerprint", fp);
  expect(pinned.out).toContain("✓ VERIFIED");
  expect(pinned.code).toBe(0);

  // the signed payload is the actual judgment: original beside correction
  const packet = readJson(dir, "packet.json");
  expect(packet.schema).toBe("liminal.founder_packet.v2");
  expect(packet.packet.kind).toBe("finding");
  expect(packet.packet.decision).toBe("correct");
  expect(packet.packet.runtime_mode).toBe("fixture");
  expect(packet.packet.user_correction).toBe(WHY);
  expect(packet.corrections).toHaveLength(1);
  expect(packet.corrections[0].original).toBe(A2);
  expect(packet.corrections[0].corrected).toBe(CORRECTION);
  expect(packet.corrections[0].category).toBe("assumes_facts_not_in_evidence");
  expect(packet.reads[0].situation).toContain(`A2 · ${A2}`);
  expect(readFileSync(join(dir, "ABOUT.md"), "utf8")).toContain("does not identify a person or an organization");
});

test("tampered: one changed byte in the correction, the AI original or the decision fails", async ({ page }) => {
  await judgeCorrect(page);
  const { dir } = await downloadBundle(page);
  // each edit is made consistently in packet.json AND the corrections.json
  // narrative copy, so only the signed hash can catch it
  const cases = [
    ["corrected text", (p, c) => { p.corrections[0].corrected = c.corrections[0].reason = p.corrections[0].corrected.replace("E12", "E13"); }],
    ["AI original", (p, c) => { p.corrections[0].original = c.corrections[0].original = p.corrections[0].original.replace("routine", "Routine"); }],
    ["AI read", (p) => { p.reads[0].situation = p.reads[0].situation.replace("$180", "$190"); }],
    ["decision", (p) => { p.packet.decision = "accept"; }],
  ];
  for (const [label, mutate] of cases) {
    const copy = copyBundle(dir);
    const p = readJson(copy, "packet.json"), c = readJson(copy, "corrections.json");
    mutate(p, c);
    writeJson(copy, "packet.json", p); writeJson(copy, "corrections.json", c);
    const r = verify(copy);
    expect(r.out, label).toContain("TAMPERED (content): hash mismatch");
    expect(r.code, label).toBe(1);
  }
  // a one-sided edit of the unsigned narrative copy is caught by the cross-check
  const copy = copyBundle(dir);
  const c = readJson(copy, "corrections.json"); c.corrections[0].reason = "something else"; writeJson(copy, "corrections.json", c);
  const r = verify(copy);
  expect(r.out).toContain("TAMPERED (corrections)");
  expect(r.code).toBe(1);
});

test("wrong key: a different pinned fingerprint and a swapped public key both fail", async ({ page }) => {
  await judgeCorrect(page);
  const { dir } = await downloadBundle(page);
  const pin = verify(dir, "--expect-fingerprint", "0".repeat(64));
  expect(pin.out).toContain("FAILED (signer pin)");
  expect(pin.code).toBe(1);

  // swap in another valid Ed25519 key with a consistent fingerprint: the signature no longer matches
  const other = (await testKeyPair()).publicKey;
  const raw = Buffer.from(await crypto.subtle.exportKey("raw", other));
  const copy = copyBundle(dir);
  const s = readJson(copy, "signature.json");
  s.device_public_key = raw.toString("hex");
  s.public_key_fingerprint = sha(raw);
  writeJson(copy, "signature.json", s);
  const swapped = verify(copy);
  expect(swapped.out).toContain("TAMPERED (signature): Ed25519 signature does not match packet_hash");
  expect(swapped.code).toBe(1);
});

test("unknown version: an unlisted canonical version or a contradictory tuple fails closed", async ({ page }) => {
  await judgeCorrect(page);
  const { dir } = await downloadBundle(page);
  const v9 = copyBundle(dir);
  const p = readJson(v9, "packet.json"); p.schema = "liminal.founder_packet.v9"; writeJson(v9, "packet.json", p);
  const a = verify(v9);
  expect(a.out).toContain("INVALID: unsupported canonical version: liminal.founder_packet.v9");
  expect(a.code).toBe(1);

  const tuple = copyBundle(dir);
  const s = readJson(tuple, "signature.json"); s.signature_alg = "ed25519:v1+packet.v3"; writeJson(tuple, "signature.json", s);
  const b = verify(tuple);
  expect(b.out).toContain("INVALID: unsupported signature/canonical tuple");
  expect(b.code).toBe(1);
});

test("unsigned: a browser that cannot sign records the judgment and the verifier says UNVERIFIED", async ({ page }) => {
  await page.addInitScript(() => {
    const gen = crypto.subtle.generateKey.bind(crypto.subtle);
    crypto.subtle.generateKey = (alg, ...rest) =>
      (alg?.name || alg) === "Ed25519" ? Promise.reject(new DOMException("Ed25519 is not supported", "NotSupportedError")) : gen(alg, ...rest);
  });
  await judgeCorrect(page);
  await expect(page.locator("#jd-proof")).toHaveAttribute("data-signed", "no");
  await expect(page.locator("#jd-proof")).toContainText(/UNVERIFIED/);
  await expect(page.locator(".jd-record")).toContainText(/no · this browser could not sign/);
  const { dir } = await downloadBundle(page);
  const r = verify(dir);
  expect(r.out).toContain("UNVERIFIED: packet has no complete device-signature material");
  expect(r.code).toBe(2);
});

test("failed save: no vault means no proof is issued and nothing can be downloaded", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
  });
  await open(page);
  await page.locator('[data-dispo="accept"]').click();
  await page.locator("#jd-review").click();
  await page.locator("#jd-confirm").click();
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "operator-confirmed");
  await expect(page.locator(".jd-record__id")).toContainText(/no proof issued/);
  await expect(page.locator("#jd-proof")).toHaveCount(0);
  await expect(page.locator("#jd-proof-dl")).toHaveCount(0);
  await expect(page.locator(".jd-record")).toContainText(/nothing is signed until the record is stored/);
  await expect(page.locator("#jd-retry")).toBeVisible();
});

test("restart: close the browser, relaunch the same profile, reopen the record, same bytes verify", async ({}, testInfo) => {
  const base = testInfo.project.use.baseURL;
  const profile = mkdtempSync(join(tmpdir(), "jd-profile-"));
  const launch = () => chromium.launchPersistentContext(profile, { acceptDownloads: true, baseURL: base });

  let ctx = await launch();
  let page = ctx.pages()[0] || (await ctx.newPage());
  await judgeCorrect(page);
  const recordUrl = new URL(page.url());
  const id = recordUrl.searchParams.get("record");
  expect(id).toMatch(/^\d+$/);
  const fp = (await page.locator(".jd-fp").textContent()).trim();
  const first = await downloadBundle(page);
  await ctx.close();

  ctx = await launch();
  page = ctx.pages()[0] || (await ctx.newPage());
  await open(page, `${SCENE}?record=${id}`);
  await expect(page.locator(".jd-eyebrow")).toContainText(/Reopened/);
  await expect(page.locator(".jd-diff__side.is-orig .jd-diff__t")).toHaveText(A2);
  await expect(page.locator(".jd-diff__side.is-corr .jd-diff__t")).toHaveText(CORRECTION);
  await expect(page.locator(".jd-fp")).toHaveText(fp);
  const again = await downloadBundle(page);
  // stored once, never re-signed: the reopened bundle is byte-identical
  expect(sha(readFileSync(again.zipPath))).toBe(sha(readFileSync(first.zipPath)));
  const r = verify(again.dir, "--expect-fingerprint", fp);
  expect(r.out).toContain("✓ VERIFIED");
  expect(r.code).toBe(0);

  // the demonstration key survived the restart: a new judgment carries the same fingerprint
  await judgeOther(page, "accept");
  await expect(page.locator(".jd-fp")).toHaveText(fp);
  await ctx.close();
  rmSync(profile, { recursive: true, force: true });
});

for (const d of ["accept", "reject", "defer"]) {
  test(`${d}: the record verifies with its own decision and no correction rows`, async ({ page }) => {
    await judgeOther(page, d);
    const fp = (await page.locator(".jd-fp").textContent()).trim();
    const { dir } = await downloadBundle(page);
    const r = verify(dir, "--expect-fingerprint", fp);
    expect(r.out).toContain("✓ VERIFIED");
    expect(r.code).toBe(0);
    const p = readJson(dir, "packet.json");
    expect(p.packet.decision).toBe(d);
    expect(p.corrections).toEqual([]);
    if (d === "defer") expect(p.packet.revisit_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    else expect(p.packet.revisit_at).toBeNull();
  });
}
