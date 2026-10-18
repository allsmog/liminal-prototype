/* state.js · pure runtime state for the slate/tray prototype
 *
 * No DOM imports · no rendering · just the data the rest of the build
 * reads from and mutates. Imports config from v0_3_config.js for the
 * helper accessors that derive from active product/context.
 *
 * Exports:
 *   - mutable state objects (slated, corrected, auditRows, vaultCount, etc.)
 *   - active state slot setters (setActiveProductId, setActiveContextId)
 *   - derived accessors (getActiveSubject, getActiveCase, getActiveThread,
 *     getTilesForActive, getOperatorClearanceLevel, tileIsRefused,
 *     getSlatedSet)
 *   - undo stack (pushUndo, popUndo · note popUndo here only mutates state,
 *     the rendering layer wires the surface-hop side effect)
 */
import { CONSENT_CLASSES } from "../config/consent.js";
import { PERSONAL_OPERATOR, PERSONAL_THREADS, PERSONAL_TILES_FOR_THREAD } from "../data/personal.js";
import { TEAM_SUBJECTS, TEAM_TILES_FOR_SUBJECT } from "../data/team.js";
import { BUSINESS_OPERATOR, BUSINESS_TILES_FOR_CASE, BUSINESS_SCENARIOS } from "../data/business.js";
import { SAMSEED_OPERATOR, SAMSEED_SUBJECTS, SAMSEED_TILES_FOR_SUBJECT } from "../data/sam-seed.js";

/* ─── core state ──────────────────────────────────────────────────── */

export let activeProductId = "team";
export let activeContextId = null;

export function setActiveProductId(id) { activeProductId = id; }
export function setActiveContextId(id) { activeContextId = id; }

/* ?scenario=<key> · which scenario-only threads may show. Threads carrying
   `scenario_only: "<key>"` in data/*.js render in the rail (boot.js) and the
   keyboard cycle (keyboard.js) only when that key is in the URL; absent the
   key, the default surface is byte-for-byte what it was. Lives here, not in
   boot.js, because boot.js imports keyboard.js: one definition, no cycle. */
export const ACTIVE_SCENARIO =
  typeof location === "undefined" ? "" : new URLSearchParams(location.search).get("scenario") || "";
export function threadVisible(t) { return !t.scenario_only || t.scenario_only === ACTIVE_SCENARIO; }

export const slated     = { personal: {}, team: {}, business: {}, "sam-seed": {} };
export const corrected  = { personal: {}, team: {}, business: {}, "sam-seed": {} };
export const auditRows  = { personal: [], team: [], business: [], "sam-seed": [] };
export const vaultCount = { personal: 38, team: 14, business: 247, "sam-seed": 0 };

export function bumpVault(productId) { vaultCount[productId]++; }

/* ─── slate-tile arrival tracking · for the settle animation ─────── */

export let lastLandedId = null;
export function setLastLandedId(id) { lastLandedId = id; }

/* ─── undo stack · last 5 user-driven slate actions ──────────────── */

const UNDO_LIMIT = 5;
export const undoStack = [];

export function pushUndo(entry) {
  undoStack.push(entry);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

export function popUndoEntry() {
  return undoStack.pop() ?? null;
}

/* ─── agency rail state · per-agent reading state ────────────────── */

export const agentState = {};
export const readTimes  = {};
export let disagreementPair = null;

export function setDisagreementPair(pair) { disagreementPair = pair; }
export function getDisagreementPair() { return disagreementPair; }

export function resetAgencyState(allAgents) {
  allAgents.forEach(a => { agentState[a.name] = "idle"; });
  Object.keys(readTimes).forEach(k => delete readTimes[k]);
  disagreementPair = null;
}

/* ─── derived accessors ──────────────────────────────────────────── */

export function getActiveSubject() {
  if (activeProductId === "sam-seed") return SAMSEED_SUBJECTS.find(s => s.id === activeContextId);
  if (activeProductId !== "team") return null;
  return TEAM_SUBJECTS.find(s => s.id === activeContextId);
}

export function getActiveCase() {
  if (activeProductId !== "business") return null;
  return BUSINESS_SCENARIOS.find(s => s.id === activeContextId);
}

export function getActiveThread() {
  if (activeProductId !== "personal") return null;
  return PERSONAL_THREADS.find(t => t.id === activeContextId);
}

export function getTilesForActive() {
  if (activeProductId === "personal") {
    return PERSONAL_TILES_FOR_THREAD[activeContextId] ?? [];
  }
  if (activeProductId === "team") {
    return TEAM_TILES_FOR_SUBJECT[activeContextId] ?? [];
  }
  if (activeProductId === "business") {
    return BUSINESS_TILES_FOR_CASE[activeContextId] ?? [];
  }
  if (activeProductId === "sam-seed") {
    return SAMSEED_TILES_FOR_SUBJECT[activeContextId] ?? [];
  }
  return [];
}

export function getOperatorClearanceLevel() {
  if (activeProductId === "business") return BUSINESS_OPERATOR.clearance_level;
  if (activeProductId === "team") {
    const sub = getActiveSubject();
    if (!sub) return 1;
    return CONSENT_CLASSES[sub.consent_class]?.level ?? 1;
  }
  if (activeProductId === "personal") {
    return PERSONAL_OPERATOR.clearance_level; // 99 · self-read, no gate
  }
  return 99;
}

export function tileIsRefused(tile) {
  return tile.requires_level > getOperatorClearanceLevel();
}

export function getSlatedSet() {
  if (!slated[activeProductId][activeContextId]) {
    slated[activeProductId][activeContextId] = new Set();
  }
  return slated[activeProductId][activeContextId];
}

/* ─── audit helpers · pushed by appendAudit (lives in boot.js) ───── */

export function pushAuditRow(row) {
  auditRows[activeProductId].push(row);
  if (auditRows[activeProductId].length > 5) auditRows[activeProductId].shift();
}

export function getAuditRows(productId) {
  return auditRows[productId ?? activeProductId];
}
