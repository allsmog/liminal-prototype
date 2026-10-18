// Acceptance & correction (LIM-2273): cuts/13-judgment.html → cuts/10-today.html.
// Locks the acceptance criteria as a user would walk them, without narration:
//   open the scene · inspect evidence · pick the questionable claim · correct it ·
//   confirm · the record keeps original beside correction · Today shows the card ·
//   reopening restores the same record with the correction intact.
// Plus: accept / reject / defer each record a truthful outcome; keyboard-only
// operation; a 400px phone; the empty vault, a missing record, and a vault that
// cannot be written. Each test runs in a fresh browser context, so IndexedDB
// starts empty and the fixture is deterministic.
import { test, expect } from "@playwright/test";
import { trackConsoleErrors } from "./helpers.js";

const SCENE = "/cuts/13-judgment.html";
const TODAY = "/cuts/10-today.html";
const CORRECTION =
  "Only E12 is routine calendar administration. E13 scheduled the design-review calls for the Q3 launch, which is product work.";
const WHY = "Bianca's run came off the launch checklist. The usage export has no ticket column, so the agent could not have seen that.";

// this sandbox cannot reach fonts.googleapis.com; nothing else is external
const material = (errors) => errors.filter((e) => !/ERR_TUNNEL_CONNECTION_FAILED|fonts\.g/.test(e));

async function open(page, url = SCENE) {
  await page.goto(url, { waitUntil: "load" });
  await expect(page.locator("body")).toHaveClass(/ready/);
}

test("the AI result is presented as proposed, with its evidence and uncertainty", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await open(page);
  await expect(page.locator(".jd-states")).toHaveAttribute("data-state", "proposed");
  await expect(page.locator(".jd-ai-badge")).toHaveText(/not yet human-accepted/i);
  // five assertions, each with a support class; the thin one is the agent's own flag
  await expect(page.locator("[data-assert]")).toHaveCount(5);
  await expect(page.locator('[data-assert="A2"] .jd-support')).toHaveText(/thin evidence/i);
  // the agent action is attributed to the agent, never the operator
  await expect(page.locator(".jd-agent-line")).toContainText(/agent · Adversarial reviewer/i);
  await expect(page.locator(".jd-agent-line")).toContainText(/was not your action/i);
  // evidence: five pieces, none opened yet, one explicitly absent
  await expect(page.locator("details.jd-ev")).toHaveCount(5);
  await expect(page.locator("#jd-ev-meta")).toContainText("0 of 5 opened");
  await expect(page.locator(".jd-ev--absent")).toHaveCount(1);
  await expect(page.locator(".jd-uncertain li")).toHaveCount(3);
  expect(material(errors)).toEqual([]);
});

test("correct path: inspect → dispute A2 → correct → confirm → record → Today → reopen", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await open(page);

  // inspect two pieces of evidence; opening is inspecting
  await page.locator('details[data-ev="ev-usage"] summary').click();
  await page.locator('details[data-ev="ev-tickets"] summary').click();
  await expect(page.locator("#jd-ev-meta")).toContainText("2 of 5 opened");
  await expect(page.locator('details[data-ev="ev-usage"]')).toHaveClass(/is-inspected/);

  // identify the questionable claim: selecting it opens the correction form
  await page.locator('[data-assert="A2"]').click();
  await expect(page.locator("#jd-panel")).toHaveAttribute("data-disposition", "correct");
  await expect(page.locator('[data-assert="A2"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#jd-corrected")).toBeFocused();
  await expect(page.locator("#jd-corrected")).toHaveValue("Both runs are routine administration, not product work.");

  // an unchanged correction is refused; a material one is accepted
  await page.locator("#jd-review").click();
  await expect(page.locator("#jd-problems")).toContainText(/identical to the original/i);
  await page.fill("#jd-corrected", CORRECTION);
  await page.locator('[data-tag="assumes_facts_not_in_evidence"]').click();
  await expect(page.locator("#jd-tag-gloss")).toContainText(/Projected context/);
  await page.fill("#jd-rationale", WHY);
  await page.locator("#jd-review").click();

  // operator-confirmed is a distinct, visible step before anything is stored
  await expect(page.locator("#jd-panel")).toHaveAttribute("data-phase", "confirm");
  await expect(page.locator(".jd-summary")).toContainText("Corrected");
  await expect(page.locator(".jd-summary")).toContainText(CORRECTION);
  await expect(page.locator(".jd-summary")).toContainText("2 of 5");
  await expect(page.locator(".jd-summary")).toContainText(/no sign-in/);
  await expect(page.locator(".jd-states")).toHaveAttribute("data-state", "proposed");
  await page.locator("#jd-confirm").click();

  // recorded · the record answers the six questions
  const record = page.locator(".jd-record");
  await expect(record).toHaveAttribute("data-state", "recorded", { timeout: 10_000 });
  await expect(page.locator(".jd-states")).toHaveAttribute("data-state", "recorded");
  await expect(page).toHaveURL(/\?record=\d+$/);
  await expect(record.locator(".jd-q__h")).toHaveText([
    "What was decided?",
    "What did AI contribute?",
    "What evidence mattered?",
    "What did the human change?",
    "Who authorized the judgment?",
    "What is preserved, and what happens next?",
  ]);
  // original preserved verbatim beside the correction
  const diff = record.locator(".jd-diff");
  await expect(diff.locator(".is-orig .jd-diff__t")).toHaveText("Both runs are routine administration, not product work.");
  await expect(diff.locator(".is-corr .jd-diff__t")).toHaveText(CORRECTION);
  await expect(record.locator('#jd-result [data-assert="A2"] .jd-assert__t')).toHaveText("Both runs are routine administration, not product work.");
  await expect(record.locator("#jd-result .jd-ai-badge")).toHaveText(/preserved verbatim/i);
  // derived assertion is flagged, not recomputed
  await expect(record).toContainText(/A4 was derived from the original A2/);
  await expect(record).toContainText(/not recomputed/);
  // evidence: opened vs not opened
  await expect(record.locator(".jd-evlist .mark.is-seen")).toHaveCount(2);
  await expect(record.locator(".jd-evlist .mark:not(.is-seen)")).toHaveCount(3);
  // authority: human actor named truthfully; agent actions separated
  await expect(record).toContainText("Operator at this device");
  await expect(record).toContainText(/unverified · this prototype has no sign-in/);
  await expect(record).toContainText(/agent actions happened before judgment and were not performed by you/i);
  // preservation is labelled honestly: hash is not a signature; nothing activated
  await expect(record).toContainText(/content hash SHA-256/);
  await expect(record).toContainText(/not a signature/);
  await expect(record).toContainText(/rule activated/i);
  await expect(record).toContainText(/Nothing is proposed, nothing is active/);
  // repeated-correction evidence: 1 fixture prior + this one, threshold 3
  await expect(record.locator(".jd-pattern")).toContainText(/2 corrections tagged/);

  // Today · the contextual re-entry card, with both voices intact
  await page.locator("#jd-to-today").click();
  await expect(page).toHaveURL(/10-today\.html\?record=\d+$/);
  await expect(page.locator("body")).toHaveClass(/ready/);
  const card = page.locator("#tdy-judgment .jd-reentry");
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-disposition", "correct");
  await expect(card.locator(".p-read__verdict")).toContainText("CORRECTED");
  await expect(card.locator(".jd-reentry__why")).toContainText(/You corrected A2/);
  await expect(card.locator(".is-orig .jd-diff__t")).toHaveText("Both runs are routine administration, not product work.");
  await expect(card.locator(".is-corr .jd-diff__t")).toHaveText(CORRECTION);
  // the rest of Today is untouched
  await expect(page.locator("#tdy-loop")).toBeVisible();

  // reopen the same record · correction intact · read-only
  await card.locator(".p-read__btn--primary").click();
  await expect(page).toHaveURL(/13-judgment\.html\?record=\d+$/);
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "recorded");
  await expect(page.locator(".jd-eyebrow")).toContainText(/Reopened from Today/);
  await expect(page.locator(".jd-record .is-corr .jd-diff__t")).toHaveText(CORRECTION);
  await expect(page.locator(".jd-record .is-orig .jd-diff__t")).toHaveText("Both runs are routine administration, not product work.");
  await expect(page.locator("#jd-panel")).toHaveCount(0); // nothing to re-judge on a stored record
  expect(material(errors)).toEqual([]);
});

for (const d of ["accept", "reject", "defer"]) {
  test(`${d} records a truthful outcome and comes back on Today`, async ({ page }) => {
    const errors = trackConsoleErrors(page);
    await open(page);
    await page.locator(`[data-dispo="${d}"]`).click();
    await expect(page.locator("#jd-panel")).toHaveAttribute("data-disposition", d);
    if (d === "accept") {
      await expect(page.locator(".jd-warn")).toContainText(/not opened any evidence/i);
    }
    if (d === "reject") {
      await page.locator("#jd-review").click();
      await expect(page.locator("#jd-problems")).toContainText(/Say why/);
      await page.fill("#jd-rationale", "The whole proposal rests on A2 and A2 rests on task titles.");
    }
    if (d === "defer") {
      await page.locator("#jd-review").click();
      await expect(page.locator("#jd-problems")).toContainText(/Pick when/);
      await page.locator('[data-window="7d"]').click();
    }
    await page.locator("#jd-review").click();
    await expect(page.locator("#jd-panel")).toHaveAttribute("data-phase", "confirm");
    await page.locator("#jd-confirm").click();
    const record = page.locator(".jd-record");
    await expect(record).toHaveAttribute("data-state", "recorded", { timeout: 10_000 });
    await expect(record).toHaveAttribute("data-disposition", d);
    if (d === "accept") {
      await expect(record).toContainText(/All 5 assertions are accepted unchanged/);
      await expect(record).toContainText(/No evidence was opened before acceptance/);
      await expect(record).toContainText(/Your acceptance is a separate line/);
    }
    if (d === "reject") {
      await expect(record).toContainText(/set aside/);
      await expect(record).toContainText(/Nothing is routed/);
    }
    if (d === "defer") {
      await expect(record).toContainText(/held for 7 days/);
      await expect(record).toContainText(/AI-produced, not accepted/);
    }
    // the AI's text is intact whatever the disposition
    await expect(record.locator("#jd-result .jd-assert__t").first()).toContainText("Two June runs put Opus 4.8");
    await expect(record.locator(".jd-pattern")).toHaveCount(0); // only corrections feed the pattern

    await page.locator("#jd-to-today").click();
    const card = page.locator("#tdy-judgment .jd-reentry");
    await expect(card).toHaveAttribute("data-disposition", d);
    await expect(card.locator(".jd-diff")).toHaveCount(0);
    if (d === "defer") await expect(card.locator(".jd-reentry__why")).toContainText(/due in 7 days/);
    expect(material(errors)).toEqual([]);
  });
}

test("keyboard only: tab to evidence and dispositions, esc steps back, enter confirms", async ({ page }) => {
  await open(page);
  // the first assertion is reachable by Tab (past the nav rail) and has a visible focus ring
  let reached = false;
  for (let i = 0; i < 20 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.dataset?.assert === "A1");
  }
  expect(reached, "Tab reaches the first assertion").toBe(true);
  const outline = await page.locator('[data-assert="A1"]').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline, "focus ring visible").not.toBe("none");
  // evidence is a native <details>: Enter on its summary opens it
  await page.locator('details[data-ev="ev-usage"] summary').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('details[data-ev="ev-usage"]')).toHaveAttribute("open", "");
  await expect(page.locator("#jd-ev-meta")).toContainText("1 of 5 opened");
  // choose correct from the keyboard, select A2, type, review, esc back, review again, confirm with Enter
  await page.locator('[data-dispo="correct"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#jd-panel-h")).toBeFocused();
  await page.locator('[data-assert="A2"]').focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#jd-corrected")).toBeFocused();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.type(CORRECTION);
  await page.locator("#jd-review").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#jd-panel")).toHaveAttribute("data-phase", "confirm");
  await page.keyboard.press("Escape");
  await expect(page.locator("#jd-panel")).toHaveAttribute("data-phase", "form");
  await expect(page.locator("#jd-corrected")).toHaveValue(CORRECTION); // esc keeps what was typed
  await page.locator("#jd-review").focus();
  await page.keyboard.press("Enter");
  await page.locator("#jd-confirm").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "recorded", { timeout: 10_000 });
  await expect(page.locator("#jd-record-h")).toBeFocused();
});

test("fits a 400px phone without horizontal scroll, in every state", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 860 });
  const noOverflow = async (label) => {
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(over, `${label}: horizontal overflow px`).toBeLessThanOrEqual(0);
  };
  await open(page);
  await noOverflow("awaiting");
  await page.locator('[data-assert="A2"]').click();
  await noOverflow("correction form");
  await page.fill("#jd-corrected", CORRECTION);
  await page.locator("#jd-review").click();
  await noOverflow("confirm");
  await page.locator("#jd-confirm").click();
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "recorded", { timeout: 10_000 });
  await noOverflow("record");
  await page.locator("#jd-to-today").click();
  await expect(page.locator("#tdy-judgment .jd-reentry")).toBeVisible();
  await noOverflow("today re-entry");
});

test("empty vault: Today shows no re-entry card and reads as before", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await open(page, TODAY);
  await expect(page.locator("#tdy-judgment")).toBeHidden();
  await expect(page.locator("#tdy-loop")).toBeVisible();
  expect(material(errors)).toEqual([]);
});

test("missing record: the scene and Today both say so instead of inventing one", async ({ page }) => {
  const errors = trackConsoleErrors(page);
  await open(page, `${SCENE}?record=9999`);
  await expect(page.locator(".jd-title")).toContainText(/No record #9999/);
  await expect(page.locator(".jd-record")).toHaveCount(0);
  await open(page, `${TODAY}?record=9999`);
  await expect(page.locator("#tdy-judgment")).toBeVisible();
  await expect(page.locator("#tdy-judgment")).toContainText(/not in this device's vault/i);
  await expect(page.locator("#tdy-judgment .jd-reentry")).toHaveCount(0);
  expect(material(errors)).toEqual([]);
});

test("vault unavailable: the judgment is confirmed but honestly not recorded, with a retry", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });
  });
  await open(page);
  await page.locator('[data-dispo="accept"]').click();
  await page.locator("#jd-review").click();
  await page.locator("#jd-confirm").click();
  await expect(page.locator(".jd-states")).toHaveAttribute("data-state", "operator-confirmed");
  await expect(page.locator(".jd-states .jd-state.is-failed")).toHaveCount(1);
  await expect(page.locator(".jd-notice .k").first()).toHaveText(/confirmed, not recorded/i);
  await expect(page.locator(".jd-record")).toHaveAttribute("data-state", "operator-confirmed");
  await expect(page.locator(".jd-record__id")).toContainText(/not stored/);
  await expect(page.locator("#jd-retry")).toBeVisible();
  await expect(page.locator(".jd-record__foot button[disabled]")).toHaveText(/Continue to Today/);
});
