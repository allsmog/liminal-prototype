// Smoke: both canonical URLs + the front door load directly, with all
// same-origin assets resolving and zero material console errors.
// Runs in both projects (default + reduced-motion).
import { test, expect } from "@playwright/test";
import {
  CUT_11_CANONICAL,
  CUT_01_CANONICAL,
  trackConsoleErrors,
} from "./helpers.js";

const SURFACES = [
  { name: "front door", url: "/index.html", marker: "See the judgment loop" },
  { name: "cut 01 canonical", url: CUT_01_CANONICAL, marker: null },
  { name: "cut 11 canonical", url: CUT_11_CANONICAL, marker: null },
  // Added 2026-07-29 with the .p-read fold: both cuts render the shared read
  // primitive, and neither had ANY coverage before. Cut 06 in particular now
  // links lib/cut-shell-products.css for the first time: a load regression
  // there would otherwise be invisible.
  { name: "cut 06 margin-read", url: "/cuts/06-margin-read.html", marker: null },
  { name: "cut 10 today", url: "/cuts/10-today.html", marker: null },
  // Added 2026-10-17 with the as-built cut 12: it fetches inventory.json and
  // ~20 WebP captures at runtime, so a missing asset is a 404 this test sees.
  { name: "cut 12 as built", url: "/cuts/12-operating-plane.html", marker: "The operating plane, as built." },
];

for (const s of SURFACES) {
  test(`${s.name} loads clean`, async ({ page }) => {
    const errors = trackConsoleErrors(page);
    const failed = [];
    page.on("response", (res) => {
      // external font CDNs are out of scope; same-origin assets must resolve
      if (res.status() >= 400 && res.url().includes("localhost")) {
        failed.push(`${res.status()} ${res.url()}`);
      }
    });

    // NOTE: server.mjs holds a live-reload connection open, networkidle never
    // fires against it. "load" + settle delay is the reliable wait here.
    await page.goto(s.url, { waitUntil: "load" });
    await page.waitForTimeout(2000);

    if (s.marker) await expect(page.getByText(s.marker)).toBeVisible();
    expect(failed, "same-origin asset failures").toEqual([]);
    expect(errors, "console errors").toEqual([]);
  });
}

test("cut 11 fixture actually loads (badge flips to demonstration run)", async ({
  page,
}) => {
  await page.goto(CUT_11_CANONICAL);
  await expect(page.locator("#run-badge")).toHaveText("demonstration run");
});

test("cut 11 missing fixture falls back to inline demo", async ({ page }) => {
  await page.goto("/cuts/11-govern.html?subject=spend&beat=loop&run=nope.json");
  // fallback keeps the badge in demo mode and still renders the loop + refusal
  await expect(page.locator("#run-badge")).toHaveText("demo");
  await expect(page.locator("body")).toHaveAttribute("data-surface", "loop");
  // a VISIBLE refusal, not merely the first in DOM order. #66's 7-step ritual
  // keeps six `/refused/i` matches in the document at once and shows only the
  // `.pane7.on` one, so `.first()` was picking text out of an inactive pane, 
  // it passed before only because the loop used to be one flat surface.
  await expect(page.getByText(/refused/i).filter({ visible: true }).first())
    .toBeVisible();
});

// ── .p-read · the shared read primitive (adopted 2026-07-29) ──────────────
// Cuts 06 and 10 were a fork of one held-read design under two vocabularies.
// These guard the fold: the primitive must actually reach both cuts, and the
// v0.3 severity-lane chroma law must hold: a refused read is a LIFECYCLE
// state (judgment register), never a severity hue.

const P_READ_SURFACES = [
  { name: "cut 06", url: "/cuts/06-margin-read.html" },
  { name: "cut 10", url: "/cuts/10-today.html" },
  // cut 11's reads live at step 4 of the ritual and the cut opens at step 3, so
  // this surface needs revealing before the primitive is on screen. Everything
  // asserted below is identical once it is.
  {
    name: "cut 11",
    url: CUT_11_CANONICAL,
    reveal: async (page) => page.getByText("Open the case →").click(),
  },
];

for (const s of P_READ_SURFACES) {
  test(`${s.name} consumes the .p-read primitive`, async ({ page }) => {
    await page.goto(s.url, { waitUntil: "load" });
    await page.waitForTimeout(500);
    if (s.reveal) {
      await s.reveal(page);
      await page.waitForTimeout(700);
    }

    const read = page.locator(".p-read").first();
    await expect(read).toBeVisible();

    // the primitive's stylesheet actually reached the page: padding only
    // exists in lib/cut-shell-products.css, never in the cuts
    const styled = await page.evaluate(() => {
      const el = document.querySelector(".p-read:not(.p-read--compact)");
      return el ? getComputedStyle(el).paddingTop : null;
    });
    expect(styled, "primitive CSS reached the cut").toBe("18px");

    // no local copy crept back in
    const localCopy = await page.evaluate(() =>
      [...document.querySelectorAll("style")].some((s) =>
        /^\s*\.p-read[\s{.:-]/m.test(s.textContent || ""),
      ),
    );
    expect(localCopy, "cut must not re-declare .p-read locally").toBe(false);
  });
}

test("severity lane: a refused read never takes a severity hue", async ({ page }) => {
  await page.goto("/design-system/atlas/state-atlas.html", { waitUntil: "load" });
  await page.waitForTimeout(500);

  // --alarm is the severity hue. It must not colour any part of a read.
  const alarmHits = await page.evaluate(() => {
    const alarm = getComputedStyle(document.documentElement)
      .getPropertyValue("--alarm").trim();
    if (!alarm) return "no --alarm token";
    const hits = [];
    for (const read of document.querySelectorAll(".p-read")) {
      for (const el of [read, ...read.querySelectorAll("*")]) {
        const cs = getComputedStyle(el);
        for (const prop of ["color", "borderLeftColor", "backgroundColor"]) {
          // compare as resolved rgb by round-tripping through a probe element
          const probe = document.createElement("span");
          probe.style.color = alarm;
          document.body.appendChild(probe);
          const resolved = getComputedStyle(probe).color;
          probe.remove();
          if (cs[prop] === resolved) hits.push(`${el.className || el.tagName}.${prop}`);
        }
      }
    }
    return hits;
  });
  expect(alarmHits, "severity hue inside a read").toEqual([]);
});
