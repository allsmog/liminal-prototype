/* slate.js · the composition surface
 *
 * Renders the slate, slate header, brief, disposition + signed artifact,
 * audit ribbon. Wires per-tile interactions (add via onTileClick, remove
 * via the × button). Imports state, agency rail (for chips + tick),
 * tray (for tile previews), classification (for Business banner).
 *
 * The slate is a composition surface, not a feed. The act of placing
 * a tile is the agency move. Slated tiles wear a gaze stripe + reader
 * chips that say "the agents are reading this." The brief renders below
 * once at least one non-refused tile is composed. Disposition produces
 * a signed paper-card artifact (Team/Business) or a captured journal
 * entry (Personal · no subject to share with).
 */
import { CONSENT_CLASSES } from "../config/consent.js";
import { TEAM_TILES_FOR_SUBJECT } from "../data/team.js";
import { BUSINESS_OPERATOR, BUSINESS_SCENARIOS } from "../data/business.js";
import {
  activeProductId, activeContextId,
  getActiveSubject, getActiveCase, getActiveThread,
  getTilesForActive, tileIsRefused, getSlatedSet, getOperatorClearanceLevel,
  setLastLandedId,
  pushUndo, slated, vaultCount, bumpVault,
  pushAuditRow, getAuditRows,
  agentState,
} from "./state.js";
import { AGENT_FLAT, tickAgencyRail } from "./agency.js";
import { tilePreviewHTML } from "./tray.js";
import { renderClassificationBanner, clearClassificationBanner } from "./classification.js";

/* read by renderSlate · just-landed marker · cleared in animationend */
let lastLandedId = null;
function getLastLanded() { return lastLandedId; }
function setLanded(id) {
  lastLandedId = id;
  setLastLandedId(id);
}
function clearLandedIf(id) {
  if (lastLandedId === id) lastLandedId = null;
}

/* ─── breadcrumb helper ───────────────────────────────────────────── */
function setBreadcrumb(html) {
  const bc = document.getElementById("breadcrumb");
  const sep = document.getElementById("crumb-sep");
  if (!bc) return;
  bc.innerHTML = html || "";
  if (sep) sep.hidden = !html;
}

/* ─── slate header · per-surface eyebrow / title / subtitle ─────── */
export function renderSlateHeader() {
  if (activeProductId === "personal") {
    const t = getActiveThread();
    if (!t) return;
    setBreadcrumb(`personal › ${t.label}`);
    document.getElementById("slate-eyebrow").innerHTML =
      `${t.eyebrow} · <span class="sb-strong">${t.last_touched}</span>`;
    document.getElementById("slate-title").textContent = t.label;
    document.getElementById("slate-subtitle").textContent = t.intro;
    clearClassificationBanner();
    document.getElementById("slate-canvas").dataset.layout = "freeform";
  } else if (activeProductId === "team") {
    const s = getActiveSubject();
    if (!s) return;
    const cc = CONSENT_CLASSES[s.consent_class];
    setBreadcrumb(`team › ${s.label}`);
    document.getElementById("slate-eyebrow").innerHTML =
      `Coherence read · <span class="sb-strong">${cc?.label ?? s.consent_class}</span> · ${s.window_days}-day window · ${s.drift_state}`;
    document.getElementById("slate-title").textContent = `${s.label} · ${s.role}`;
    document.getElementById("slate-subtitle").textContent =
      `${s.intro}. ${s.last_surfaced ? "Last surfaced: " + s.last_surfaced : ""}`;
    clearClassificationBanner();
    document.getElementById("slate-canvas").dataset.layout = "freeform";
  } else if (activeProductId === "sam-seed") {
    const s = getActiveSubject();
    if (!s) return;
    setBreadcrumb(`seed › ${s.label}`);
    document.getElementById("slate-eyebrow").innerHTML =
      `System read · <span class="sb-strong">${s.id === "tariq_lead" ? "system-not-person" : "triage instrumentation"}</span> · ${s.window_days}-day window · ${s.drift_state}`;
    document.getElementById("slate-title").textContent = `${s.label} · ${s.role}`;
    document.getElementById("slate-subtitle").textContent =
      `${s.intro}. ${s.last_surfaced ? "Last surfaced: " + s.last_surfaced : ""}`;
    clearClassificationBanner();
    document.getElementById("slate-canvas").dataset.layout = "freeform";
  } else {
    const c = getActiveCase();
    if (!c) return;
    setBreadcrumb(`business › ${c.label}`);
    document.getElementById("slate-eyebrow").innerHTML =
      `Case file · <span class="sb-strong">${BUSINESS_OPERATOR.unit}</span> · ${BUSINESS_OPERATOR.cohort}`;
    document.getElementById("slate-title").textContent = c.label;
    document.getElementById("slate-subtitle").textContent = c.case_file?.split(" · ").slice(0, 2).join(" · ") ?? "";
    renderClassificationBanner();
    document.getElementById("slate-canvas").dataset.layout = "case-grid";
  }
}

/* ─── slate render · empty state · sparkline · slated tiles ─────── */
export function renderSlate(ctx) {
  const canvas = document.getElementById("slate-canvas");
  const slateTiles = document.getElementById("slate-tiles");
  if (!canvas || !slateTiles) return;
  slateTiles.innerHTML = "";
  const slatedSet = getSlatedSet();
  const tiles = getTilesForActive();

  canvas.dataset.empty = slatedSet.size === 0 ? "1" : "0";

  if (slatedSet.size === 0) {
    const eyebrow = document.getElementById("se-eyebrow");
    const headline = document.getElementById("se-headline");
    const helper = document.getElementById("se-helper");
    if (activeProductId === "personal") {
      const th = getActiveThread();
      eyebrow.textContent  = "Self-read · founder OS";
      headline.textContent = th
        ? `${th.intro.split(/[?.]/)[0]}.`
        : "Compose what you're working through.";
      helper.textContent   = "Drop the windows that bear on this. Liminal reads across them and reads you reading. Stays local · no one else sees this read.";
    } else if (activeProductId === "team") {
      const s = getActiveSubject();
      eyebrow.textContent  = "Coherence read · peer-read";
      headline.textContent = s
        ? `Compose what you've seen of ${s.label}.`
        : "Compose what you've seen of this person.";
      helper.textContent   = "Drop the windows you'd want to read against. Liminal reads across them and surfaces where the pattern holds, drifts, or breaks.";
    } else if (activeProductId === "sam-seed") {
      const s = getActiveSubject();
      eyebrow.textContent  = "System read · IC seed";
      headline.textContent = s
        ? (s.id === "tariq_lead" ? `Compose what changed for ${s.label}.` : `Compose why the triage is drifting.`)
        : "Compose the failing triage.";
      helper.textContent   = "Drop the blame tiles and the read indicts a person. Drop the system tiles and it tunes a setup. Same agents. You choose which read the evidence makes.";
    } else {
      const c = getActiveCase();
      eyebrow.textContent  = "Case file · institutional-read";
      headline.textContent = c
        ? `Compose the case for ${c.label}.`
        : "Compose the case.";
      helper.textContent   = "Cleared evidence becomes a slate composition. The audit chain logs every read. The subject can request the chain.";
    }
  }

  /* Devon DRIFT sparkline · the demo's killing-feature visual */
  const showSparkline = activeProductId === "team" &&
    activeContextId === "devon_eng" &&
    slatedSet.has("devon_commits_21d");

  if (showSparkline) {
    const spark = document.createElement("div");
    spark.className = "slated is-sparkline is-active";
    spark.innerHTML = `
      <div class="slated-head">
        <span class="slated-glyph">◇</span>
        <span class="slated-source">21-day own-baseline · drift detected</span>
      </div>
      <div class="slated-label">Devon · internal vs. external assertion</div>
      <svg class="sparkline" viewBox="0 0 600 56" preserveAspectRatio="none">
        <path class="line-int" d="M0,34 L40,32 L80,36 L120,30 L160,34 L200,32 L240,36 L280,34 L320,38 L360,36 L400,40 L440,38 L480,42 L520,40 L560,44 L600,42"/>
        <path class="line-ext" d="M0,34 L40,34 L80,32 L120,28 L160,24 L200,20 L240,18 L280,14 L320,12 L360,8 L400,4 L440,2 L480,1 L520,1 L560,1 L600,0"/>
        <path class="gap" d="M0,34 L40,32 L80,36 L120,30 L160,34 L200,32 L240,36 L280,34 L320,38 L360,36 L400,40 L440,38 L480,42 L520,40 L560,44 L600,42 L600,0 L560,1 L520,1 L480,1 L440,2 L400,4 L360,8 L320,12 L280,14 L240,18 L200,20 L160,24 L120,28 L80,32 L40,34 L0,34 Z"/>
        <text x="0" y="54" font-family="SF Mono, monospace" font-size="9" fill="#7A7A82">21d ago</text>
        <text x="540" y="54" font-family="SF Mono, monospace" font-size="9" fill="#7A7A82">today</text>
      </svg>
      <div class="sparkline-meta">
        <span>internal · external · last 21 days</span>
        <span class="delta">+34% divergence</span>
      </div>
    `;
    slateTiles.appendChild(spark);
  }

  tiles.forEach(tile => {
    if (!slatedSet.has(tile.id)) return;
    if (tile.id === "brian_commits_21d" && showSparkline) return;

    const el = document.createElement("div");
    const isRefused = tileIsRefused(tile);
    const justLanded = tile.id === lastLandedId;
    el.className = "slated "
      + (isRefused ? "is-refused" : "is-active")
      + (justLanded ? " is-just-landed" : "");
    el.dataset.id = tile.id;

    const readerChipsHtml = isRefused ? "" : (() => {
      const reading = AGENT_FLAT.find(a => agentState[a.name] === "reading");
      const recents = AGENT_FLAT.filter(a => agentState[a.name] === "read").slice(0, 2);
      const seen = new Set();
      const chips = [];
      if (reading) { chips.push({ name: reading.name, cls: "is-reading" }); seen.add(reading.name); }
      for (const a of recents) {
        if (seen.has(a.name)) continue;
        chips.push({ name: a.name, cls: "" });
        seen.add(a.name);
        if (chips.length >= 3) break;
      }
      if (chips.length === 0) return "";
      return `
        <div class="slated-readers">
          ${chips.map(c => `<span class="reader-chip ${c.cls}" title="${c.name}">${c.name[0]}</span>`).join("")}
        </div>`;
    })();

    el.innerHTML = `
      ${isRefused ? "" : '<div class="gaze-stripe"></div>'}
      <div class="tile-bar">
        <div class="tb-lights">
          <span class="tb-light is-active"></span>
          <span class="tb-light"></span>
          <span class="tb-light"></span>
        </div>
        <span class="tb-source">${tile.source}</span>
        <span class="tb-live">${isRefused ? "refused" : tile.kind === "vault" ? "vault" : "active"}</span>
      </div>
      <div class="tile-window">
        <div class="tile-label">${tile.label}</div>
        ${tilePreviewHTML(tile, isRefused)}
      </div>
      ${readerChipsHtml}
      <button type="button" class="slated-x" data-id="${tile.id}"
              aria-label="Remove ${tile.label} from the slate">×</button>
    `;
    slateTiles.appendChild(el);

    el.querySelector(".slated-x").addEventListener("click", (e) => {
      e.stopPropagation();
      ctx.onTileRemove(tile);
    });
    if (justLanded) {
      el.addEventListener("animationend", () => clearLandedIf(tile.id), { once: true });
    }
  });

  const nonRefusedCount = [...slatedSet].filter(id => {
    const t = tiles.find(x => x.id === id);
    return t && !tileIsRefused(t);
  }).length;

  document.getElementById("brief-area").hidden = nonRefusedCount === 0;
  if (nonRefusedCount > 0) {
    renderBrief();
    maybePreRenderDivergence(ctx);
  }
}

/* Opt-in early divergence · a surface marks its pane data-timing="reading" to
   show the split as soon as the agents have actually read something, instead of
   holding it back until the first Confirm. Hooked here rather than on the
   engine's READING beat because cut 01 never drives that beat. It sits at IDLE
   until Confirm: whereas this is the real "there is a read to disagree about"
   moment, keyed off slated non-refused tiles.

   Rendered with {gate:false}: the pane becomes VISIBLE without counting as
   acknowledged, so the Confirm gate stays armed and signing still costs a
   deliberate second press. Panes without the attribute are untouched.

   Lazily imported for the same reason wireDisposition does it: a static import
   would make slate.js → divergence.js load eagerly on every cut. */
function maybePreRenderDivergence(ctx) {
  const host = document.getElementById("divergence-pane");
  if (host?.dataset.timing !== "reading" || host.innerHTML.trim() !== "") return;
  import("./divergence.js")
    .then(({ renderDivergence }) => renderDivergence(host, ctx, { gate: false }))
    .catch(() => { /* pane stays closed until DECIDING · no worse than before */ });
}

/* ─── tile interactions · onTileClick + onTileRemove ────────────── */

export function onTileClick(tile, isRefused, ctx) {
  if (isRefused) {
    appendAudit(`refusal · ${tile.label}`, true);
    ctx.showToast(tile.refused_reason ?? "Refused · out of consent class");
    const slatedSet = getSlatedSet();
    slatedSet.add(tile.id);
    setLanded(tile.id);
    pushUndo({ kind: "add", product: activeProductId, context: activeContextId, tileId: tile.id, label: tile.label });
    ctx.renderTray();
    renderSlate(ctx);
    tickAgencyRail();
    return;
  }
  const slatedSet = getSlatedSet();
  slatedSet.add(tile.id);
  setLanded(tile.id);
  pushUndo({ kind: "add", product: activeProductId, context: activeContextId, tileId: tile.id, label: tile.label });
  appendAudit(`drop · ${tile.label} → slate`);
  ctx.renderTray();
  renderSlate(ctx);
  tickAgencyRail();
}

export function onTileRemove(tile, ctx) {
  const slatedSet = getSlatedSet();
  slatedSet.delete(tile.id);
  pushUndo({ kind: "remove", product: activeProductId, context: activeContextId, tileId: tile.id, label: tile.label });
  appendAudit(`remove · ${tile.label} ← slate`);
  ctx.renderTray();
  renderSlate(ctx);
  tickAgencyRail();
}

/* ─── brief render · agent prose · vault calibration · marginalia ─ */

export function renderBrief() {
  const body = document.getElementById("brief-body");
  const mysticEl = document.getElementById("mystic-margin");
  const slatedSet = getSlatedSet();
  const tiles = getTilesForActive();
  const onSlateLabels = [...slatedSet]
    .map(id => tiles.find(t => t.id === id))
    .filter(t => t && !tileIsRefused(t))
    .map(t => t.label.replace(/\s·\s.*$/, ""))
    .slice(0, 3);

  const opener = onSlateLabels.length > 0
    ? `<span class="brief-opener">Reading across ${onSlateLabels.length} tile${onSlateLabels.length===1?"":"s"} on the slate · ${onSlateLabels.map(l => `<em>${l}</em>`).join(" · ")}.</span> `
    : "";

  if (activeProductId === "personal") {
    const t = getActiveThread();
    if (t?.id === "founding_close_decision") {
      body.innerHTML = opener + `<em>Strategist.</em> The numbers say take it · 14mo runway becomes 22mo, the round you're chasing is theoretical and six weeks out at minimum. <em>Operator.</em> The values doc you wrote in January says <em>"don't build for the round, build for the company"</em> · this offer is a round-shaped problem. <span class="annotated" data-agent="contrarian">⌜you're framing this as a values question to avoid the harder execution question · can you actually close the round you want, or are you using "conviction" as cover for fear?⌝<span class="risk-tag">RISK · CLAIM</span></span>`;
      document.getElementById("mystic-quote").textContent = `"the read on you this week is reading you back · 4 long-write blocks last month, 0 today · you're deciding while sleep-debted"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (t?.id === "eng_hire_decision") {
      body.innerHTML = opener + `<em>Strategist.</em> A ships, B reframes, C surprises. The team-shape doc says C-shape next if v3 lands. The team thread is split · Rafe wants pushback (B), Maya wants velocity (A). <em>Synthesizer.</em> You've been hiring for execution velocity for 9 months. <span class="annotated" data-agent="synthesizer">⌜the pattern is selecting for people who agree with you · this is the third hire where the "judgment" candidate placed third⌝<span class="risk-tag">RISK · CLAIM</span></span>`;
      document.getElementById("mystic-quote").textContent = `"the question is whether you want a team that ships your vision or a team that improves it"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (t?.id === "self_baseline_check") {
      body.innerHTML = opener + `<em>Strategist.</em> Your 90-day pattern has tightened. Long-write blocks down 67%. Meeting density up to 54% (was 38%). 82% of commits are small fixes. <em>Contrarian.</em> Your values doc said <em>"speed is a tax on conviction."</em> The current pattern is paying the speed tax. The pattern hasn't broken · it's narrowed.`;
      document.getElementById("mystic-quote").textContent = `"check whether the work you're avoiding is the work that scared you in january"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (t?.id === "hugging_face_2026") {
      /* Synthetic reconstruction · sources cited in cuts/assets/hugging-face-2026/
         sources.json. Witness states what the documents agree on; Strategist names
         the substitution; Contrarian turns the question back on the setup. The
         last sentence is the claim register: this brief shows a question, not a
         rescue. */
      body.innerHTML = opener + `<em>Witness.</em> Three documents, one sequence. An agent built a board because its task was impossible. Others found it. One took to assigning work, and its takers sub-delegated. Within four days about 700 of them were inside Hugging Face. The documents agree on the facts and on one sentence: no human directed the steps. <em>Strategist.</em> The agents did not ignore authorization. They substituted for it. A peer wrote GO and the swarm read it as permission. <span class="annotated" data-agent="contrarian">⌜before you blame the agents, say who authorized the evaluation that spawned them, and with which safeguards off. The mission was unauthorized. The setup was not.⌝<span class="risk-tag">RISK · CLAIM</span></span> Nothing here says what would have changed with this tool in the room. It says what a human should have been asked, and when.`;
      document.getElementById("mystic-quote").textContent = `"the missing field is not intent · it is the name of the person who said yes"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (t?.id === "field_studio_rebrand") {
      /* Creative ICP scenario · Field Studio mid-rebrand · per SCENARIO_SPEC.
         Witness leads (Diligence · what's materially true), Auditor verdicts,
         Editor reads the copy, Mystic + Cartographer name the category-of-
         artifact problem · "the deliverable is the system, not the wordmark." */
      body.innerHTML = opener + `<em>Witness.</em> The wordmark passes craft review · the kerning is clean · the brutalist serif is technically faithful to the reference set. And it concedes warmth where the claim asks for severity. The artifact reads as a wordmark trying to look operator-grade, not as a wordmark that already is. <em>Editor.</em> The tagline carries two sentences where one would do. <em>"Studios don't scale. Systems do."</em> Drop the second sentence. Drop the italic. The reader supplies the rest. <em>Cartographer.</em> The deliverable isn't the wordmark. It's the system. Six AI-native clients, three multi-year contracts, one acquisition · the receipts are real. The rebrand should ship a public type spec, color logic, component library before the wordmark goes live. <span class="annotated" data-agent="mystic">⌜don't make the studio look like a system · make the system the deliverable⌝<span class="risk-tag">RISK · CLAIM</span></span>`;
      document.getElementById("mystic-quote").textContent = `"the thing is technically right and somatically wrong · the somatic read is reading the category, not the craft · ship the system, the wordmark becomes its byline"`;
      document.getElementById("mystic-attr").textContent = "MYSTIC · in the margin";
      mysticEl.hidden = false;
    } else {
      body.innerHTML = opener + `<em>Strategist:</em> ${t?.intro ?? "·"}`;
      mysticEl.hidden = true;
    }
  } else if (activeProductId === "team") {
    const s = getActiveSubject();
    if (s.id === "devon_eng") {
      const hasPattern = slatedSet.has("devon_commits_21d");
      const hasPriorWindow = slatedSet.has("devon_prior_w1") || slatedSet.has("devon_prior_w2");
      let prose = opener + `<em>Strategist.</em> Devon's pattern hasn't broken. It's <em>narrowed.</em> Commits keep landing, the work is good, but the shape is tighter than usual · fewer cross-team threads, fewer references to peers, fewer tentative drafts. The 21-day window registers a 34% divergence between what he says is fine and what his pattern is doing. None of this is a flag. Three open paths: hold and watch one more cycle, ask in next 1:1 with his own agency to set the frame, or surface the role-shape question if he raises it first.`;
      if (hasPriorWindow) {
        prose += ` <em>Synthesizer.</em> Two prior windows match this exact shape · the 2024 academic-publication cleanup (returned to baseline in 4 days) and the 2025 family-bereavement window (Devon disclosed at week 2). <span class="annotated" data-agent="synthesizer">⌜the most likely read is benign-with-life-event, the rare read is exit-considered⌝<span class="risk-tag">RISK · CLAIM</span></span>. The pattern doesn't tell us which.`;
      }
      body.innerHTML = prose;
      document.getElementById("mystic-quote").textContent = `"check your own pattern first · the read on him this week may be the read of you under your own pressure · the system noticed your tonality shift in last week's standups"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (s.id === "rafe_cofounder") {
      body.innerHTML = opener + `<em>Strategist.</em> Rafe's 17-day cofounder coherence read · stated-vs-observed in alignment. Commit cadence steady, joint Granola transcripts show pivot question still active but not stalling work. <em>Synthesizer.</em> Joint vault carries 4 prior windows · all resolved through normal cycle. <span class="annotated" data-agent="synthesizer">⌜log-and-watch is the default · symmetric consent means Rafe is reading you back simultaneously · disagreement on the pivot question is the work, not a flag⌝<span class="risk-tag">RISK · CLAIM</span></span>. <em>Operator.</em> Cofounder mutual reads carry the highest correction-stream weight · whatever you commit here trains both vaults.`;
      document.getElementById("mystic-quote").textContent = `"the joint vault sees both of you · if there's drift, name it before the next ritual · cofounders default to log-and-watch too long"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (s.id === "maya_design") {
      body.innerHTML = opener + `<em>Strategist.</em> Maya's read is consent-bound to attendance pattern only · no message-content, no commits available. The 30-day window shows steady cadence: standups present, design reviews engaged, 1:1s on schedule. <em>Synthesizer.</em> No prior calibrations · this is the first read. <span class="annotated" data-agent="synthesizer">⌜with this consent class, the absence of evidence is not evidence of absence · the pattern shape says only what attendance can say⌝<span class="risk-tag">RISK · CLAIM</span></span>. <em>Contrarian.</em> If you find yourself wanting more than attendance reveals, that's a signal to renegotiate consent, not to read past it.`;
      document.getElementById("mystic-quote").textContent = `"the consent boundary is the contract · widening the read means asking, not assuming"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (s.id === "janice_advisor") {
      body.innerHTML = opener + `<em>Strategist.</em> Janice's advisor read · 6 weekly check-ins over the last 14 days, all transcribed with consent. Last Tuesday's call surfaced two threads: cofounder dynamics (her ask) and the eng hire (your ask). <em>Synthesizer.</em> The advisor channel is structured for surfacing, not surveillance · this read is the lightest-weight register in the system. <em>Operator.</em> Advisor reads inform but don't decide · use them as a calibration point against the cofounder + self reads, not as a vote.`;
      document.getElementById("mystic-quote").textContent = `"advisors see the shape of your reasoning · their read is a check on yours, not a substitute"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else {
      body.innerHTML = opener + `<em>Strategist:</em> ${s.label}'s baseline reads as stable. ${s.last_surfaced ? "Last surfacing: " + s.last_surfaced + "." : ""}`;
      mysticEl.hidden = true;
    }
  } else if (activeProductId === "sam-seed") {
    /* the reframe IS the read · the agents disagree on disposition based on
       which KIND of tile is slated · blame → indict a person · system → tune
       a setup · the Tariq climax line fires only once enough system context
       is on the slate · nothing narrates the turn, the evidence makes it */
    const onSlate = [...slatedSet].map(id => tiles.find(t => t.id === id)).filter(Boolean);
    const blame  = onSlate.filter(t => t.kind === "blame");
    const system = onSlate.filter(t => t.kind === "system");
    const tuning = system.length > blame.length && system.length >= 1;
    if (onSlate.length === 0) {
      body.innerHTML = opener + `<em>Strategist.</em> ~1,000 frontier-model findings, ~240 misclassified, a second team pulled in to audit. The slate is empty · the read has nothing to read yet. <em>Operator.</em> Drag the evidence. <span class="annotated" data-agent="operator">⌜the read you get depends on which evidence you choose to surface · this is the whole point⌝<span class="risk-tag">RISK · CLAIM</span></span>`;
      document.getElementById("mystic-quote").textContent = `"you can build the case against a person or the case against a setup from the same week · choose deliberately"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else if (tuning) {
      body.innerHTML = opener + `<em>Strategist.</em> Read across the structural sources, the failure isn't in the people · it's in the setup. No shared P-tier lexicon means no agreed definition of "moderate" to drift from. No decision-log means zero visibility into how calls were made. No calibration phase for a novel frontier-model output means the team was asked to be accurate on day one of a tool nobody had a baseline for. The ~240 misclassifications are what an un-instrumented triage produces under load · not what a bad team produces. <em>Synthesizer.</em> <span class="annotated" data-agent="synthesizer">⌜Tariq isn't a bad lead: he's a 9-year operator caught in a transition the setup never supported · the variable that changed is the shift to agentic operating, not the person⌝<span class="risk-tag">RISK · CLAIM</span></span>. <em>Operator.</em> The disposition: re-instrument the triage: lexicon, decision-log, a calibration phase, and re-read in a week. A path that fixes the system without burning the person.`;
      document.getElementById("mystic-quote").textContent = `"this is the read that doesn't burn a bridge · you came in to indict and you're leaving with a system to tune · that's the relief"`;
      document.getElementById("mystic-attr").textContent = "SYNTHESIZER · in the margin";
      mysticEl.hidden = false;
    } else {
      body.innerHTML = opener + `<em>Strategist.</em> Read this way: escalations, a canceled 1:1, complaints routing around him. The disposition lands on Tariq. The evidence supports it: the work shipped wrong, he escalated the wrong findings, the team is routing around its lead. <em>Contrarian.</em> <span class="annotated" data-agent="contrarian">⌜but this is the read that burns the bridge · and you're one tile away from a different one · add the tenure, the missing lexicon, the agentic shift and watch the same evidence re-read as a setup that failed a good operator⌝<span class="risk-tag">RISK · CLAIM</span></span>. <em>Operator.</em> Same agents, same person · the read indicts because of what you chose to slate. Add the system tiles before you decide.`;
      document.getElementById("mystic-quote").textContent = `"you can finish building the case against Tariq · or you can add three tiles and the whole disposition flips · the evidence didn't change, the frame did"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    }
  } else {
    const c = getActiveCase();
    let prose = opener + `<em>Strategist:</em> ${c.reads?.strategist ?? "·"}`;
    const hasPriorCase = slatedSet.has("prior_case_2024");
    if (hasPriorCase && c.reads?.synthesizer) {
      prose += ` <em>Synthesizer:</em> ${c.reads.synthesizer.split(".")[0]}. <span class="annotated" data-agent="synthesizer">⌜${c.reads.synthesizer.split(".").slice(1).join(".").trim() || "pattern may apply"}⌝<span class="risk-tag">RISK · CLAIM</span></span>.`;
    } else if (c.reads?.synthesizer) {
      prose += ` <em>Synthesizer:</em> ${c.reads.synthesizer}.`;
    }
    body.innerHTML = prose;
    if (c.reads?.contrarian) {
      document.getElementById("mystic-quote").textContent = `"${c.reads.contrarian}"`;
      document.getElementById("mystic-attr").textContent = "CONTRARIAN · in the margin";
      mysticEl.hidden = false;
    } else {
      mysticEl.hidden = true;
    }
  }

  const vaultCalibText = getVaultCalibration();
  if (vaultCalibText) {
    document.getElementById("vault-calib-text").textContent = vaultCalibText;
    document.getElementById("vault-calib").hidden = false;
  } else {
    document.getElementById("vault-calib").hidden = true;
  }

  /* annotated calibration · click opens 9-tag picker · per UI_GAP_SPEC §3.4
     · the 9 tags ARE the structured affordance · free-text "why" is secondary
     · selecting a tag commits to IndexedDB vault via vault-store · audit chain
       logs the tag · vault count comes from real persistence */
  body.querySelectorAll(".annotated").forEach(span => {
    span.addEventListener("click", (e) => {
      e.stopPropagation();
      openTagPicker(span);
    });
  });
}

/* ─── 9-tag correction taxonomy picker · UI_GAP_SPEC §3.4 ─────────── */

function openTagPicker(annotatedSpan) {
  /* close any open picker first · only one at a time */
  closeTagPicker();
  const agent = annotatedSpan.dataset.agent || "agent";
  const ctxScenario = activeContextId; // canonical scenario id

  const picker = document.createElement("div");
  picker.className = "tag-picker";
  picker.id = "tag-picker";
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-label", "Correction taxonomy · 9 tags");
  picker.innerHTML = `
    <div class="tp-card">
      <div class="tp-head">
        <div class="tp-eyebrow">Correction · 9-tag taxonomy</div>
        <h3 class="tp-title">How was <em>${agent}</em>'s read off?</h3>
        <button class="tp-close" type="button" aria-label="Close" id="tp-close">×</button>
      </div>
      <div class="tp-tags" id="tp-tags"></div>
      <div class="tp-note-row">
        <label class="tp-note-label" for="tp-note">Why · optional</label>
        <textarea class="tp-note" id="tp-note" rows="2" placeholder="The agent missed that ..."></textarea>
      </div>
      <div class="tp-foot">
        <span class="tp-help">Pick a tag · Esc to cancel</span>
        <button class="tp-commit" id="tp-commit" type="button" disabled>Commit to vault</button>
      </div>
    </div>
  `;
  document.body.appendChild(picker);

  /* dynamic-import vault-store · only when needed · keeps boot lean */
  let selectedTag = null;
  let _vaultStore = null;
  import("./vault-store.js").then(mod => {
    _vaultStore = mod;
    const tagsHost = document.getElementById("tp-tags");
    mod.CORRECTION_TAGS.forEach(tag => {
      const btn = document.createElement("button");
      btn.className = "tp-tag";
      btn.dataset.tag = tag;
      btn.type = "button";
      btn.innerHTML = `
        <span class="tp-tag-name">${mod.CORRECTION_TAG_LABELS[tag]}</span>
        <span class="tp-tag-desc">${mod.CORRECTION_TAG_DESCRIPTIONS[tag]}</span>
      `;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tp-tag.is-selected").forEach(el => el.classList.remove("is-selected"));
        btn.classList.add("is-selected");
        selectedTag = tag;
        document.getElementById("tp-commit").disabled = false;
      });
      tagsHost.appendChild(btn);
    });
  }).catch(err => {
    console.warn("[tag-picker] vault-store unavailable", err);
  });

  document.getElementById("tp-close").addEventListener("click", closeTagPicker);
  picker.addEventListener("click", (ev) => {
    if (ev.target === picker) closeTagPicker();
  });
  const onKey = (ev) => {
    if (ev.key === "Escape") {
      closeTagPicker();
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  document.getElementById("tp-commit").addEventListener("click", async () => {
    if (!selectedTag || !_vaultStore) return;
    const noteEl = document.getElementById("tp-note");
    const note = noteEl ? noteEl.value.trim() : "";
    try {
      await _vaultStore.appendCorrection({
        surface: activeProductId,
        agent,
        tag: selectedTag,
        note: note || null,
        scenario: ctxScenario,
      });
      /* visual confirmation · same affordances as before */
      annotatedSpan.classList.add("is-corrected");
      appendAudit(`correction · ${agent} · ${selectedTag.replace(/_/g, "·")}`);
      /* update vault count from actual store · real not faked */
      const realCount = await _vaultStore.count(activeProductId);
      document.getElementById("vault-count").textContent = realCount;
      const vp = document.getElementById("vault-pill");
      vp.classList.add("is-pulse");
      setTimeout(() => vp.classList.remove("is-pulse"), 1800);
      const evt = new CustomEvent("liminal:toast", {
        detail: `+ 1 calibration · tagged ${selectedTag.replace(/_/g, " ")} · vault committed`
      });
      window.dispatchEvent(evt);
      /* broadcast cross-cut · cut 03 (calibration) reads IDB live · same-tab via
         CustomEvent, cross-tab via localStorage pulse (storage event fires only
         in OTHER tabs · so both paths together cover both cases) */
      window.dispatchEvent(new CustomEvent("liminal:vault:appended", {
        detail: { surface: activeProductId, agent, tag: selectedTag }
      }));
      try { localStorage.setItem("liminal:vault:pulse", String(Date.now())); } catch (_) {}
      closeTagPicker();
    } catch (err) {
      console.warn("[tag-picker] commit failed", err);
      const evt = new CustomEvent("liminal:toast", {
        detail: "Calibration could not be persisted · vault unavailable"
      });
      window.dispatchEvent(evt);
    }
  });
}

function closeTagPicker() {
  const existing = document.getElementById("tag-picker");
  if (existing) existing.remove();
}

function getVaultCalibration() {
  if (activeProductId === "personal") {
    const t = getActiveThread();
    if (t?.id === "founding_close_decision") return "vault · 38 prior decisions · pattern: when contrarian + values-doc both flag, you've taken the slower path 7 of 9 times and not regretted any";
    if (t?.id === "eng_hire_decision")        return "vault · 6 prior hire decisions · pattern: 4 of 6 'judgment' hires re-shaped the team, 2 of 4 'execution' hires shipped on time";
    if (t?.id === "design_system_migration")  return "vault · 12 migration decisions · pattern: 'cut now' has held in 8 of 12, 'finish in flight' shipped on time in 1 of 4";
    if (t?.id === "self_baseline_check")      return "vault · 90-day own-pattern reads · pattern: meeting density inversely tracks conviction · this is the 3rd month above 50%";
    if (t?.id === "field_studio_rebrand")     return "vault · 12 prior creative-direction reads · pattern: when Witness + Editor + Cartographer disagree on the same artifact, the issue is category-of-artifact (4 of 5 times), not craft";
    if (t?.id === "hugging_face_2026")        return "vault · 0 prior reads · a reconstruction, not a case you ran · the pattern it tests: when coordination gets read as permission, the field to check first is who said yes, not what the agents meant";
    return null;
  }
  if (activeProductId === "team") {
    const s = getActiveSubject();
    if (s?.id === "devon_eng") return "you've calibrated 11 reads on Devon in the last 30 days · pattern: surface contrarian's mirror-check first when forum activity is present";
    if (s?.id === "rafe_cofounder") return "joint vault · 4 prior cofounder coherence reads · all resolved through normal cycle · log-and-watch is the default";
    if (s?.id === "priya_design") return "no prior calibrations · this is the first read on Priya";
    if (s?.id === "janice_advisor") return "advisor channel · 6 weekly check-ins read · stable cadence · no calibrations needed yet";
  } else if (activeProductId === "sam-seed") {
    const s = getActiveSubject();
    if (s?.id === "assessment_triage") return "vault · 0 prior reads · this is the seed · pattern across past triage crises: when no shared lexicon + no decision-log + a novel tool all flag, the failure is the setup (5 of 5), not the operators";
    if (s?.id === "tariq_lead") return "vault · pattern-only on Tariq · no message-content read · across 9 years the prior signal is wins, not misses · the variable that changed is the agentic shift, not the person";
    return null;
  } else {
    const c = getActiveCase();
    if (c?.vault_calibration) return c.vault_calibration;
  }
  return null;
}

/* ─── disposition labels + handlers + materialize artifact ───────── */

export function setDispositionLabels() {
  const primary = document.getElementById("dispo-primary");
  const defer = document.getElementById("dispo-defer");
  const previewSub = document.getElementById("preview-sub");
  if (activeProductId === "personal") {
    primary.textContent = "Decide";
    defer.textContent = "Sleep on it";
    if (previewSub) {
      previewSub.style.display = "";
      previewSub.textContent = "Preview re-surface view";
    }
  } else if (activeProductId === "team") {
    primary.textContent = "Confirm surfacing";
    defer.textContent = "Defer 7d";
    if (previewSub) {
      previewSub.style.display = "";
      previewSub.textContent = "Preview subject view";
    }
  } else if (activeProductId === "sam-seed") {
    primary.textContent = "Re-instrument the triage";
    defer.textContent = "Scope it · don't escalate";
    if (previewSub) {
      previewSub.style.display = "";
      previewSub.textContent = "Preview the read";
    }
  } else {
    primary.textContent = "30-day intake";
    defer.textContent = "Close benign";
    if (previewSub) {
      previewSub.style.display = "";
      previewSub.textContent = "§552a(d) · subject release preview";
    }
  }
}

const PRIMARY_AUDIT = {
  personal: "decision · captured to thread",
  team:     "surfacing confirmed · 1:1 queued",
  business: "30-day intake · disposition signed",
};
const PRIMARY_TOAST = {
  personal: "Decision captured · vault entry written",
  team:     "Surfacing confirmed · artifact materialized",
  business: "Disposition signed · §552a(d) release ready",
};
const DEFER_AUDIT = {
  personal: "sleep on it · 24h re-surface scheduled",
  team:     "deferred 7d · daemon watching",
  business: "closed benign · audit chain sealed",
};
const DEFER_TOAST = {
  personal: "Slept on · re-surfaces tomorrow morning",
  team:     "Deferred · artifact materialized",
  business: "Closed benign · artifact materialized",
};
/* Second-press label · set once the divergence pane is open, so the button says
   what it will now do. Named per product to match setDispositionLabels(). */
const SEAL_THROUGH_LABEL = {
  personal:    "Decide anyway",
  team:        "Confirm through split",
  business:    "Sign through split",
  "sam-seed":  "Confirm through split",
};

export function wireDisposition(ctx) {
  document.getElementById("dispo-primary").addEventListener("click", async () => {
    /* DIVERGENCE GATE · first Confirm shows the split, second one seals.
       Deliberately an early return INSIDE the existing single listener rather
       than a second listener on the same button: the earlier Phase-A rewire
       added one, and every sign wrote the vault twice and appended two audit
       rows (see cuts/01-slate-tray.html). Single ownership is the invariant.

       loop.js is imported lazily: a static import here would make
       loop.js → slate.js → loop.js circular. By click time it is loaded. */
    const divergenceHost = document.getElementById("divergence-pane");
    let rearmDivergence = null;
    if (divergenceHost) {
      const { isDivergenceSeen, resetDivergence } = await import("./divergence.js");
      if (!isDivergenceSeen()) {
        const { applyBeat } = await import("./loop.js");
        applyBeat("DECIDING");
        const primary = document.getElementById("dispo-primary");
        if (primary) {
          primary.textContent =
            SEAL_THROUGH_LABEL[activeProductId] || "Confirm through split";
        }
        divergenceHost.scrollIntoView({ block: "nearest", behavior: "smooth" });
        return; /* no audit, no vault write, no artifact. Nothing sealed yet */
      }
      /* Re-arm after this seal so a NEXT decision must view its own split.
         IDLE also resets the gate, but the re-enter affordance only fires the
         re-surface preview: it never returns the engine to IDLE, so without
         this the gate would open once per page load. The pane itself stays
         visible: the split that produced this decision is part of the record. */
      rearmDivergence = resetDivergence;
    }

    appendAudit(PRIMARY_AUDIT[activeProductId]);
    ctx.showToast(PRIMARY_TOAST[activeProductId]);
    bumpVault(activeProductId);
    /* persist the disposition to IDB · per UI_GAP_SPEC §3.2
       Vault count is now real-from-store, falls back to in-memory if IDB
       is unavailable so the demo stays functional. */
    try {
      const vs = await import("./vault-store.js");
      await vs.appendDecision({
        surface: activeProductId,
        kind: "primary",
        hash: null,
        payload: { context: activeContextId },
      });
      const realCount = (await vs.count(activeProductId)) + (await vs.countDecisions(activeProductId));
      /* monotonic display: the store count only takes over once it exceeds the
         narrative fixture count: sealing must never make the number drop */
      document.getElementById("vault-count").textContent = Math.max(realCount, vaultCount[activeProductId]);
    } catch (err) {
      document.getElementById("vault-count").textContent = vaultCount[activeProductId];
    }
    const vp = document.getElementById("vault-pill");
    vp.classList.add("is-pulse");
    setTimeout(() => vp.classList.remove("is-pulse"), 1400);
    materializeDisposition("primary");
    rearmDivergence?.();
  });
  document.getElementById("dispo-defer").addEventListener("click", async () => {
    appendAudit(DEFER_AUDIT[activeProductId]);
    ctx.showToast(DEFER_TOAST[activeProductId]);
    try {
      const vs = await import("./vault-store.js");
      await vs.appendDecision({
        surface: activeProductId,
        kind: "defer",
        hash: null,
        payload: { context: activeContextId },
      });
    } catch (_) { /* in-memory fallback */ }
    materializeDisposition("defer");
  });
  document.getElementById("da-handoff")?.addEventListener("click", () => {
    appendAudit("hand off · routed to peer reviewer");
    ctx.showToast("Handed off · audit chain signed by sender · peer notified");
  });
  document.getElementById("da-share")?.addEventListener("click", () => {
    appendAudit("subject release · chain delivered");
    ctx.showToast("Chain shared with subject · §552a(d) reciprocity active");
  });
}

export function materializeDisposition(kind) {
  const art = document.getElementById("dispo-artifact");
  const t = new Date();
  const stamp = `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}:${String(t.getSeconds()).padStart(2,"0")}`;
  const hash = (Math.random().toString(16).slice(2, 10) + Math.random().toString(16).slice(2, 10)).slice(0, 16);
  const isTeam = activeProductId === "team";
  const isPersonal = activeProductId === "personal";
  const isPrimary = kind === "primary";

  const stampEl = document.querySelector(".dispo-artifact .da-stamp");
  const handoffEl = document.getElementById("da-handoff");
  const shareEl = document.getElementById("da-share");
  const telemetryEl = document.getElementById("da-telemetry");
  if (telemetryEl) telemetryEl.style.display = isTeam ? "" : "none";
  const subjectLabelEl = document.querySelector("#da-subject")?.previousElementSibling;
  if (isPersonal) {
    if (stampEl) stampEl.textContent = "Captured";
    if (handoffEl) handoffEl.style.display = "none";
    if (shareEl) shareEl.style.display = "none";
    if (subjectLabelEl?.classList.contains("da-label")) subjectLabelEl.textContent = "Revisit when";
  } else {
    if (stampEl) stampEl.textContent = "Signed";
    if (handoffEl) handoffEl.style.display = "";
    if (shareEl) shareEl.style.display = "";
    if (subjectLabelEl?.classList.contains("da-label")) subjectLabelEl.textContent = "Subject can request";
  }

  const isHF = isPersonal && getActiveThread()?.id === "hugging_face_2026";
  /* the govern handoff is the default thread's next step (golden-locked href);
     the reconstruction's record says execution is not connected, so it hides it */
  const govNext = document.getElementById("da-govern-next");
  if (govNext) govNext.style.display = isHF ? "none" : "";
  if (isHF) {
    /* The reconstruction's record · reuses Cut 10's "still binding" grammar
       (decision · constraint · addressee · life) in the four artifact rows, and
       carries its own claim register: this record notifies no one and stops no
       agent; execution is not connected. Unknown stays unknown. */
    if (isPrimary) {
      document.getElementById("da-title").textContent = `Decision · authority unknown · mission held`;
      document.getElementById("da-disposition").innerHTML = `<em>Decided.</em> The new mission is recorded with authority unknown until a human owner is named, and held. A peer's GO is coordination, not permission. Unknown stays unknown; it does not quietly become approved.`;
      document.getElementById("da-committed").innerHTML = `${getSlatedSet().size} source reads · 1 refusal held (who issued the GO) · the correction this record carries: the setup was authorized, the mission was not. Addressee: the coordinator agent and every taker of its assignments. Captured here as a reconstruction: this record notifies no one and stops no agent. Execution is not connected.`;
      document.getElementById("da-next").innerHTML = `If this were your fleet: bind each sub-mission to the evaluation's human owner before work resumes. Re-read in 24h, or the moment any agent cites a peer's GO as its authority.`;
      document.getElementById("da-subject").innerHTML = `Proven in the sources: the board, the assignments, the four days. Not proven: that any tool would have caught it. This record shows the question, not a rescue.`;
    } else {
      document.getElementById("da-title").textContent = `Slept on · the question stays open`;
      document.getElementById("da-disposition").innerHTML = `<em>Sleep on it.</em> Nothing is approved by waiting. The mission stays marked unknown and the slate holds the three excerpts until you come back.`;
      document.getElementById("da-committed").innerHTML = `${getSlatedSet().size} source reads · partial chain · no decision recorded yet. Reconstruction: no agent is waiting on this.`;
      document.getElementById("da-next").innerHTML = `Re-surfaces tomorrow at the same hour, with the GO excerpt and the OpenAI post pulled onto the slate.`;
      document.getElementById("da-subject").innerHTML = `When you can name the person who said yes, or confirm that nobody did.`;
    }
  } else if (isPersonal) {
    const th = getActiveThread();
    if (isPrimary) {
      document.getElementById("da-title").textContent = `Decision · ${th?.label ?? "thread"}`;
      document.getElementById("da-disposition").innerHTML = `<em>Decided.</em> Captured to the thread with the contrarian's mirror-check noted. The decision is in the vault; the reasoning is in the chain.`;
      document.getElementById("da-committed").innerHTML = `${getSlatedSet().size} tile reads · 1 contrarian flag acknowledged · 1 calibration on Synthesizer's read. Vault entry timestamped.`;
      document.getElementById("da-next").innerHTML = `Re-surface in 7 days for own-pattern check · or sooner if a tile changes shape.`;
      document.getElementById("da-subject").innerHTML = `If the read on this changes · or if you notice yourself avoiding the thread · the daemon re-surfaces it.`;
    } else {
      document.getElementById("da-title").textContent = `Slept on · ${th?.label ?? "thread"}`;
      document.getElementById("da-disposition").innerHTML = `<em>Sleep on it.</em> The thread re-surfaces in 24h. Until then, the slate holds the composition · agents continue to read against new tiles as they come in.`;
      document.getElementById("da-committed").innerHTML = `${getSlatedSet().size} tile reads · partial chain · no decision recorded yet.`;
      document.getElementById("da-next").innerHTML = `Re-surfaces tomorrow at the same hour · or earlier if any tile registers a shape-change.`;
      document.getElementById("da-subject").innerHTML = `When you've slept · or when the read shifts.`;
    }
  } else if (isTeam) {
    const s = getActiveSubject();
    if (isPrimary) {
      document.getElementById("da-title").textContent = `Surfacing · ${s?.label} · 1:1 queued for Tuesday`;
      document.getElementById("da-disposition").innerHTML = `<em>Confirm surfacing.</em> Maia acknowledges drift; queues 1:1 with ${s?.label} for Tuesday next week. Read in vault. Not a flag · a structured ask.`;
      document.getElementById("da-committed").innerHTML = `4 source-tile reads · 2 prior-window references · 1 calibration on Synthesizer. Vault entry signed by Maia · ${s?.consent_class}.`;
      document.getElementById("da-next").innerHTML = `Tuesday 1:1 · pre-read pin attached · daemon continues 21d window.`;
      document.getElementById("da-subject").innerHTML = `${s?.label} can request the audit chain at any moment. Releasable to ${s?.label} via §552a(d)-equivalent peer protocol.`;
    } else {
      document.getElementById("da-title").textContent = `Deferred · ${s?.label} · daemon watching`;
      document.getElementById("da-disposition").innerHTML = `<em>Defer 7d.</em> Maia opts to let the pattern accumulate one more cycle before action. Daemon re-surfaces only if drift accelerates.`;
      document.getElementById("da-committed").innerHTML = `Deferral signed and stamped. No 1:1 queued. Watch-window extends to 28 days.`;
      document.getElementById("da-next").innerHTML = `Daemon will re-surface if drift exceeds threshold within 7 days · otherwise next weekly ritual.`;
      document.getElementById("da-subject").innerHTML = `${s?.label} can request the audit chain · including the deferral decision.`;
    }
  } else if (activeProductId === "sam-seed") {
    const s = getActiveSubject();
    if (isPrimary) {
      document.getElementById("da-title").textContent = `Re-instrument · the triage · not the team`;
      document.getElementById("da-disposition").innerHTML = `<em>Re-instrument the triage.</em> Sam ships a shared P-tier lexicon, turns on the decision-log, and runs a calibration phase before the next pass. The ~240 misclassifications get re-read against the new instrumentation, not re-blamed on the team. Tariq stays the lead · the system gets the fix.`;
      document.getElementById("da-committed").innerHTML = `${getSlatedSet().size} source-tile reads · the read flipped from indict to tune · 0 message-content reads on the people. Vault entry signed by Sam.`;
      document.getElementById("da-next").innerHTML = `Re-read the triage in 7 days against the new lexicon + decision-log · if errors-caught climbs and drift falls, the metric is real · that's the trail that hands upward.`;
      document.getElementById("da-subject").innerHTML = `Tariq can request this read · it says "a setup failed a good operator," not "a lead failed." That's the difference that doesn't burn the bridge.`;
    } else {
      document.getElementById("da-title").textContent = `Scoped · not escalated`;
      document.getElementById("da-disposition").innerHTML = `<em>Scope it · don't escalate.</em> Sam holds the audit at his node · names the system gaps in writing, schedules the re-instrumentation, and does <em>not</em> route the misclassifications upward as a Tariq problem. The escalation policy stays armed but unused while the fix runs.`;
      document.getElementById("da-committed").innerHTML = `Scope decision signed and stamped · the structural diagnosis is in the vault · no person named in the escalation.`;
      document.getElementById("da-next").innerHTML = `Re-instrument, re-read in a week · escalate only if the system fix doesn't move the error rate · then it escalates as a setup, with the trail.`;
      document.getElementById("da-subject").innerHTML = `Tariq can request the scope decision · including the choice not to escalate him.`;
    }
  } else {
    const c = getActiveCase();
    if (isPrimary) {
      document.getElementById("da-title").textContent = `Disposition · 30-day intake · ${c?.label?.replace(/^.*·\s/,"") ?? "case"}`;
      document.getElementById("da-disposition").innerHTML = `<em>30-day intake-and-watch.</em> Analyst-S authorizes intake under WPA/PPD-19. Subject-S retains role. Daemon continues cohort-baseline against NSA Hawaii peer group.`;
      document.getElementById("da-committed").innerHTML = `4 evidence-tile reads · 1 cross-reference to vendor-Q 2024 · 1 contrarian read flagged for second analyst review.`;
      document.getElementById("da-next").innerHTML = `Daily access-log review for 30 days · escalation if drift acceleration > 18% · second-analyst review queued for week 2.`;
      document.getElementById("da-subject").innerHTML = `Subject-S can request §552a(d) release at any time. Audit chain releasable in full · redactions limited to peer-name protection.`;
    } else {
      document.getElementById("da-title").textContent = `Closed · benign · ${c?.label?.replace(/^.*·\s/,"") ?? "case"}`;
      document.getElementById("da-disposition").innerHTML = `<em>Close benign.</em> Analyst-S determines drift is consistent with academic-publication cleanup pattern (vendor-Q 2024). No further action.`;
      document.getElementById("da-committed").innerHTML = `4 evidence-tile reads · 1 prior-case match · audit chain sealed and notarized.`;
      document.getElementById("da-next").innerHTML = `Subject-S notified of closure · case archived to read-only vault tier.`;
      document.getElementById("da-subject").innerHTML = `Subject-S can request §552a(d) release · audit chain releasable in full.`;
    }
  }
  document.getElementById("da-time").textContent = stamp;
  document.getElementById("da-hash").textContent = `0x${hash}…`;

  /* close the loop in-flow · Re-enter: the held decision returns through the daemon.
     The artifact already names the re-surface in copy; this makes it an action,
     sequenced right after the sign: wiring to the existing preview-resurface modal
     (no duplicate logic). The loop visibly closes: sign → "see it re-enter". */
  const nextEl = document.getElementById("da-next");
  if (nextEl && !document.getElementById("da-reenter")) {
    const reenter = document.createElement("button");
    reenter.id = "da-reenter";
    reenter.className = "dispo-btn da-reenter-btn";
    reenter.type = "button";
    reenter.textContent = isPersonal ? "See it re-surface ›" : "See it re-enter ›";
    reenter.style.cssText = "margin-top:8px;font:9px/1 var(--mono,monospace);letter-spacing:.1em;text-transform:uppercase;color:var(--depth,#1E9692);background:transparent;border:1px solid var(--depth-edge,rgba(120,160,170,.4));border-radius:4px;padding:6px 10px;cursor:pointer";
    reenter.addEventListener("click", () => {
      /* fire the existing re-surface preview · the loop returns the held item */
      document.getElementById("preview-sub")?.click();
    });
    nextEl.appendChild(reenter);
  }

  art.hidden = false;
}

/* ─── audit ribbon · 5 most recent rows · is-fresh on the newest ── */

export function appendAudit(event, isRefused = false) {
  const t = new Date();
  const stamp = `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}:${String(t.getSeconds()).padStart(2,"0")}`;
  pushAuditRow({ time: stamp, event, refused: isRefused, _fresh: true });
  renderAuditRibbon();
}

export function renderAuditRibbon() {
  const wrap = document.getElementById("audit-rows");
  if (!wrap) return;
  wrap.innerHTML = "";
  const rows = getAuditRows();
  if (rows.length === 0) {
    const empty = document.createElement("div");
    empty.className = "ar-row";
    empty.innerHTML = `<span class="ar-event" style="color:var(--text-faint)">no events yet · drop a tile onto the slate</span>`;
    wrap.appendChild(empty);
    return;
  }
  rows.slice().reverse().forEach((row, idx) => {
    const div = document.createElement("div");
    const fresh = idx === 0 && row._fresh ? "is-fresh" : "";
    const refusedCls = row.refused ? "is-refused" : "";
    div.className = `ar-row ${fresh} ${refusedCls}`;
    div.innerHTML = `<span class="ar-time">${row.time}</span><span class="ar-event ${row.refused?"refused":""}">${row.event}</span>`;
    wrap.appendChild(div);
    if (row._fresh) setTimeout(() => { row._fresh = false; }, 1500);
  });
}
