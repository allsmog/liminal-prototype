/* boot.js · entrypoint · wires the modules together
 *
 * imports:
 *   state.js       · pure mutable state + accessors
 *   agency.js      · right-rail liveness + reader chips
 *   tray.js        · the palette · renderTray + tilePreviewHTML + toggleTray
 *   slate.js       · composition surface · renderSlate + brief + disposition
 *                    + audit ribbon · onTileClick + onTileRemove
 *   classification.js · Business banner with decode toggle
 *   marginalia.js  · Caveat editor's notes overlay
 *   undo.js        · ⌘Z handler (popUndo with surface hop)
 *   keyboard.js    · unified shortcut layer + help overlay
 *
 * Everything that wasn't pulled into a module lives here:
 *   · setProduct + setContext + prestage
 *   · the three rail renderers (Personal / Team / Business)
 *   · staged boot moment + canonical-case glow
 *   · slate-canvas drop wiring (HTML5 + OS file/url)
 *   · tray-panel drop wiring (capture-to-vault on OS drop)
 *   · modal preview subject view
 *   · showToast helper
 *   · boot.
 */
import { SPEC_VERSION, PROTOTYPE_VERSION } from "../config/versions.js";
import { CONSENT_CLASSES } from "../config/consent.js";
import { PERSONAL_OPERATOR, PERSONAL_THREADS, PERSONAL_TILES_FOR_THREAD } from "../data/personal.js";
import { TEAM_SUBJECTS, TEAM_TILES_FOR_SUBJECT, TEAM_DAEMON, TEAM_GOVERNANCE_LOG } from "../data/team.js";
import { BUSINESS_OPERATOR, BUSINESS_TILES_FOR_CASE, BUSINESS_SCENARIOS } from "../data/business.js";
import { SAMSEED_OPERATOR, SAMSEED_SUBJECTS, SAMSEED_TILES_FOR_SUBJECT } from "../data/sam-seed.js";

import {
  setActiveProductId, setActiveContextId,
  activeProductId, activeContextId,
  slated, vaultCount, auditRows,
  getActiveSubject, getActiveCase, getActiveThread,
  getTilesForActive, tileIsRefused, getSlatedSet,
  setLastLandedId, resetAgencyState,
  threadVisible, /* ?scenario= visibility · shared with keyboard.js */
} from "./state.js";

import {
  AGENT_FLAT, REGISTERS, REGISTER_AGENTS,
  tickAgencyRail, renderConsole, refreshSlateReaderChips,
  startAgencyTicker, stopAgencyTicker,
} from "./agency.js";

import { renderTray, tilePreviewHTML, toggleTray } from "./tray.js";

import {
  renderSlate, renderSlateHeader, renderBrief,
  setDispositionLabels, materializeDisposition, wireDisposition,
  appendAudit, renderAuditRibbon,
  onTileClick, onTileRemove,
} from "./slate.js";

import { renderClassificationBanner, clearClassificationBanner } from "./classification.js";
import { renderAnnotations, clearAnnotations, wireMarginaliaToggle } from "./marginalia.js";
import { popUndo } from "./undo.js";
import { wireKeyboard } from "./keyboard.js";

/* ─── version pin · dev-only · ?dev or ?v reveals it ─────────────── */

const _devMode = /[?&](dev|v)\b/.test(location.search);
if (_devMode) {
  const _vp = document.getElementById("v-pin");
  if (_vp) _vp.hidden = false;
  document.getElementById("vp-spec").textContent  = SPEC_VERSION;
  document.getElementById("vp-proto").textContent = PROTOTYPE_VERSION;
}

/* ─── shared helpers ─────────────────────────────────────────────── */

function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("is-shown");
  setTimeout(() => t.classList.remove("is-shown"), 2400);
}
/* slate.js dispatches a custom event when calibration commits · forward it */
window.addEventListener("liminal:toast", (e) => showToast(e.detail));

/* ctx · the lightweight callback object passed into modules that need
   to invoke siblings (so we don't create import cycles between slate
   and tray, etc.) */
const ctx = {
  showToast,
  toggleTray,
  renderTray:    () => renderTray(ctx),
  renderSlate:   () => renderSlate(ctx),
  tickAgencyRail,
  setProduct:    (id) => setProduct(id),
  setContext:    (id) => setContext(id),
  onTileClick:   (tile, isRefused) => onTileClick(tile, isRefused, ctx),
  onTileRemove:  (tile) => onTileRemove(tile, ctx),
  appendAudit,
  undo:          () => popUndo({ ...ctx, renderSlate: () => renderSlate(ctx), renderTray: () => renderTray(ctx) }),
  /* exposed so keyboard's ⌘⇧R reset can refresh the vault-count pill */
  refreshVaultCount: () => refreshVaultCount(),
};

/* ─── pre-staged tiles · the killing feature on boot ─────────────── */

const PRESTAGED_TILES = {
  personal: {
    /* canonical thread boots with the term sheet + investor call + values doc */
    founding_close_decision: ["term_sheet_doc", "investor_granola", "values_doc_jan"],
    eng_hire_decision: ["hire_loop_notes", "candidate_a_granola", "candidate_b_granola"],
    design_system_migration: ["v2_audit_doc", "design_review_granola"],
    self_baseline_check: ["self_calendar_90d", "commits_90d", "values_doc_jan"],
    /* Field Studio rebrand · creative ICP · pre-stage v3 + v1/v2 + tagline drafts
       so the brief lands immediately on entry · Witness reads the artifact pair */
    field_studio_rebrand: ["field_v3_brand_guide", "field_v1_v2_assets", "field_tagline_drafts"],
    /* Hugging Face 2026 reconstruction · the timeline, the board, the delegation
       land first so the brief reads on entry; the GO excerpt and the OpenAI post
       stay in the tray for the second look */
    hugging_face_2026: ["hf_timeline", "metr_board", "metr_delegation"],
  },
  team: {
    brian_eng: ["brian_commits_21d", "brian_prior_w1"],
    rafe_cofounder: ["rafe_commits_17d", "rafe_granola_joint", "maia_corrections"],
    maya_design: ["maya_attendance"],
    janice_advisor: ["janice_granola"],
  },
  business: {
    ci_analyst_insider_threat: ["case_file_S", "access_log_21d", "peer_baseline"],
  },
};

function prestage(productId, contextId) {
  const ids = PRESTAGED_TILES[productId]?.[contextId];
  if (!ids) return;
  if (!slated[productId][contextId]) slated[productId][contextId] = new Set();
  const set = slated[productId][contextId];
  if (set.size > 0) return;
  ids.forEach(id => set.add(id));
  if (auditRows[productId].length === 0) {
    const t0 = new Date();
    ids.forEach((id, i) => {
      const stamp = `${String(t0.getHours()).padStart(2,"0")}:${String(t0.getMinutes()-i).padStart(2,"0")}:00`;
      auditRows[productId].push({ time: stamp, event: `drop · ${id.replace(/_/g," ")} → slate`, refused: false });
    });
  }
}

/* ─── product/context navigation ─────────────────────────────────── */

function setProduct(productId) {
  setActiveProductId(productId);
  document.body.dataset.product = productId;
  document.querySelectorAll(".product-tab").forEach(el => {
    el.classList.toggle("is-active", el.dataset.product === productId);
  });

  if (productId === "personal") {
    setActiveContextId((PERSONAL_THREADS.find(t => t.canonical) ?? PERSONAL_THREADS[0]).id);
    renderPersonalRail();
    document.getElementById("sm-banner").textContent =
      PERSONAL_OPERATOR.role + " · " + PERSONAL_OPERATOR.unit;
  } else if (productId === "team") {
    setActiveContextId("brian_eng");
    renderTeamRail();
    document.getElementById("sm-banner").textContent =
      "Manager · " + (TEAM_SUBJECTS.find(s => s.id === "brian_eng")?.role ?? "");
  } else if (productId === "sam-seed") {
    setActiveContextId("assessment_triage");
    renderSamSeedRail();
    document.getElementById("sm-banner").textContent =
      SAMSEED_OPERATOR.role + " · " + SAMSEED_OPERATOR.unit;
  } else {
    setActiveContextId("ci_analyst_insider_threat");
    renderBusinessRail();
    document.getElementById("sm-banner").textContent =
      BUSINESS_OPERATOR.label + " · " + BUSINESS_OPERATOR.role + " · " + BUSINESS_OPERATOR.clearance.toUpperCase() + "-cleared";
  }

  prestage(activeProductId, activeContextId);
  setContext(activeContextId);
}

function setContext(id) {
  setActiveContextId(id);
  /* exposed for the inline metric band, which keys on product and (since the
     Hugging Face 2026 thread) on context too */
  document.body.dataset.context = id ?? "";
  prestage(activeProductId, activeContextId);
  document.getElementById("dispo-artifact").hidden = true;
  /* The divergence pane caches itself by its own contents (renderDivergence
     returns early when the host is non-empty). Specs are now keyed by context
     as well as product, so a thread switch must clear the pane and re-arm the
     gate, or the next Decide would show the previous thread's split. */
  const dvg = document.getElementById("divergence-pane");
  if (dvg && dvg.innerHTML.trim() !== "") {
    dvg.innerHTML = "";
    dvg.hidden = true;
    import("./divergence.js").then(d => d.resetDivergence()).catch(() => {});
  }
  resetAgencyState(AGENT_FLAT);
  highlightLeftRail();
  renderSlateHeader();
  renderTray(ctx);
  renderSlate(ctx);
  renderAuditRibbon();
  setDispositionLabels();
  /* vault count: prefer real IDB count when available, fall back to seeded
     in-memory baseline · keeps demo functional when IDB unavailable */
  refreshVaultCount();
  tickAgencyRail();
  startAgencyTicker(3500);
  /* re-render annotations on context switch · DOM reflows move targets */
  if (document.body.classList.contains("notes-on")) {
    requestAnimationFrame(renderAnnotations);
  }
}

/* refresh vault-count pill from IndexedDB · seeded baseline as fallback
   · per UI_GAP_SPEC §3.2 the vault is the moat · count must be real */
async function refreshVaultCount() {
  const el = document.getElementById("vault-count");
  if (!el) return;
  try {
    const vs = await import("./vault-store.js");
    if (!vs.isAvailable()) {
      el.textContent = vaultCount[activeProductId];
      return;
    }
    const corrections = await vs.count(activeProductId);
    const decisions = await vs.countDecisions(activeProductId);
    const seeded = vaultCount[activeProductId]; // baseline (e.g., 14, 247, 38)
    /* show seeded + real persisted · the seeded baseline represents historical
       reads before this session, real count is what the user has added */
    el.textContent = seeded + corrections + decisions;
    renderVaultState(seeded + corrections + decisions);
  } catch (_) {
    el.textContent = vaultCount[activeProductId];
    renderVaultState(vaultCount[activeProductId]);
  }
}

/* ─── vault lattice · the atlas Vault primitive, live (2026-07-29) ────
   p-vault (lib/cut-shell-products.css) rendered from the real count:
   state per the atlas row · empty ◇ · seeded ◯ · dense ● · gapped.
   Deterministic fill (no randomness): packets distribute across the
   12-week × 4-register lattice in register ratio d/j/s/o, alternating
   solid/soft; one deliberate judgment-week gap stays dashed when dense
   (the audit makes the gap visible). */
const VAULT_REGS = [
  { k: "d", label: "diligence", ratio: 0.35 },
  { k: "j", label: "judgment",  ratio: 0.27 },
  { k: "s", label: "synthesis", ratio: 0.20 },
  { k: "o", label: "outreach",  ratio: 0.18 },
];
function vaultAtlasState(n) {
  if (n <= 0)  return { name: "empty",  glyph: "◇" };
  if (n < 12)  return { name: "seeded", glyph: "◯" };
  return { name: "dense", glyph: "●" };
}
function renderVaultState(total) {
  const st = vaultAtlasState(total);
  const glyphEl = document.getElementById("vault-glyph");
  if (glyphEl) glyphEl.textContent = st.glyph;
  const stateEl = document.getElementById("vault-modal-state");
  if (stateEl) stateEl.textContent = st.name + " · " + st.glyph;
  const eyebrowEl = document.getElementById("vault-modal-eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = `vault · ${total} packets · 12 wks · ${activeProductId}`;
  const lattice = document.getElementById("vault-lattice");
  if (!lattice) return;
  lattice.innerHTML = "";
  const dense = st.name === "dense";
  VAULT_REGS.forEach(r => {
    const lit = Math.min(12, Math.round(total * r.ratio));
    const rail = document.createElement("div");
    rail.className = `p-vault__rail p-vault__rail--${r.label}`;
    let cells = "";
    for (let w = 0; w < 12; w++) {
      if (dense && r.k === "j" && w === 5) { cells += '<div class="p-vault__cell p-vault__cell--miss" title="week 6 · no judgment packet · the gap the audit keeps visible"></div>'; continue; }
      const on = w < lit;
      const cls = on ? ` p-vault__cell--lit-${r.k}${w % 2 ? "" : "-s"}` : "";
      cells += `<div class="p-vault__cell${cls}"></div>`;
    }
    rail.innerHTML = `<span class="p-vault__rail-label">${r.label}</span><div class="p-vault__cells">${cells}</div>`;
    lattice.appendChild(rail);
  });
}
function wireVaultModal() {
  const pill = document.getElementById("vault-pill");
  const overlay = document.getElementById("vault-modal-overlay");
  if (!pill || !overlay) return;
  pill.addEventListener("click", () => {
    refreshVaultCount();
    overlay.classList.add("is-open");
    document.getElementById("vault-modal-close")?.focus();
  });
  document.getElementById("vault-modal-close")?.addEventListener("click", () => overlay.classList.remove("is-open"));
  overlay.addEventListener("click", (e) => { if (e.target.id === "vault-modal-overlay") overlay.classList.remove("is-open"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("is-open")) overlay.classList.remove("is-open"); });
}

/* ─── three rails · subjects · cases · threads ───────────────────── */

function renderPersonalRail() {
  document.getElementById("rail-l-label").textContent = "Active reads";
  const threads = PERSONAL_THREADS.filter(threadVisible);
  document.getElementById("rail-l-meta").textContent = threads.length + " · self";
  const list = document.getElementById("rail-l-list");
  list.innerHTML = "";
  threads.forEach(thread => {
    const item = document.createElement("button");
    item.className = "subject-item";
    item.dataset.id = thread.id;
    item.innerHTML = `
      <div class="subject-row1">
        <span class="si-name">${thread.label}</span>
        ${thread.drift_state === "deciding" ? '<span class="drift-dot"></span>' : ''}
      </div>
      <div class="subject-row2">${thread.eyebrow.toUpperCase()}</div>
      <div class="consent-chip is-mutual">
        <span class="lock">◇</span>${thread.tile_count} tiles · ${thread.last_touched}
      </div>
    `;
    item.addEventListener("click", () => setContext(thread.id));
    list.appendChild(item);
  });
}

function renderTeamRail() {
  document.getElementById("rail-l-label").textContent = "Subjects";
  document.getElementById("rail-l-meta").textContent = TEAM_SUBJECTS.length + " · with consent";
  const list = document.getElementById("rail-l-list");
  list.innerHTML = "";
  TEAM_SUBJECTS.forEach(s => {
    const cc = CONSENT_CLASSES[s.consent_class];
    const item = document.createElement("button");
    item.className = "subject-item";
    item.dataset.id = s.id;
    item.innerHTML = `
      <div class="subject-row1">
        <span class="si-name">${s.label}</span>
        ${s.drift_state === "drifting" ? '<span class="drift-dot"></span>' : ''}
      </div>
      <div class="subject-row2">${s.role.toUpperCase()}</div>
      <div class="consent-chip ${s.consent_class === "mutual-cofounder" ? "is-mutual" : ""}">
        <span class="lock">⌥</span>${cc?.label ?? s.consent_class}
      </div>
      <div class="subject-telemetry ${s.drift_state === "drifting" ? "is-drifting" : ""}">${
        s.drift_state === "drifting"
          ? `drifting · surfaced ${s.last_surfaced.replace(" · drift detected", "")}`
          : `stable · ${s.window_days}d baseline`
      }</div>
    `;
    item.addEventListener("click", () => setContext(s.id));
    list.appendChild(item);
  });

  /* team-drift fold (2026-07-29): the console's daemon + governance trail,
     rendered loop-native under the roster. Same fixtures as team-drift/. */
  const daemon = document.createElement("div");
  daemon.className = "rail-daemon";
  daemon.innerHTML = `
    <div class="rd-head"><span>Daemon</span><span class="rd-state">${TEAM_DAEMON.status.toUpperCase()}</span></div>
    <div class="rd-line">ingest ${TEAM_DAEMON.sources} sources · baseline ${TEAM_DAEMON.baseline_days}d · coherence checks ${TEAM_DAEMON.coherence_checks}</div>
    <div class="rd-govlog">${TEAM_GOVERNANCE_LOG.map(e =>
      `<div class="rd-gl-row"><span class="rd-gl-t">${e.t}</span><span class="rd-gl-a">${e.agent}</span><span class="rd-gl-l">${e.line}</span></div>`
    ).join("")}</div>
    <a class="rd-open" href="../team-drift/index.html">Open team telemetry ›</a>
  `;
  list.appendChild(daemon);
}

function renderSamSeedRail() {
  document.getElementById("rail-l-label").textContent = "What's drifting";
  document.getElementById("rail-l-meta").textContent = SAMSEED_SUBJECTS.length + " · own team";
  const list = document.getElementById("rail-l-list");
  list.innerHTML = "";
  SAMSEED_SUBJECTS.forEach(s => {
    const cc = CONSENT_CLASSES[s.consent_class];
    const item = document.createElement("button");
    item.className = "subject-item";
    item.dataset.id = s.id;
    item.innerHTML = `
      <div class="subject-row1">
        <span class="si-name">${s.label}</span>
        ${s.drift_state === "drifting" ? '<span class="drift-dot"></span>' : ''}
      </div>
      <div class="subject-row2">${s.role.toUpperCase()}</div>
      <div class="consent-chip">
        <span class="lock">⌥</span>${cc?.label ?? s.consent_class}
      </div>
    `;
    item.addEventListener("click", () => setContext(s.id));
    list.appendChild(item);
  });
}

function renderBusinessRail() {
  document.getElementById("rail-l-label").textContent = "Queue";
  document.getElementById("rail-l-meta").textContent = BUSINESS_SCENARIOS.length + " · routed";
  const list = document.getElementById("rail-l-list");
  list.innerHTML = "";
  BUSINESS_SCENARIOS.forEach(s => {
    const item = document.createElement("button");
    item.className = "case-item";
    item.dataset.id = s.id;
    item.innerHTML = `
      <div class="subject-row1">
        <span class="si-name">${s.label}</span>
      </div>
      <div class="subject-row2">${(s.operator ?? "").split("·")[0].toUpperCase()}</div>
      <div class="consent-chip">
        <span class="lock">⌥</span>${s.in_lane ? "in-lane" : "intake"}
      </div>
    `;
    item.addEventListener("click", () => setContext(s.id));
    list.appendChild(item);
  });
}

function highlightLeftRail() {
  document.querySelectorAll(".subject-item, .case-item").forEach(el => {
    el.classList.toggle("is-active", el.dataset.id === activeContextId);
  });
}

/* ─── modal · preview-subject view (Team + Business only) ────────── */

function wirePreviewSubject() {
  document.getElementById("preview-sub")?.addEventListener("click", () => {
    const overlay = document.getElementById("modal-overlay");
    const sCount = getSlatedSet().size;
    const auditList = auditRows[activeProductId];

    if (activeProductId === "personal") {
      /* Personal · "what comes back" · the daemon's re-surface view, written
         as if it's tomorrow morning and the thread is back · this is the
         demonstration that "sleep on it" is a real loop, not a fade-out */
      const th = getActiveThread();
      document.getElementById("modal-title").textContent = `Re-surface · ${th?.label ?? "thread"}`;
      document.getElementById("modal-tag").textContent = "Tomorrow · 7:14 AM";
      document.getElementById("modal-label-1").textContent = "What the daemon brings back";
      document.getElementById("modal-content-1").innerHTML =
        `<em>Slept on · re-surfacing now.</em> ${sCount} tile${sCount===1?"":"s"} on the slate when you slept. The composition is preserved. ` +
        (th?.id === "founding_close_decision"
          ? `Two new tiles arrived overnight: <em>investor follow-up email</em> (asks for decision by EOD) and <em>cofounder Slack</em> (Rafe: "I'd take it · the next round will be cleaner if we ship Q3"). The contrarian's mirror-check from yesterday is pinned: ⌜you were deciding while sleep-debted⌝ · you slept. The read is now reading you rested.`
          : th?.id === "eng_hire_decision"
          ? `One new tile arrived: <em>candidate B</em> sent a follow-up technical write-up unprompted. The agency rail flags this as a signal-of-fit: B is reframing without being asked. Synthesizer's read shifts: "the third hire pattern (judgment placed third) just got a counter-example."`
          : th?.id === "design_system_migration"
          ? `No new tiles. The slate holds. Strategist re-reads the audit doc against your principles doc and surfaces a third option you didn't see yesterday: ship v1 + v2 simultaneously for two weeks while you decide on v3 token shape. Maya's review-Granola from last week supports this read.`
          : `The slate holds. Strategist re-reads against your 90-day pattern: today you have 2 long-write blocks scheduled. The pattern is recovering. The read on you is reading you back from yesterday's narrowed shape.`);
      const chainEl = document.getElementById("modal-chain");
      chainEl.innerHTML = `<div class="chain-event ce-divider"><span class="ce-time">overnight</span><span class="ce-event">daemon · 14 reads against the held composition</span></div>`;
      auditList.slice().reverse().forEach(row => {
        const div = document.createElement("div");
        div.className = "chain-event";
        div.innerHTML = `<span class="ce-time">${row.time}</span><span class="ce-event ${row.refused?"refused":""}">${row.event}</span>`;
        chainEl.appendChild(div);
      });
      overlay.classList.add("is-open");
      return;
    }

    if (activeProductId === "team") {
      const s = getActiveSubject();
      document.getElementById("modal-title").textContent = `${s.label}'s view · what they would see`;
      document.getElementById("modal-tag").textContent = "Subject view · peer release";
      document.getElementById("modal-label-1").textContent = `What ${s.label} would see if they requested this read`;
      const cc = CONSENT_CLASSES[s.consent_class];
      const tilesUsed = [...getSlatedSet()].map(id => {
        const tile = (TEAM_TILES_FOR_SUBJECT[s.id] ?? []).find(t => t.id === id);
        return tile?.label;
      }).filter(Boolean);
      document.getElementById("modal-content-1").innerHTML =
        `<em>From: Maia · Manager.</em> A coherence read on you was composed today. ` +
        `<strong>What was read</strong>: ${tilesUsed.length === 0 ? "no source tiles yet" : tilesUsed.map(l => `<em>${l}</em>`).join(", ")}. ` +
        `<strong>What was refused</strong>: any source above your consent class (<em>${cc?.label ?? s.consent_class}</em>). ` +
        `<strong>What it concluded</strong>: ${s.id === "devon_eng" ? "your pattern has narrowed, not broken · three open paths flagged · the manager has chosen to surface in Tuesday's 1:1" : s.id === "rafe_cofounder" ? "stated-vs-observed in alignment · log-and-watch is the default · joint vault updated" : s.id === "priya_design" ? "attendance pattern stable · no further read · this is the lightest-weight register the system has on you" : "advisor channel · 6 weekly check-ins read for advisory framing"}. ` +
        `<strong>What you can do</strong>: request the full chain (below), correct any read, or ask for the consent class to widen or narrow.`;
    } else if (activeProductId === "sam-seed") {
      const s = getActiveSubject();
      const tilesUsed = [...getSlatedSet()].map(id => {
        const tile = (SAMSEED_TILES_FOR_SUBJECT[s.id] ?? []).find(t => t.id === id);
        return tile;
      }).filter(Boolean);
      const blameUsed  = tilesUsed.filter(t => t.kind === "blame").map(t => t.label);
      const systemUsed = tilesUsed.filter(t => t.kind === "system").map(t => t.label);
      const refusedTiles = (SAMSEED_TILES_FOR_SUBJECT[s.id] ?? []).filter(t => t.kind === "content");
      document.getElementById("modal-title").textContent =
        s.id === "tariq_lead" ? `${s.label}'s view · what the read would say` : `The read · ${s.label}`;
      document.getElementById("modal-tag").textContent = "Subject view · system-not-person";
      document.getElementById("modal-label-1").textContent =
        s.id === "tariq_lead" ? `What ${s.label} would see if this read were surfaced to him` : `How the assessment reads, given what's on the slate`;
      /* the reframe, stated by which tiles are slated · not narrated:
         blame tiles → the read indicts a person · system tiles → it tunes a setup */
      const lean = systemUsed.length > blameUsed.length
        ? `<strong>This read tunes a system.</strong> The slate leans on <em>${systemUsed.join("</em>, <em>") || "the structural sources"}</em>, no shared P-tier lexicon, no decision-log, no calibration phase for a novel frontier-model output. The disposition: re-instrument the triage, not re-staff it. ${s.id === "tariq_lead" ? "Tariq isn't read as a bad lead: he's read as a 9-year operator caught in a transition the setup never supported." : ""}`
        : blameUsed.length > 0
        ? `<strong>This read still indicts a person.</strong> The slate leans on <em>${blameUsed.join("</em>, <em>")}</em>, escalations, a canceled 1:1, triangulated complaints. Read this way, the disposition lands on Tariq. <em>Add the system tiles</em> (tenure, the agentic-shift, the missing lexicon) and watch the same evidence re-read as a setup to tune.`
        : `<em>Nothing on the slate yet.</em> Drag the blame tiles and the read indicts a person; drag the system tiles and it tunes a setup. Same agents, same person. The disposition is set by which evidence you choose.`;
      document.getElementById("modal-content-1").innerHTML =
        `<em>From: Sam · Pen-test Lead.</em> ${lean} ` +
        (refusedTiles.length
          ? `<strong>Refused</strong>: <em>${refusedTiles.map(t=>t.label.replace(/ · ✗$/,"")).join(", ")}</em>: out of consent · pattern-only · no message-content reads, even on your own team.`
          : `<strong>Refused</strong>: nothing private was read · this is observability of the setup, not of the people.`);
      const chainEl = document.getElementById("modal-chain");
      chainEl.innerHTML = "";
      if (auditList.length === 0) {
        chainEl.innerHTML = `<div class="chain-event"><span class="ce-time">·</span><span class="ce-event">no events yet · drag tiles onto the slate</span></div>`;
      } else {
        auditList.slice().reverse().forEach(row => {
          const div = document.createElement("div");
          div.className = "chain-event";
          div.innerHTML = `<span class="ce-time">${row.time}</span><span class="ce-event ${row.refused?"refused":""}">${row.event}</span>`;
          chainEl.appendChild(div);
        });
      }
      overlay.classList.add("is-open");
      return;
    } else {
      const c = getActiveCase();
      document.getElementById("modal-title").textContent = `§552a(d) release · Subject-S view`;
      document.getElementById("modal-tag").textContent = "Privacy Act release · cryptographically signed";
      document.getElementById("modal-label-1").textContent = "What Subject-S would receive on request";
      const tilesUsed = [...getSlatedSet()].map(id => {
        const tile = (BUSINESS_TILES_FOR_CASE[c.id] ?? []).find(t => t.id === id);
        return tile?.label;
      }).filter(Boolean);
      document.getElementById("modal-content-1").innerHTML =
        `<em>From: ${BUSINESS_OPERATOR.unit} · ${BUSINESS_OPERATOR.label} (${BUSINESS_OPERATOR.role}, ${BUSINESS_OPERATOR.clearance}-cleared).</em> A counterintelligence read was composed against you on this date under WPA / PPD-19. ` +
        `<strong>Sources read</strong>: ${tilesUsed.length === 0 ? "no tiles released yet" : tilesUsed.map(l => `<em>${l}</em>`).join(", ")}. ` +
        `<strong>Sources withheld</strong>: any classification above ${BUSINESS_OPERATOR.clearance.toUpperCase()} · TS/SCI tiles were quarantined and not read against you. ` +
        `<strong>Disposition</strong>: 30-day intake-and-watch. Daily access-log review. Cohort baseline against n=147 cleared sysadmins. Second-analyst review queued for week 2. ` +
        `<strong>Your rights</strong>: §552a(d) · request the full chain (below), submit corrections to any record, request closure if disposition is benign. Whistleblower protections apply under PPD-19.`;
    }

    const chainEl = document.getElementById("modal-chain");
    chainEl.innerHTML = "";
    if (auditList.length === 0) {
      chainEl.innerHTML = `<div class="chain-event"><span class="ce-time">·</span><span class="ce-event">no events yet · drag tiles onto the slate</span></div>`;
    } else {
      auditList.slice().reverse().forEach(row => {
        const div = document.createElement("div");
        div.className = "chain-event";
        div.innerHTML = `<span class="ce-time">${row.time}</span><span class="ce-event ${row.refused?"refused":""}">${row.event}</span>`;
        chainEl.appendChild(div);
      });
    }
    overlay.classList.add("is-open");
  });
  wireVaultModal();
  document.getElementById("modal-close")?.addEventListener("click", () => {
    document.getElementById("modal-overlay").classList.remove("is-open");
  });
  document.getElementById("modal-overlay")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") {
      document.getElementById("modal-overlay").classList.remove("is-open");
    }
  });
}

/* ─── slate-canvas + tray-panel drop wiring ──────────────────────── */

function wireDropTargets() {
  const slateCanvas = document.getElementById("slate-canvas");
  slateCanvas.addEventListener("dragover", (ev) => {
    if (!ev.dataTransfer.types.includes("text/liminal-tile") &&
        !ev.dataTransfer.types.includes("Files") &&
        !ev.dataTransfer.types.includes("text/uri-list")) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
    slateCanvas.classList.add("is-drop-hover");
  });
  slateCanvas.addEventListener("dragleave", (ev) => {
    if (ev.target === slateCanvas) slateCanvas.classList.remove("is-drop-hover");
  });
  slateCanvas.addEventListener("drop", (ev) => {
    ev.preventDefault();
    slateCanvas.classList.remove("is-drop-hover");
    const tileId = ev.dataTransfer.getData("text/liminal-tile");
    if (tileId) {
      const tiles = getTilesForActive();
      const tile = tiles.find(t => t.id === tileId);
      if (tile) onTileClick(tile, tileIsRefused(tile), ctx);
      return;
    }
    if (ev.dataTransfer.files.length > 0 || ev.dataTransfer.types.includes("text/uri-list")) {
      const captureLabel = ev.dataTransfer.files.length > 0
        ? `Captured file · ${ev.dataTransfer.files[0].name}`
        : `Captured URL · ${ev.dataTransfer.getData("text/uri-list").split("\n")[0]}`;
      appendAudit(`drop · ${captureLabel} → slate · vault commit`);
      showToast(`Captured to vault · ${captureLabel}`);
    }
  });

  const trayPanel = document.getElementById("tray-panel");
  trayPanel.addEventListener("dragover", (ev) => {
    if (!ev.dataTransfer.types.includes("Files") &&
        !ev.dataTransfer.types.includes("text/uri-list") &&
        !ev.dataTransfer.types.includes("text/plain")) return;
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
    trayPanel.classList.add("is-drop-hover");
  });
  trayPanel.addEventListener("dragleave", (ev) => {
    if (ev.target === trayPanel) trayPanel.classList.remove("is-drop-hover");
  });
  trayPanel.addEventListener("drop", (ev) => {
    ev.preventDefault();
    trayPanel.classList.remove("is-drop-hover");
    if (ev.dataTransfer.files.length > 0 || ev.dataTransfer.types.includes("text/uri-list")) {
      const captureLabel = ev.dataTransfer.files.length > 0
        ? `Captured file · ${ev.dataTransfer.files[0].name}`
        : `Captured URL · ${ev.dataTransfer.getData("text/uri-list").split("\n")[0]}`;
      appendAudit(`capture · ${captureLabel} → tray · vault commit`);
      showToast(`Captured to vault · ${captureLabel}`);
    }
  });
}

/* ─── boot · staged reveal · canonical glow · session flag ───────── */

function boot() {
  /* initialize IndexedDB vault store · per UI_GAP_SPEC §3.2
     · category-credibility blocker · the vault must persist across reload
     · runs in background; failure is silent (in-memory fallback in setContext) */
  import("./vault-store.js").then(vs => vs.init()).catch(() => { /* fallback */ });

  /* product tab clicks · single source · CSS toggles via .is-active */
  document.querySelectorAll(".product-tab").forEach(el => {
    el.addEventListener("click", () => setProduct(el.dataset.product));
  });

  /* tray pill toggle */
  document.getElementById("tray-pill")?.addEventListener("click", toggleTray);

  /* keyboard · pass ctx so the layer can call our setProduct/setContext */
  wireKeyboard(ctx);

  /* marginalia toggle button + resize re-render · marginalia.js */
  wireMarginaliaToggle();

  /* disposition + handoff buttons */
  wireDisposition(ctx);

  /* preview subject modal */
  wirePreviewSubject();

  /* drop targets · slate + tray */
  wireDropTargets();

  /* version pin already wired via _devMode block above */

  /* staged boot moment · once per session · honors prefers-reduced-motion
     · ?reset clears flags so the demo replays
     · ?skip-entry / ?skip-boot bypass entry overlay / staged boot
       (useful for headless screenshots, deep-linking, demo recording) */
  if (/[?&]reset\b/.test(location.search)) {
    sessionStorage.removeItem("liminal-booted");
    sessionStorage.removeItem("liminal-entered");
  }
  /* ?scenario=<key> · deep link straight to one (product, context) pair, past
     the entry overlay. Same loop, a parameter of this surface (TAXONOMY rule 5),
     not a new cut. Unknown keys fall through to the default boot unchanged. */
  const SCENARIO_ROUTES = {
    "hugging-face-2026": ["personal", "hugging_face_2026"],
  };
  /* own keys only: a plain-object lookup would hand back Object.prototype
     members for ?scenario=__proto__ / constructor / toString */
  const _scenarioKey = new URLSearchParams(location.search).get("scenario") || "";
  const _scenario = Object.hasOwn(SCENARIO_ROUTES, _scenarioKey) ? SCENARIO_ROUTES[_scenarioKey] : null;
  const _skipEntry = /[?&]skip-entry\b/.test(location.search) || !!_scenario;
  const _skipBoot  = /[?&]skip-boot\b/.test(location.search);
  const _hasBooted = sessionStorage.getItem("liminal-booted") === "1" || _skipBoot;
  const _hasEntered = sessionStorage.getItem("liminal-entered") === "1" || _skipEntry;
  const _reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const _stageBoot = !_hasBooted && !_reduceMotion;
  const _showEntry = !_hasEntered && !_reduceMotion;

  if (_stageBoot) document.body.dataset.boot = "staged";

  /* three-doors entry overlay · per UI_GAP_SPEC §2.4 · before first product set
     · routes to (surface, context) · sessionStorage flag prevents replay
     · ?reset clears both the entered flag and the booted flag */
  if (_showEntry) {
    const overlay = document.getElementById("entry-overlay");
    if (overlay) {
      overlay.hidden = false;
      const dismissAndRoute = (productId, contextId) => {
        sessionStorage.setItem("liminal-entered", "1");
        overlay.hidden = true;
        setProduct(productId);
        if (contextId && contextId !== activeContextId) setContext(contextId);
        markCanonical();
      };
      overlay.querySelectorAll(".entry-door").forEach(btn => {
        btn.addEventListener("click", () => {
          dismissAndRoute(btn.dataset.product, btn.dataset.context);
        });
      });
      document.getElementById("entry-skip")?.addEventListener("click", () => {
        /* skip-link defaults to Personal: Founder OS wedge surface (per Apr 28 demo-ready audit) */
        dismissAndRoute("personal", null);
      });
      /* still set the default product underneath so dismissing leaves a coherent surface */
    }
  }

  setProduct(_scenario ? _scenario[0] : "personal");
  if (_scenario && _scenario[1] && _scenario[1] !== activeContextId) setContext(_scenario[1]);

  /* mark the canonical row in the left rail · per surface */
  function markCanonical() {
    let canonicalId;
    if (activeProductId === "personal") {
      canonicalId = (PERSONAL_THREADS.find(t => t.canonical) ?? PERSONAL_THREADS[0])?.id;
    } else if (activeProductId === "team") {
      canonicalId = "brian_eng";
    } else if (activeProductId === "sam-seed") {
      canonicalId = "assessment_triage";
    } else {
      canonicalId = "ci_analyst_insider_threat";
    }
    document.querySelectorAll(".subject-item, .case-item").forEach(el => {
      el.classList.toggle("is-canonical", _stageBoot && el.dataset.id === canonicalId);
    });
  }
  markCanonical();

  function openTrayForDemo() {
    document.querySelector(".stage").classList.add("tray-open");
    document.getElementById("tray-panel").setAttribute("aria-hidden", "false");
  }

  if (_stageBoot) {
    setTimeout(() => {
      openTrayForDemo();
      document.body.removeAttribute("data-boot");
      document.querySelectorAll(".subject-item.is-canonical, .case-item.is-canonical")
        .forEach(el => el.classList.remove("is-canonical"));
      sessionStorage.setItem("liminal-booted", "1");
    }, 1500);
  } else {
    openTrayForDemo();
  }
}

boot();
