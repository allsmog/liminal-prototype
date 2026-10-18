// Golden path · cut 11 (P0): objective → reads → refusal → correction →
// ratify → sealed artifact → decision log. Asserted twice (fresh load and
// after the visible restart) to lock determinism. Since LIM-2292 (C1) the
// correction is made in Cut 13, the single correction surface; Cut 11 hands
// off to it and counts what Cut 13 recorded in this browser's vault.
import { test, expect } from "@playwright/test";
import { CUT_11_CANONICAL, trackConsoleErrors } from "./helpers.js";

async function runGoldenPath(page, { correct }) {
  // 1. the loop surface is up, with the run badge classified
  await expect(page.locator("body")).toHaveAttribute("data-surface", "loop");
  await expect(page.locator("#run-badge")).toHaveText("demonstration run");

  // 1b. open the case: the reads live at step 4 of the ritual, and the cut
  //     opens at step 3 (`let STEP=3`). Before #66 the whole loop was flat and
  //     the judgment hero was on screen at load; #66 wrapped it in the 7-step
  //     `.pane7` ritual, where only `.pane7.on` is displayed. So the path has to
  //     walk to the case rather than assume it. Deliberately the in-flow
  //     affordance, not the step-rail shortcut: the golden path asserts the
  //     journey a viewer actually takes.
  await page.getByText("Open the case →").click();
  await expect(page.locator(".reg.judgment")).toBeVisible();

  // 2. dissent: the diligence refusal is visible in the judgment hero
  await expect(page.getByText(/refused to read the team's work/i)).toBeVisible();

  // 3. reconciliation strip: naïve → dropped → verified figures render
  await expect(page.getByText(/dropped by verifier/i)).toBeVisible();

  // 4. correction is a hand-off: "Correct this finding →" (inside the
  //    expanded F-CAL finding) and every "Amend read" link to Cut 13, and no
  //    inline correction editor survives on Cut 11
  await page.locator('[data-finding="F-CAL"] [data-fexpand]').click({ force: true });
  const correctLink = page.getByRole("link", { name: "Correct this finding →" });
  await expect(correctLink).toHaveCount(1);
  await expect(correctLink).toHaveAttribute("href", "13-judgment.html");
  const amend = page.locator(".reg .amend");
  await expect(amend).toHaveCount(4);
  for (const href of await amend.evaluateAll((els) => els.map((el) => el.getAttribute("href")))) {
    expect(href).toBe("13-judgment.html");
  }
  await expect(page.locator(".fc-kind, [data-fcsave], .reg-edit")).toHaveCount(0);
  if (correct) {
    // the correction recorded in Cut 13 is counted back on this case
    await expect(page.locator("#chain")).toContainText("judgment record (Cut 13)");
  }

  // 4b. rule → enforcement: the ratify action lives on step 5, one past the
  //     reads. Same #66 cause as 1b: what used to be one flat surface is now
  //     a walk, so the path takes the step instead of assuming it.
  await page.getByRole("button", { name: "Rule → enforcement" }).click();

  // 5. ratify
  // `.db.sign` alone is no longer unique: #66 gave the five ritual advance
  // buttons ("Open the case →", "Rule → enforcement", …) the same class, so the
  // bare selector now resolves to 6 elements. `[data-act="sign"]` is the actual
  // ratify ACTION: the nav buttons carry data-goto7/data-adv7 instead.
  const signBtn = page.locator('.db.sign[data-act="sign"]');
  await signBtn.click();
  const artifact = page.locator(".artifact");
  await expect(artifact).toBeVisible();
  await expect(artifact).toContainText(
    "Opus 4.8 cannot be used for calendar management"
  );
  const entries = correct ? "entry 7/7" : "entry 6/6";
  await expect(artifact).toContainText(entries);
  if (correct) {
    await expect(artifact).toContainText("Operator made 1 correction");
    await expect(artifact).toContainText("recorded in Cut 13 (judgment record) on this device");
  }

  // 6a. the pointer path to a second ratify is closed: Sign hides itself
  await expect(signBtn).toBeHidden();

  // 6b. tab-hop re-entry restores the artifact WITHOUT duplicating the
  //     ratified chain entry (regression: it used to append one per revisit)
  await page.keyboard.press("1"); // Today (cut's own number-key nav)
  await page.keyboard.press("3"); // back to The loop
  await expect(page.locator(".artifact")).toHaveCount(1);

  // 6c. the palette's Sign action (the remaining second-ratify path) hits the
  //     guard instead of minting again
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByText("Sign & hand off (ratify)").click();
  await expect(page.getByText(/already ratified this session/i)).toBeVisible();
  await expect(page.locator(".artifact")).toHaveCount(1);

  // 7. the decision log shows the classified, hash-linked trail with exactly
  //    one ratified entry
  // the palette input keeps focus after 6c and the key handler ignores inputs
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("7"); // Decision log
  await expect(page.getByText(/append-only trail/i)).toBeVisible();
  await expect(page.getByText(/anchors shown are illustrative/i)).toBeVisible();
  // the session ratification appears once in the summary line (table rows are
  // the fixture's recorded entries; the session mark must not duplicate)
  await expect(page.getByText(/1 ratified this session/)).toHaveCount(1);
  await expect(page.locator("tbody tr")).toHaveCount(4); // govern-run.json LOG length
}

test("golden path is deterministic across a restart", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await page.goto(CUT_11_CANONICAL);

  await runGoldenPath(page, { correct: false });

  // visible viewer-facing recovery: ↺ restart returns to a clean opening state
  await page.locator("#reset-demo").click();
  await expect(page.locator("body")).toHaveAttribute("data-surface", "today");

  // run 2: record one correction in Cut 13 (same browser context, same
  // vault), come back on the canonical URL, and the full path counts it
  await page.goto("/cuts/13-judgment.html");
  await page.locator('[data-assert="A2"]').click();
  await page.locator("#jd-corrected").fill(
    "E12 and E13 may be routine administration; nothing in the evidence links them to a ticket or PR."
  );
  await page.locator("#jd-review").click();
  await page.locator("#jd-confirm").click();
  await expect(page.locator('.jd-record[data-state="recorded"]')).toBeVisible({ timeout: 10_000 });

  await page.goto(CUT_11_CANONICAL);
  await runGoldenPath(page, { correct: true });
  // the decision log line reads the same Cut 13 record
  await expect(page.getByText(/1 correction recorded in Cut 13 \(judgment record\) on this device/)).toBeVisible();

  expect(errors, "console errors across both runs").toEqual([]);
});

test("tampered fixture can never render live/real badge", async ({ page }) => {
  // intercept the fixture and claim mode:'live': the badge must stay classified
  await page.route("**/govern-run.json", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.meta.mode = "live";
    await route.fulfill({ json: body });
  });
  await page.goto(CUT_11_CANONICAL);
  await expect(page.locator("#run-badge")).toHaveText("recorded run · fixture");
});
