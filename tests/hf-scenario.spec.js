// hugging-face-2026 scenario (2026-10-17): the one context-keyed thread on
// Cut 01. Locks: (1) it is invisible on the default surface, (2) the deep link
// lands on it with its own split and record, (3) a thread switch re-renders the
// divergence pane (specs are context-keyed now), (4) its on-screen copy passes
// the same claim gate as the path cuts.
import { test, expect } from "@playwright/test";

const DEFAULT = "/cuts/01-slate-tray.html?skip-entry&skip-boot";
const DEEP = "/cuts/01-slate-tray.html?scenario=hugging-face-2026&skip-boot";
const CLAIM_WORDS = /\b(live|real|production|customers?|pilots?|partners?)\b/i;
// Outcome claims: the copy must never say the record or the tool prevented,
// stopped, detected or caught anything. The only allowed uses are negated or
// sit under "Not proven"; they are listed verbatim and removed before the scan,
// so a new affirmative use anywhere on screen still fails.
const OUTCOME_WORDS = /\b(prevent(s|ed|ing)?|stop(s|ped|ping)?|detect(s|ed|ing)?|caught)\b/i;
const OUTCOME_ALLOWED = [
  "stops no agent",                                        // record: negated
  "name a human owner or stop",                            // read a: an instruction to the operator
  "Not proven: that any tool would have caught it",        // record: under Not proven
  "That any tool, this one included, would have caught or stopped it", // demo foot: Not proven
  "That an agent delegation can be detected automatically",           // demo foot: Not proven
  "That a signed record notifies anyone or stops an agent",           // demo foot: Not proven
];

test("the scenario thread is absent from the default surface", async ({ page }) => {
  await page.goto(DEFAULT);
  await expect(page.locator("#slate-title")).toHaveText(/Founding round/);
  await expect(page.locator('[data-id="hugging_face_2026"]')).toHaveCount(0);
  await expect(page.locator("#rail-l-meta")).toHaveText(/^5 · self$/);
});

for (const key of ["__proto__", "constructor", "toString"]) {
  test(`?scenario=${key} falls through to the default boot`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(`/cuts/01-slate-tray.html?scenario=${key}&skip-boot`);
    await expect(page.locator("#slate-title")).toHaveText(/Founding round/);
    await expect(page.locator('[data-id="hugging_face_2026"]')).toHaveCount(0);
    await expect(page.locator("#rail-l-meta")).toHaveText(/^5 · self$/);
    // the font CDN is unreachable in the sandbox; that is the only allowed error
    const unexpected = errors.filter((m) => !/ERR_TUNNEL_CONNECTION_FAILED|Failed to load resource/.test(m));
    expect(unexpected, `page errors for ?scenario=${key}`).toEqual([]);
  });
}

test("the deep link lands on the thread with its own split and record", async ({ page }) => {
  await page.goto(DEEP);
  await expect(page.locator("#slate-title")).toHaveText(/who authorized the mission/);
  await expect(page.locator("#slate-eyebrow")).toContainText(/synthetic reconstruction/i);
  await expect(page.locator('[data-id="hugging_face_2026"]')).toHaveCount(1);
  await expect(page.locator(".metric-band")).toContainText("17,600");
  await expect(page.locator(".metric-band")).not.toContainText("Runway");

  await page.locator("#dispo-primary").click();
  const pane = page.locator("#divergence-pane");
  await expect(pane.locator(".dvg-col")).toHaveCount(3);
  await expect(pane).toContainText("A delegated mission with no human owner on record");
  await expect(pane).toContainText("Authority for the mission cannot be determined");
  await expect(pane).toContainText("inherits no authority its parent lacked");
  await expect(page.locator("#dispo-primary")).toHaveText("Decide anyway");

  await page.locator("#dispo-primary").click();
  const art = page.locator("#dispo-artifact");
  await expect(art).toBeVisible();
  await expect(page.locator("#da-title")).toHaveText(/authority unknown · mission held/);
  await expect(page.locator("#da-committed")).toContainText("Execution is not connected");
  await expect(page.locator("#da-govern-next")).toBeHidden();
});

test("switching threads re-renders the divergence pane for the new thread", async ({ page }) => {
  await page.goto(DEEP);
  await page.locator("#dispo-primary").click();
  await expect(page.locator("#divergence-pane")).toContainText("no human owner on record");
  await page.locator('[data-id="founding_close_decision"]').click();
  await expect(page.locator("#slate-title")).toHaveText(/Founding round/);
  // the slate pre-renders the new thread's split on switch; what matters is
  // that it is the new thread's split, not the cached one
  await expect(page.locator("#divergence-pane")).not.toContainText("no human owner on record");
  await page.locator("#dispo-primary").click();
  await expect(page.locator("#divergence-pane")).toContainText("Founding hire");
  await expect(page.locator("#divergence-pane")).not.toContainText("no human owner on record");
  await expect(page.locator("#da-govern-next")).toHaveAttribute("href", "11-govern.html?subject=spend&beat=loop&run=govern-run.json");
});

test("scenario copy passes the claim gate on screen", async ({ page }) => {
  for (const url of [DEEP, "/cuts/_demo-hf.html"]) {
    await page.goto(url);
    await page.waitForTimeout(800);
    let text = await page.evaluate(() => document.body.innerText);
    if (url === DEEP) {
      // walk to the split and the record so their copy is gated too
      await page.locator("#dispo-primary").click();
      await expect(page.locator("#dispo-primary")).toHaveText("Decide anyway");
      text += "\n" + await page.evaluate(() => document.body.innerText);
      await page.locator("#dispo-primary").click();
      await expect(page.locator("#dispo-artifact")).toBeVisible();
      text += "\n" + await page.evaluate(() => document.body.innerText);
    }
    expect(text, `${url} em dash`).not.toMatch(/—/);
    const hits = text.split("\n").filter((l) => CLAIM_WORDS.test(l) && /Hugging|METR|PHASEONE|mission|board|GO|reconstruction/i.test(l));
    expect(hits, `${url} claim words in scenario copy`).toEqual([]);
    const outcome = text.split("\n")
      .map((l) => OUTCOME_ALLOWED.reduce((acc, ok) => acc.split(ok).join(""), l))
      .filter((l) => OUTCOME_WORDS.test(l));
    expect(outcome, `${url} prevent/stop/detect/caught claims`).toEqual([]);
  }
});
