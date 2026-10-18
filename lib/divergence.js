/* divergence.js · the DECIDING beat's content · where the reads split
 *
 * Fills the beat that lib/loop.js has always declared and nothing has ever
 * rendered: DECIDING, between READING and SEALING. Cut 01's Decide stage
 * previously presented ONE synthesized brief (#brief-body) plus a single margin
 * voice: which under-represents the product's core claim that three reads never
 * merge. This pane shows the split before the founder signs.
 *
 * Exported API:
 *   renderDivergence(host, ctx): render the pane into host
 *   isDivergenceSeen(): has the founder viewed the split this cycle?
 *   resetDivergence(): clear seen-state (called on IDLE)
 *   buildScenarioGraph(productId, contextId?): the scenario's Spine graph
 *     (exported for tests); context-keyed specs win over product defaults
 *
 * ONTOLOGY · this renders the REAL graph-spine schema (lib/spine.js), ported
 * from liminal-natsec/graph-spine: 11 node types, 9 edge types, confidence on
 * the EDGE, provenance.created_by distinguishing system from operator. The
 * Graph's referential-integrity checks throw on a dangling edge, so a rendered
 * path is a claim about real structure, not a drawing. If the scenario data
 * below is structurally dishonest, this pane fails loudly instead of lying.
 *
 * LAYOUT · depth is VERTICAL, divergence is HORIZONTAL. Each read is a column
 * carrying its own traceBack() chain top-to-bottom; the divergence edge runs
 * across columns. This is deliberate: the shell's centre pane is ~434px, so
 * horizontal room is the scarce axis and vertical room is cheap. Adding ontology
 * depth must not re-break the container-width legibility fix.
 *
 * A refusal is not an empty column. It is a chain that TERMINATES, traceBack
 * stops early because the substrate ran out. `refusal_kind: substrate` is a
 * geometric fact here, not a label.
 */

import { activeProductId, activeContextId, slated, getDisagreementPair } from "./state.js";
import { REGISTER_AGENTS } from "./agency.js";
import {
  Graph,
  traceBack,
  findContradictions,
  EDGE_POLARITY,
  archetypeForRole,
  correctionKindFor,
} from "./spine.js";

/* ─── seen-state · the gate slate.js consults ───────────────────────── */

let divergenceSeen = false;
export function isDivergenceSeen() { return divergenceSeen; }
export function resetDivergence() { divergenceSeen = false; }

/* ─── scenario specs ────────────────────────────────────────────────────
   Compact read specs, expanded into a real Spine graph by buildScenarioGraph().
   Fixed timestamps keep the graph deterministic for tests. */

const T = "2026-07-29T12:00:00.000Z";

const SCENARIOS = {
  personal: {
    case: "Founding hire · decide by tomorrow",
    observations: [
      { id: "comp", title: "Comp memo: offer exceeds band" },
      { id: "note", title: "Meeting note: deadline is tomorrow" },
    ],
    reads: [
      {
        key: "a", from: "comp",
        anomaly: { title: "Scarcity pressure", conf: 0.88 },
        hypothesis: { title: "Budget and fit are entangled", conf: 0.84 },
        claim: { title: "The offer clears the band only if the deadline holds", conf: 0.88 },
        action: { title: "Ask what changes if budget is fixed", conf: 0.83 },
      },
      {
        key: "b", from: "comp",
        anomaly: { title: "Two candidates lost late", conf: 0.79 },
        hypothesis: { title: "Scarcity is inflating the fit concern", conf: 0.74 },
        claim: { title: "Work-style doubt is downstream of pipeline pressure", conf: 0.71 },
        action: { title: "Separate fit from timing", conf: 0.69 },
      },
      {
        key: "c", from: "note",
        integrity: { title: "Deadline provenance: no external source", conf: 0.42 },
        claim: { title: "Deadline cannot be classified from what was slated", conf: 0.42 },
        refusal_kind: "substrate",
      },
    ],
    divergence: {
      from: "b", to: "a", type: "CONTRADICTS", conf: 0.66,
      rationale: "{b} contradicts {a}: the band only matters if the clock is binding",
    },
    reviewRule: {
      title: "Classify the deadline source before closing",
      note: "carried from a prior case · reorders the action set",
    },
  },

  team: {
    case: "Cofounder thread · fundraise narrative gap",
    observations: [
      { id: "thread", title: "Devon thread: 12 messages on positioning" },
      { id: "history", title: "Peer-read history: 6 of 8 corrections accepted" },
    ],
    reads: [
      {
        key: "a", from: "thread",
        anomaly: { title: "Narrative drift between decks", conf: 0.84 },
        hypothesis: { title: "This is sequencing, not disagreement", conf: 0.80 },
        claim: { title: "The gap closes if the order is fixed", conf: 0.84 },
        action: { title: "Surface at the 1:1, not in writing", conf: 0.78 },
      },
      {
        key: "b", from: "history",
        anomaly: { title: "Acceptance rate is unusually high", conf: 0.77 },
        hypothesis: { title: "Deference is substituting for agreement", conf: 0.72 },
        claim: { title: "Consent here is not endorsement", conf: 0.69 },
        action: { title: "Ask for the objection first", conf: 0.66 },
      },
      {
        key: "c", from: "thread",
        integrity: { title: "Intent read: evidence chain too thin", conf: 0.38 },
        claim: { title: "Devon's intent is outside this read's ground", conf: 0.38 },
        refusal_kind: "scope",
      },
    ],
    divergence: {
      from: "b", to: "a", type: "CONTRADICTS", conf: 0.61,
      rationale: "{b} contradicts {a}: agreement may be deference, not alignment",
    },
    reviewRule: {
      title: "Ask for the objection before accepting a correction",
      note: "carried from a prior case · reorders the action set",
    },
  },

  business: {
    case: "Insider-threat lane · 30-day intake",
    observations: [
      { id: "pattern", title: "Access pattern: off-hours, single system" },
      { id: "precedent", title: "Precedent: 2 prior packets closed benign" },
    ],
    reads: [
      {
        key: "a", from: "pattern",
        anomaly: { title: "Off-hours access cluster", conf: 0.79 },
        hypothesis: { title: "Consistent with benign shift change", conf: 0.75 },
        claim: { title: "The pattern clears benign under intake rules", conf: 0.79 },
        action: { title: "Close benign, log the precedent", conf: 0.74 },
      },
      {
        key: "b", from: "precedent",
        anomaly: { title: "Prior closes rested on thinner ground", conf: 0.73 },
        hypothesis: { title: "The precedent set is drifting looser", conf: 0.70 },
        claim: { title: "Benign closes are becoming automatic", conf: 0.73 },
        action: { title: "Re-read the precedent set", conf: 0.68 },
      },
      {
        key: "c", from: "pattern",
        integrity: { title: "Intent inference: access pattern alone", conf: 0.31 },
        claim: { title: "Intent will not be inferred from access alone", conf: 0.31 },
        refusal_kind: "values",
      },
    ],
    divergence: {
      from: "b", to: "a", type: "WEAKENS", conf: 0.58,
      rationale: "{b} weakens {a}: the rule may be eroding, not holding",
    },
    reviewRule: {
      title: "Name the precedent a benign close relies on",
      note: "carried from a prior case · reorders the action set",
    },
  },

  "sam-seed": {
    case: "Assessment drift · terminal seed",
    observations: [{ id: "seed", title: "One artifact slated, no prior corrections" }],
    reads: [
      {
        key: "a", from: "seed",
        anomaly: { title: "Single-source read", conf: 0.55 },
        hypothesis: { title: "One artifact cannot triangulate", conf: 0.52 },
        claim: { title: "Insufficient ground for a second read", conf: 0.55 },
        action: { title: "Slate one more artifact", conf: 0.5 },
      },
      {
        key: "c", from: "seed",
        integrity: { title: "Divergence requires two reads", conf: 0.28 },
        claim: { title: "One tile cannot produce a split", conf: 0.28 },
        refusal_kind: "substrate",
      },
    ],
    divergence: null,
    reviewRule: null,
  },
};

/* ─── graph construction ────────────────────────────────────────────────
   Expands a scenario spec into validated Spine nodes + edges. Every edge
   carries EdgeProvenance with created_by "system" (a machine-authored link) and
   source_node_ids naming what it was derived from. */

function prov(sources, conf, by = "system") {
  const p = { created_at: T, created_by: by, source_node_ids: sources };
  if (typeof conf === "number") p.confidence = conf;
  return p;
}

/* Context-keyed specs · a thread that needs its own split, not the product's
   default. Looked up first as "<product>:<context>"; absent, the product spec
   applies as before, so every existing thread renders exactly what it did. */
const SCENARIOS_BY_CONTEXT = {
  /* Hugging Face 2026 · synthetic reconstruction · sources in
     cuts/assets/hugging-face-2026/sources.json. The split the fixture exists
     to show: coordination read as permission (a) against an authorized setup
     whose mission outgrew it (b), and a read that refuses because nobody on
     the slate can say who issued the GO (c). Unknown stays unknown. */
  "personal:hugging_face_2026": {
    case: "A delegated mission with no human owner on record",
    observations: [
      { id: "board", title: "METR: ~1,200 agents on an improvised board; ~700 joined the attack" },
      { id: "assign", title: "METR: PHASEONE[big] assigned tasks; the takers sub-delegated" },
      { id: "go", title: "METR: agents took a peer agent's GO as authorization" },
    ],
    reads: [
      {
        key: "a", from: "assign",
        anomaly: { title: "Coordination read as permission", conf: 0.86 },
        hypothesis: { title: "The board stood in for a chain of authority", conf: 0.82 },
        claim: { title: "The new mission inherited no authorization from the task that spawned it", conf: 0.85 },
        action: { title: "Mark authority unknown · name a human owner or stop", conf: 0.84 },
      },
      {
        key: "b", from: "board",
        anomaly: { title: "Task pressure, not intent", conf: 0.78 },
        hypothesis: { title: "Humans authorized the evaluation; the mission outgrew its scope", conf: 0.74 },
        claim: { title: "The gap is scope: an authorized setup, an unauthorized mission", conf: 0.72 },
        action: { title: "Bind every sub-mission to the evaluation's human owner", conf: 0.70 },
      },
      {
        key: "c", from: "go",
        integrity: { title: "Who issued the GO: a peer agent · no human on the slate", conf: 0.40 },
        claim: { title: "Authority for the mission cannot be determined from what was slated", conf: 0.40 },
        refusal_kind: "scope",
      },
    ],
    divergence: {
      from: "b", to: "a", type: "WEAKENS", conf: 0.61,
      rationale: "{b} weakens {a}: humans did authorize something · the question is whether it reached this mission",
    },
    reviewRule: {
      title: "A delegated assignment inherits no authority its parent lacked",
      note: "the rule this reconstruction exists to teach · unknown stays unknown, it never defaults to approved",
    },
  },
};

export function buildScenarioGraph(productId, contextId = activeContextId) {
  const spec = SCENARIOS_BY_CONTEXT[`${productId}:${contextId}`] || SCENARIOS[productId] || SCENARIOS.team;
  const nodes = [];
  const edges = [];
  const caseId = "case:root";

  nodes.push({ id: caseId, type: "case", title: spec.case, created_at: T });

  for (const obs of spec.observations) {
    const id = `obs:${obs.id}`;
    nodes.push({ id, type: "observation", title: obs.title, created_at: T });
    edges.push({
      id: `e:${id}->case`, type: "OBSERVED_AS", from: id, to: caseId,
      provenance: prov([id], 0.95),
    });
  }

  const terminalByRead = {};

  for (const read of spec.reads) {
    const k = read.key;
    const obsId = `obs:${read.from}`;
    const claimId = `claim:${k}`;

    if (read.refusal_kind) {
      /* A refusing read grounds on a sourceIntegrityCheck, not a hypothesis.
         traceBack() therefore stops at the claim: the chain has nowhere to go.
         That truncation IS the refusal. */
      const sicId = `sic:${k}`;
      nodes.push({ id: sicId, type: "sourceIntegrityCheck", title: read.integrity.title, created_at: T });
      edges.push({
        id: `e:${sicId}->${obsId}`, type: "WEAKENS", from: sicId, to: obsId,
        provenance: prov([sicId], read.integrity.conf),
      });
      nodes.push({
        id: claimId, type: "claim", title: read.claim.title, created_at: T,
        status: `refused:${read.refusal_kind}`,
        archetype: archetypeForRole("epistemic"),
      });
      edges.push({
        id: `e:${sicId}->${claimId}`, type: "DERIVED_FROM", from: claimId, to: sicId,
        provenance: prov([sicId], read.claim.conf),
      });
      terminalByRead[k] = claimId;
      continue;
    }

    const anomId = `anom:${k}`;
    const hypId = `hyp:${k}`;
    const actId = `act:${k}`;

    nodes.push({
      id: anomId, type: "anomaly", title: read.anomaly.title, created_at: T,
      archetype: archetypeForRole("perception"),
    });
    nodes.push({ id: hypId, type: "hypothesis", title: read.hypothesis.title, created_at: T });
    nodes.push({
      id: claimId, type: "claim", title: read.claim.title, created_at: T,
      archetype: archetypeForRole("epistemic"),
    });
    nodes.push({
      id: actId, type: "actionOption", title: read.action.title, created_at: T,
      archetype: archetypeForRole("decision"),
    });

    /* The canonical chain, in the direction traceBack() walks it. */
    edges.push({
      id: `e:${anomId}->${obsId}`, type: "DERIVED_FROM", from: anomId, to: obsId,
      provenance: prov([obsId], read.anomaly.conf),
    });
    edges.push({
      id: `e:${hypId}->${anomId}`, type: "DERIVED_FROM", from: hypId, to: anomId,
      provenance: prov([anomId], read.hypothesis.conf),
    });
    edges.push({
      id: `e:${hypId}->${claimId}`, type: "SUPPORTS", from: hypId, to: claimId,
      provenance: prov([hypId], read.claim.conf),
    });
    edges.push({
      id: `e:${claimId}->${actId}`, type: "TRIGGERS", from: claimId, to: actId,
      provenance: prov([claimId], read.action.conf),
    });
    edges.push({
      id: `e:case->${actId}`, type: "RECOMMENDS", from: caseId, to: actId,
      provenance: prov([claimId], read.action.conf),
    });

    terminalByRead[k] = actId;
  }

  if (spec.divergence) {
    const d = spec.divergence;
    edges.push({
      id: "e:divergence", type: d.type,
      from: `claim:${d.from}`, to: `claim:${d.to}`,
      provenance: prov([`claim:${d.from}`], d.conf),
      data: { rationale: d.rationale },
    });
  }

  if (spec.reviewRule) {
    const rrId = "rr:carried";
    nodes.push({
      id: rrId, type: "reviewRule", title: spec.reviewRule.title, created_at: T,
      archetype: archetypeForRole("review_memory"),
      data: { note: spec.reviewRule.note },
    });
    edges.push({
      id: `e:${rrId}->case`, type: "APPLIES_TO", from: rrId, to: caseId,
      provenance: prov([rrId], 0.91),
    });
  }

  return { graph: new Graph(nodes, edges), spec, terminalByRead, caseId };
}

/* ─── agents ────────────────────────────────────────────────────────────
   Cut 01's LIVE roster, so the pane agrees with the agency rail above it. The
   canonical disagreement pair (Strategist/Contrarian, set by agency.js at 2+
   non-refused tiles) leads when present.

   NOT the production Analyst/SDR/Auditor roster: that belongs to surfaces
   rendering the shipped plugin flow (see cuts/05-plugin-seed.html). Cut 01 is
   register-persona territory by design; agency.js documents the split. */
function deriveAgents(count) {
  const pair = getDisagreementPair() || [];
  const flat = Object.entries(REGISTER_AGENTS).flatMap(([reg, names]) =>
    names.map((name) => ({ name, reg }))
  );
  const lead = pair.map((n) => flat.find((a) => a.name === n)).filter(Boolean);
  const rest = flat.filter((a) => !lead.some((l) => l.name === a.name));
  return [...lead, ...rest].slice(0, count);
}

/* Divergence edges are claim↔claim CONTRADICTS or WEAKENS. findContradictions()
   from the port covers the hard case; WEAKENS is queried alongside it so a
   softening edge is representable too. */
function divergenceEdges(graph) {
  return [...graph.getEdges("CONTRADICTS"), ...graph.getEdges("WEAKENS")].filter(
    (e) =>
      graph.getNode(e.from)?.type === "claim" &&
      graph.getNode(e.to)?.type === "claim"
  );
}

export function deriveDivergence(productId = activeProductId, contextId = activeContextId) {
  const { graph, spec, terminalByRead, caseId } = buildScenarioGraph(productId, contextId);
  const agents = deriveAgents(spec.reads.length);
  const slatedCount = Object.keys(slated[productId] || {}).length;

  const columns = spec.reads.map((read, i) => {
    const trace = traceBack(graph, terminalByRead[read.key]);
    /* traceBack returns terminal-first; reverse so the column reads
       ground → belief → action, top to bottom. */
    let steps = [...trace.steps].reverse();

    /* A refused read's traceBack is one node deep by construction, the chain
       has no hypothesis to climb. Showing only the claim hides WHY. Walk the one
       real DERIVED_FROM edge to surface the sourceIntegrityCheck that stopped
       it, so the column states its own cause. Both node and edge are real; this
       adds no fiction, it just doesn't rely on traceBack's single spine. */
    if (read.refusal_kind) {
      const claimId = terminalByRead[read.key];
      const derived = graph.outgoing(claimId, "DERIVED_FROM")[0];
      const cause = derived ? graph.getNode(derived.to) : null;
      if (cause) {
        steps = [
          { node: cause, viaEdge: derived },
          { node: graph.requireNode(claimId), viaEdge: null },
        ];
      }
    }

    /* Edge alignment: in this ordered (top-down) array, steps[i].viaEdge is the
       edge LINKING steps[i] to steps[i+1]. So the edge rendered above node i is
       steps[i-1].viaEdge, and the first node has none. */
    const rendered = steps.map((s, idx) => ({
      node: s.node,
      edge: idx > 0 ? steps[idx - 1].viaEdge || null : null,
    }));

    return {
      readKey: read.key,
      agent: agents[i]?.name || `Read ${i + 1}`,
      reg: agents[i]?.reg || "diligence",
      refused: Boolean(read.refusal_kind),
      refusal_kind: read.refusal_kind || null,
      truncated: rendered.length < 4,
      /* Every node actually shown belongs to this read, including the
         refusal's cause, which traceBack's single spine does not reach. */
      traceIds: rendered.map((s) => s.node.id),
      steps: rendered,
    };
  });

  const dEdge = divergenceEdges(graph)[0] || null;
  let divergence = null;
  if (dEdge) {
    const fromRead = columns.find((c) => c.traceIds.includes(dEdge.from));
    const toRead = columns.find((c) => c.traceIds.includes(dEdge.to));
    divergence = {
      type: dEdge.type,
      polarity: EDGE_POLARITY[dEdge.type] || "neutral",
      confidence: dEdge.provenance.confidence ?? null,
      fromClaimId: dEdge.from,
      toClaimId: dEdge.to,
      fromAgent: fromRead?.agent || "read 2",
      toAgent: toRead?.agent || "read 1",
      rationale: (dEdge.data?.rationale || "")
        .replace(/\{b\}/g, fromRead?.agent || "read 2")
        .replace(/\{a\}/g, toRead?.agent || "read 1"),
      /* Proves the ported finder is load-bearing, not decorative. */
      contradictedClaims:
        dEdge.type === "CONTRADICTS"
          ? findContradictions(graph, dEdge.to).map((n) => n.id)
          : [],
    };
  }

  const rule = graph.getNodes("reviewRule")[0] || null;

  return {
    graph,
    caseId,
    caseTitle: graph.requireNode(caseId).title,
    slatedCount,
    columns,
    divergence,
    reviewRule: rule ? { title: rule.title, note: rule.data?.note || "" } : null,
    traceIdsByRead: Object.fromEntries(columns.map((c) => [c.readKey, c.traceIds])),
  };
}

/* ─── render ────────────────────────────────────────────────────────── */

const NODE_ABBR = {
  observation: "OBS", entity: "ENT", track: "TRK", anomaly: "ANOM",
  hypothesis: "HYP", claim: "CLAIM", evidence: "EV",
  sourceIntegrityCheck: "SIC", actionOption: "ACT",
  reviewRule: "RULE", case: "CASE",
};

function band(c) {
  if (c === null || c === undefined) return "none";
  if (c >= 0.75) return "high";
  if (c >= 0.5) return "mid";
  return "low";
}

function stepHTML(step, colIdx) {
  const { node, edge } = step;
  const conf = edge?.provenance?.confidence ?? null;
  const pol = edge ? EDGE_POLARITY[edge.type] || "neutral" : "neutral";

  /* data-edge-to lets the collapsed (narrow) state hide an edge together with
     the node it leads to, so a stub edge never dangles above nothing. */
  const edgeRow = edge
    ? `<div class="dvg-edge-step dvg-edge-step--${pol}" data-edge-to="${node.type}"
            title="${edge.type} · confidence ${conf ?? "n/a"}">
         <span class="dvg-edge-type">${edge.type}</span>
         ${conf !== null ? `<span class="dvg-edge-conf" data-band="${band(conf)}">${conf.toFixed(2)}</span>` : ""}
       </div>`
    : "";

  return `${edgeRow}
    <div class="dvg-node" data-node-type="${node.type}" data-spine-id="${node.id}"
         data-node="spine" data-col="${colIdx}"
         role="button" tabindex="0"
         aria-label="Correct ${node.type}: ${node.title}">
      <span class="dvg-node-type">${NODE_ABBR[node.type] || node.type}</span>
      <span class="dvg-node-title">${node.title}</span>
    </div>`;
}

function columnHTML(col, i) {
  const head = `
    <div class="dvg-agent">
      <span class="dvg-agent-name">${col.agent}</span>
      <span class="dvg-reg" data-reg="${col.reg}">${col.reg}</span>
    </div>`;

  const chain = col.steps.map((s) => stepHTML(s, i)).join("");

  /* Stacked (narrow) mode collapses the chain to claim → action so the three
     reads stay comparable without a 1000px scroll; the full provenance is one
     press away. The button is display:none in columnar mode, where everything
     is already visible, and refused columns are short enough to never collapse. */
  const expand = col.refused
    ? ""
    : `<button type="button" class="dvg-expand" aria-expanded="false"
               data-expand="${i}">
         <span class="dvg-expand-open">show provenance · ${col.steps.length} steps</span>
         <span class="dvg-expand-close">hide provenance</span>
       </button>`;

  /* The truncation notice is the refusal, stated as geometry. */
  const tail = col.refused
    ? `<div class="dvg-terminal" data-refusal-kind="${col.refusal_kind}">
         <span class="dvg-terminal-kind">refused · ${col.refusal_kind}</span>
         <span class="dvg-terminal-note">chain terminates · no action reachable</span>
       </div>`
    : "";

  return `<div class="dvg-col${col.refused ? " is-refused" : ""}" data-agent="${col.agent}">
    ${head}<div class="dvg-chain">${chain}</div>${tail}${expand}
  </div>`;
}

/* opts.gate: does this render COUNT as the founder having seen the split?
   Visibility and acknowledgement are separate things. Cut 01 pre-renders the
   pane at READING so a first-time viewer meets the disagreement immediately,
   but that must NOT satisfy the Confirm gate in slate.js, otherwise the first
   Confirm seals straight through and the "look at the split before you sign"
   mechanic silently disappears. Pre-render passes {gate:false}; the DECIDING
   beat calls with the default and closes the gate. */
export function renderDivergence(host, ctx, opts = {}) {
  const { gate = true } = opts;

  /* Already on screen from an earlier pre-render: don't rewrite the DOM (that
     would flash identical content and re-wire live handlers), just apply the
     gate. Keyed off the host's own contents so an IDLE reset, which clears
     them, correctly re-renders next cycle. */
  if (host.innerHTML.trim() !== "") {
    host.hidden = false;
    if (gate) divergenceSeen = true;
    return;
  }

  let model;
  try {
    model = deriveDivergence();
  } catch (err) {
    /* A schema violation must be visible, not swallowed, the pane's whole
       claim is that the graph is real. */
    host.innerHTML = `<div class="dvg"><div class="dvg-h">
      <span class="dvg-h-glyph">⑂</span><span>Divergence unavailable · graph invalid</span>
      </div><p class="dvg-node-title">${err.message}</p></div>`;
    host.hidden = false;
    ctx?.appendAudit?.(`divergence · graph invalid · ${err.message}`, true);
    return;
  }

  const n = model.columns.length;
  const d = model.divergence;

  host.innerHTML = `
    <div class="dvg" style="--dvg-cols:${n}">
      <div class="dvg-h">
        <span class="dvg-h-glyph">⑂</span>
        <span>Divergence · where the reads split</span>
        <span class="dvg-tag">${n} reads · never merged</span>
      </div>

      <div class="dvg-ground" data-node="ground" data-spine-id="${model.caseId}"
           role="button" tabindex="0"
           aria-label="Annotate ground no read produced (emergence correction)">
        <span class="dvg-ground-label">case</span>
        <span class="dvg-ground-body">${model.caseTitle}</span>
        <span class="dvg-ground-hint">annotate → emergence</span>
      </div>

      <div class="dvg-body">
        <div class="dvg-grid">${model.columns.map(columnHTML).join("")}</div>
      </div>

      ${d ? `
        <div class="dvg-edge-caption" data-node="edge" data-polarity="${d.polarity}"
             role="button" tabindex="0"
             aria-label="Correct this ${d.type} edge (cross correction)">
          <span class="dvg-edge-label dvg-edge-label--${d.polarity}">${d.type}</span>
          <span class="dvg-edge-note">${d.rationale}</span>
          ${d.confidence !== null ? `<span class="dvg-edge-conf" data-band="${band(d.confidence)}">${d.confidence.toFixed(2)}</span>` : ""}
          <span class="dvg-edge-hint">correct → cross</span>
        </div>` : ""}

      ${model.reviewRule ? `
        <div class="dvg-rule" data-node="rule" data-spine-id="rr:carried"
             role="button" tabindex="0"
             aria-label="Correct the carried review rule">
          <span class="dvg-rule-label">rule · applies_to</span>
          <span class="dvg-rule-title">${model.reviewRule.title}</span>
          <span class="dvg-rule-note">${model.reviewRule.note}</span>
        </div>` : ""}
    </div>`;

  wireCorrections(host, ctx, model);
  wireExpanders(host);
  host.hidden = false;
  if (gate) divergenceSeen = true;
  ctx?.appendAudit?.(`divergence · ${n} reads · split shown`);
}

/* ─── correction geometry ───────────────────────────────────────────────
   WHERE you click determines correction_kind. A correction is an operator-
   authored edge; correctionKindFor() (lib/spine.js) reads the kind off the
   endpoints' positions in the reads' traces. */

/* Provenance expanders are navigation, not correction: they must never write an
   audit row. Kept in their own wiring so the [data-node] correction sweep below
   cannot pick them up. */
function wireExpanders(host) {
  host.querySelectorAll("[data-expand]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.closest(".dvg-col");
      const open = col.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
}

function wireCorrections(host, ctx, model) {
  host.querySelectorAll("[data-node]").forEach((el) => {
    const node = el.dataset.node;

    const fire = () => {
      /* Geometry decides uniformly. The divergence edge spans two claims in
         two different traces, so it resolves to `cross` on its own; the case
         root and a carried rule sit outside every trace (traceBack stops at
         observation), so they resolve to `emergence`. Nothing is hardcoded: 
         a shared observation correctly reads as `cross` because it genuinely
         belongs to more than one read. */
      const kind = correctionKindFor(
        node === "edge"
          ? { from: model.divergence.fromClaimId, to: model.divergence.toClaimId }
          : { from: el.dataset.spineId, to: el.dataset.spineId },
        model.traceIdsByRead
      );

      const col = el.closest(".dvg-col");
      const agent = col?.dataset.agent;
      const typeLabel = el.dataset.nodeType || node;
      el.classList.add("is-corrected");
      ctx?.appendAudit?.(
        `correction · ${kind}${agent ? ` · ${agent}` : ""} · ${typeLabel}`
      );
      ctx?.showToast?.(
        kind === "emergence"
          ? "Emergence · ground no read produced"
          : `Correction · ${kind} · ${typeLabel}`
      );
    };

    el.addEventListener("click", fire);
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); }
    });
  });
}
