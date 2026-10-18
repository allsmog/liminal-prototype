/* judgment.js · acceptance & correction · the state and the record (LIM-2273)
 * ────────────────────────────────────────────────────────────────────
 * One AI result, one accountable human, one record that keeps them apart.
 *
 * This module is the non-visual half of cuts/13-judgment.html and the
 * re-entry card in cuts/10-today.html. It owns:
 *
 *   · FIXTURE      · the deterministic AI result awaiting judgment. Lifted
 *                    from cut 11's spend case gc-2026-06-A (finding F-CAL,
 *                    E12/E13 at $90 each, E14 dropped by the adversarial
 *                    reviewer via PR-103). Same figures, same persona-free
 *                    framing; nothing here is new product data.
 *   · STATES       · proposed → operator-confirmed → recorded. "AI completed"
 *                    is `proposed`; it never becomes `accepted` by itself.
 *   · buildRecord  · pure: (fixture, judgment, actor, time) → the record.
 *                    The original AI contribution is copied in verbatim and
 *                    is never mutated by a correction.
 *   · hashRecord   · SHA-256 of the record as stored, computed in the
 *                    browser. A content hash is NOT a signature: it proves
 *                    the bytes have not changed since it was computed, and
 *                    nothing about who computed them. Labelled that way
 *                    wherever it is shown.
 *   · persistence  · thin wrappers over lib/vault-store.js (the repo's
 *                    existing device-local IndexedDB store). surface =
 *                    "judgment". Corrections also land in the corrections
 *                    store with a canon tag, so cut 03's calibration view
 *                    and any later rule-proposal work can read them.
 *
 *   · proof        · recordJudgment stores, beside the record, the signed
 *                    packet lib/judgment-proof.js built for it (or the
 *                    honest unsigned one). Signing lives there, not here.
 *
 * What this module does NOT do, on purpose:
 *   · no signing of its own, no anchoring, no chain · the record says so
 *   · no rule activation · repeated corrections are counted and shown as
 *     evidence for a possible proposal, never acted on
 *   · no actor fabrication · the human is "the operator at this device";
 *     the prototype has no sign-in and the record says so
 *   · no DOM
 */
import * as vault from "./vault-store.js";
import { CORRECTION_TAGS, CORRECTION_TAG_LABELS, CORRECTION_TAG_DESCRIPTIONS, isValidTag } from "./correction-tags.js";

export { CORRECTION_TAGS, CORRECTION_TAG_LABELS, CORRECTION_TAG_DESCRIPTIONS };

export const SURFACE = "judgment";
export const SCHEMA = 1;

/* ─── lifecycle states ───────────────────────────────────────────── */
export const STATES = Object.freeze({
  PROPOSED: "proposed",            // AI produced it · no human has judged it
  CONFIRMED: "operator-confirmed", // the operator pressed confirm · not yet stored
  RECORDED: "recorded",            // stored in the device-local vault
});

export const DISPOSITIONS = Object.freeze(["accept", "correct", "reject", "defer"]);

export const DISPOSITION_LABELS = Object.freeze({
  accept: "Accepted",
  correct: "Corrected",
  reject: "Rejected",
  defer: "Deferred",
});

/* ─── the fixture · one AI result awaiting judgment ──────────────── */
export const FIXTURE = Object.freeze({
  caseId: "gc-2026-06-A",
  findingId: "F-CAL",
  subject: "AI spend · Opus cohort · 2026-06",
  lane: "calendar_admin",
  producer: {
    kind: "agent",
    name: "Judgment register",
    detail: "bounded agent · spend subject · recorded fixture run",
    producedAt: "2026-06-30T09:22:00Z",
  },
  headline: "Route calendar administration away from Opus 4.8 to the CalendarOps agent.",
  /* every assertion names the evidence it leans on and how firmly */
  assertions: [
    {
      id: "A1",
      text: "Two June runs put Opus 4.8 on calendar administration: E12 (Elif, 06-03, $90) and E13 (Bianca, 06-06, $90), $180 in total.",
      evidence: ["ev-usage"],
      support: "supported",
      supportNote: "both events are in the usage export with these costs",
    },
    {
      id: "A2",
      text: "Both runs are routine administration, not product work.",
      evidence: ["ev-usage", "ev-tickets"],
      support: "thin",
      supportNote: "inferred from the task titles alone · no ticket or PR is linked to E12 or E13",
    },
    {
      id: "A3",
      text: "CalendarOps is registry-verified for the calendar lane at roughly 10% of Opus cost.",
      evidence: ["ev-registry"],
      support: "supported",
      supportNote: "verification is in the registry · the cost figure is the registry entry's own description, not an invoice",
    },
    {
      id: "A4",
      text: "Routing the lane to CalendarOps saves about $162 per month.",
      evidence: [],
      support: "derived",
      supportNote: "90% of $180 · depends on A1, A2 and A3 all holding",
      dependsOn: ["A1", "A2", "A3"],
    },
    {
      id: "A5",
      text: "E14 (Mara, 06-04, $180, “calendar-sync feature”) is excluded from this result.",
      evidence: ["ev-pr"],
      support: "agent-corrected",
      supportNote: "the adversarial reviewer (an agent) dropped it before this result reached you: PR-103 shows shipped product work",
      agentAction: {
        actor: "Adversarial reviewer",
        kind: "agent",
        what: "dropped E14 from the naive $486 claim",
        at: "2026-06-30T09:16:00Z",
      },
    },
  ],
  evidence: [
    {
      id: "ev-usage",
      kind: "usage events",
      title: "Usage events · E12 · E13 · E14",
      source: "usage export · 2026-06",
      bearing: "supports A1 · is the only basis for A2",
      rows: [
        ["E12", "2026-06-03", "Elif", "Schedule team offsite + calendar wrangling", "$90", "calendar_admin"],
        ["E13", "2026-06-06", "Bianca", "Reformat meeting notes + send calendar invites", "$90", "calendar_admin"],
        ["E14", "2026-06-04", "Mara", "calendar-sync feature: Google Calendar API + UI", "$180", "calendar_admin → product (reclassified)"],
      ],
      columns: ["event", "date", "who", "task (as logged)", "cost", "category (agent's label)"],
      note: "The category column is the agent's label, not a field in the export.",
    },
    {
      id: "ev-pr",
      kind: "pull request",
      title: "PR-103 · Mara · calendar-sync feature",
      source: "repository · linked to E14",
      bearing: "challenges the naive claim · supports A5",
      body: "“calendar-sync feature: Google Calendar API + UI” · workstream = product · merged 2026-06-05. This is the evidence the adversarial reviewer used to drop E14. It says nothing about E12 or E13.",
    },
    {
      id: "ev-registry",
      kind: "agent registry",
      title: "CalendarOps Agent · registry entry",
      source: "agent registry · internal platform",
      bearing: "supports A3",
      body: "registry-verified · scope: calendar management, scheduling · cost note: “~10% of Opus” (written by the registry entry) · no invoice attached.",
    },
    {
      id: "ev-okr",
      kind: "baseline",
      title: "OKR baseline · 60% product / 40% security",
      source: "composition · slate",
      bearing: "context only · no bearing on A2",
      body: "O1 product 0.6 · O2 security 0.4. Explains why calendar work is out of frame; does not say which runs were calendar work.",
    },
    {
      id: "ev-tickets",
      kind: "absent",
      title: "Tickets for E12 and E13",
      source: "not in the composition",
      bearing: "the gap under A2",
      body: "Nothing on the slate links E12 or E13 to a ticket, PR or calendar entry. The agent read the task titles and labelled the lane. If you know what these runs were, that knowledge is not in the evidence.",
    },
  ],
  uncertainty: [
    "E12 and E13 are categorised from task titles alone.",
    "The ~10% cost figure is the registry entry's self-description.",
    "The saving is a projection; no routing has run yet.",
  ],
  /* earlier corrections on this subject + tag, carried as fixture so the
     "repeated correction" state can be shown without inventing history */
  priorCorrections: [
    { tag: "assumes_facts_not_in_evidence", lane: "calendar_admin", when: "2026-05-30", note: "fixture · May review · E07 labelled admin was a launch checklist" },
  ],
  rulePatternThreshold: 3,
});

/* ─── helpers ────────────────────────────────────────────────────── */
export function assertionById(id, fixture = FIXTURE) {
  return fixture.assertions.find(a => a.id === id) || null;
}
export function evidenceById(id, fixture = FIXTURE) {
  return fixture.evidence.find(e => e.id === id) || null;
}

/* defer windows · the operator picks one; nothing fires, Today shows it */
export const DEFER_WINDOWS = Object.freeze([
  { id: "2d", label: "2 days", days: 2 },
  { id: "7d", label: "7 days", days: 7 },
  { id: "next-review", label: "next monthly review", days: 30 },
]);

/**
 * Validate a judgment before it can be confirmed. Returns [] when valid,
 * else a list of human-readable problems. Pure.
 * @param {Object} j  { disposition, assertionId?, correctedText?, tag?, rationale?, deferWindow? }
 */
export function validateJudgment(j, fixture = FIXTURE) {
  const problems = [];
  if (!DISPOSITIONS.includes(j?.disposition)) problems.push("Choose accept, correct, reject or defer.");
  if (j?.disposition === "correct") {
    const a = assertionById(j.assertionId, fixture);
    if (!a) problems.push("Select the assertion you dispute.");
    const txt = (j.correctedText || "").trim();
    if (!txt) problems.push("Write the corrected assertion.");
    else if (a && txt === a.text.trim()) problems.push("The correction is identical to the original.");
    if (j.tag != null && !isValidTag(j.tag)) problems.push("Unknown correction tag.");
  }
  if (j?.disposition === "reject" && !(j.rationale || "").trim()) problems.push("Say why the result is rejected.");
  if (j?.disposition === "defer" && !DEFER_WINDOWS.some(w => w.id === j.deferWindow)) problems.push("Pick when this should come back.");
  return problems;
}

/**
 * Build the record. Pure. `original` is copied verbatim from the fixture
 * and is the same object shape whatever the disposition, so "what did AI
 * contribute" always reads identically.
 */
export function buildRecord({ fixture = FIXTURE, judgment, inspected = [], actor, confirmedAt }) {
  const problems = validateJudgment(judgment, fixture);
  if (problems.length) throw new Error("buildRecord: " + problems.join(" "));

  const original = {
    producer: { ...fixture.producer },
    headline: fixture.headline,
    assertions: fixture.assertions.map(a => ({ id: a.id, text: a.text, support: a.support })),
    caseId: fixture.caseId,
    findingId: fixture.findingId,
  };

  const inspectedSet = new Set(inspected);
  const evidence = fixture.evidence.map(e => ({ id: e.id, title: e.title, inspected: inspectedSet.has(e.id) }));

  let change = null;
  if (judgment.disposition === "correct") {
    const a = assertionById(judgment.assertionId, fixture);
    change = {
      assertionId: a.id,
      originalText: a.text,
      correctedText: judgment.correctedText.trim(),
      tag: judgment.tag ?? null,
      rationale: (judgment.rationale || "").trim() || null,
      /* assertions whose support depended on the corrected one */
      affects: fixture.assertions.filter(x => (x.dependsOn || []).includes(a.id)).map(x => x.id),
    };
  }

  let defer = null;
  if (judgment.disposition === "defer") {
    const w = DEFER_WINDOWS.find(x => x.id === judgment.deferWindow);
    defer = { window: w.id, label: w.label, dueAt: new Date(confirmedAt + w.days * 86400000).toISOString() };
  }

  const remaining = [...fixture.uncertainty];
  if (change && change.affects.length) {
    remaining.push(`${change.affects.join(", ")} ${change.affects.length > 1 ? "were" : "was"} derived from the original ${change.assertionId} and ${change.affects.length > 1 ? "have" : "has"} not been recomputed.`);
  }
  if (judgment.disposition === "accept" && inspectedSet.size === 0) {
    remaining.push("No evidence was opened before acceptance.");
  }

  return {
    schema: SCHEMA,
    surface: SURFACE,
    caseId: fixture.caseId,
    findingId: fixture.findingId,
    subject: fixture.subject,
    lane: fixture.lane,
    state: STATES.CONFIRMED,
    disposition: judgment.disposition,
    dispositionLabel: DISPOSITION_LABELS[judgment.disposition],
    actor: { ...actor },
    confirmedAt: new Date(confirmedAt).toISOString(),
    recordedAt: null,
    original,
    evidence,
    change,
    rationale: (judgment.rationale || "").trim() || null,
    defer,
    agentActions: fixture.assertions.filter(a => a.agentAction).map(a => ({ ...a.agentAction, assertionId: a.id })),
    remainingUncertainty: remaining,
    preservation: {
      store: "device-local IndexedDB (liminal-vault · decisions)",
      signed: false,
      anchored: false,
      propagated: false,
      ruleActivated: false,
    },
  };
}

/* the human actor this prototype can truthfully name */
export const OPERATOR = Object.freeze({
  kind: "human",
  name: "Operator at this device",
  identity: "unverified · this prototype has no sign-in",
});

/* ─── hashing · content hash, not a signature ────────────────────── */
function stableStringify(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") + "}";
}
export async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(typeof value === "string" ? value : stableStringify(value));
  if (!globalThis.crypto?.subtle) return null;
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export function shortHash(hex) { return hex ? hex.slice(0, 8) + "…" + hex.slice(-4) : "unavailable"; }

/* ─── persistence · lib/vault-store.js ───────────────────────────── */
export function vaultAvailable() { return vault.isAvailable(); }

/**
 * Store a confirmed record. Returns { id, record } with state=recorded and
 * recordedAt set, or throws if the vault is unavailable. `proof` is the
 * packet + signature from lib/judgment-proof.js; it is stored as built and
 * never re-signed on reopen.
 *
 * The decision row IS the record. The corrections row written after it is a
 * secondary index for cut 03 and the pattern watch, so once the decision is
 * stored this never throws: a failed index write comes back as
 * `indexError` instead. Throwing there would tell the page "nothing is
 * stored" about a record that is stored, and a retry would store it twice.
 */
export async function recordJudgment(record, { proof = null } = {}) {
  if (!vault.isAvailable()) throw new Error("vault unavailable");
  const ok = await vault.init();
  if (!ok) throw new Error("vault failed to open");
  const stored = { ...record, state: STATES.RECORDED, recordedAt: new Date().toISOString(), proof };
  stored.preservation = { ...record.preservation, signed: !!proof?.signed };
  stored.originalHash = await sha256Hex(stored.original);
  /* hashed before the key exists, so anyone can recompute it from the stored
     row minus contentHash with the same canonical JSON */
  stored.contentHash = await sha256Hex(stored);
  const id = await vault.appendDecision({
    surface: SURFACE,
    kind: record.disposition,
    hash: stored.contentHash,
    payload: stored,
  });
  let indexError = null;
  if (record.change) {
    try {
      await vault.appendCorrection({
        surface: SURFACE,
        agent: record.original.producer.name,
        tag: record.change.tag,
        note: record.change.rationale,
        scenario: record.caseId,
        context: { decisionId: id, assertionId: record.change.assertionId, lane: record.lane },
      });
    } catch (err) {
      indexError = String(err?.message || err);
    }
  }
  return { id, record: stored, indexError };
}

/** Read one stored record by its vault id. Returns { id, record, ts } or null. */
export async function loadJudgment(id) {
  if (!vault.isAvailable()) return null;
  const rows = await vault.readDecisions({ surface: SURFACE });
  const row = rows.find(r => r.id === Number(id));
  return row ? { id: row.id, ts: row.ts, record: row.payload } : null;
}

/** The most recent stored record, or null. */
export async function latestJudgment() {
  if (!vault.isAvailable()) return null;
  const rows = await vault.readDecisions({ surface: SURFACE, limit: 1 });
  return rows[0] ? { id: rows[0].id, ts: rows[0].ts, record: rows[0].payload } : null;
}

/** All stored judgment records, newest first. */
export async function allJudgments() {
  if (!vault.isAvailable()) return [];
  const rows = await vault.readDecisions({ surface: SURFACE });
  return rows.map(r => ({ id: r.id, ts: r.ts, record: r.payload }));
}

/**
 * Repeated-correction evidence: how many corrections with this tag on this
 * lane exist, fixture priors included, split by provenance. Evidence for a
 * possible proposal; never acts.
 */
export async function correctionPattern({ tag, lane, fixture = FIXTURE }) {
  if (tag == null) return null; /* untagged: nothing to group by */
  const prior = fixture.priorCorrections.filter(p => p.tag === tag && p.lane === lane).length;
  let device = 0;
  if (vault.isAvailable()) {
    try {
      const rows = await vault.read({ surface: SURFACE });
      device = rows.filter(r => r.tag === tag && r.context?.lane === lane).length;
    } catch { /* unavailable mid-session · count what we have */ }
  }
  return { tag, lane, prior, device, total: prior + device, threshold: fixture.rulePatternThreshold };
}

/* ─── formatting ─────────────────────────────────────────────────── */
export function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
export function fmtAgo(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
export function fmtDue(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const d = Math.round((t - now) / 86400000);
  if (d <= 0) return "due now";
  return `due in ${d} day${d === 1 ? "" : "s"}`;
}
