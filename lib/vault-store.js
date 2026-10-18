/* vault-store.js · IndexedDB persistence layer
 * ────────────────────────────────────────────────────────────────────
 * Per UI_GAP_SPEC §3.2 · "Persistence is now a category-credibility
 * blocker. Under founder-OS framing, a vault that vanishes on reload
 * is not credible."
 *
 * What persists:
 *   · every correction (agent, tag, note, scenario, timestamp)
 *   · every decision/disposition (surface, kind, hash, payload)
 *   · every vault entry the user produces during a session
 *
 * What does NOT persist:
 *   · scroll positions · UI hover state · scenario clicks
 *   · tab changes · keyboard help open/closed · entry overlay state
 *   This is for the RECORD, not for analytics.
 *
 * Storage: browser IndexedDB · localised to the device · no server.
 *   DB:    "liminal-vault" · version 1
 *   stores: corrections (autoIncrement id) · decisions (autoIncrement id) ·
 *           meta (key, value)
 *
 * Schema versioning: the store carries `schema_version: 1` on every row.
 * Schema bumps require an upgrade path · don't migrate tables mid-session.
 *
 * Public API (all return Promises):
 *   init()                    open + migrate · idempotent
 *   appendCorrection(entry)   write · returns id
 *   appendDecision(entry)     write · returns id
 *   read(opts?)               read corrections · {surface?, limit?, since?}
 *   readDecisions(opts?)      read decisions · same shape
 *   count(surface?)           total corrections · optionally per-surface
 *   countDecisions(surface?)  total decisions
 *   clear()                   wipe both stores · the "Reset vault" affordance
 *   isAvailable()             does IDB work in this context (returns bool)
 *
 * The 9-tag correction taxonomy is the canonical taxonomy from
 * liminal-agents/lib/correction-tags.js · validated on write.
 */

/* DB name is parameterizable so another consumer can reuse this module
   WITHOUT editing it: call configure({ dbName }) (or init({ dbName }))
   before the first open. Defaults to this repo's name, so existing no-arg
   callers (boot.js, slate.js, keyboard.js, cuts/03-calibration) are
   byte-identical in behavior. Must be set before the DB is first opened;
   changing it after _dbPromise is cached is a no-op (logged). */
export const DEFAULT_DB_NAME = "liminal-vault";
const DB_VERSION = 1;
let _dbName = DEFAULT_DB_NAME;

/**
 * Optionally set the IndexedDB database name before first open.
 * @param {Object} [opts]
 * @param {string} [opts.dbName] · the IndexedDB database name (default "liminal-vault")
 * @returns {boolean} true if applied; false if the DB was already opened (no-op)
 */
export function configure({ dbName } = {}) {
  if (dbName == null) return true;
  if (_dbPromise) {
    console.warn(`[vault-store] configure({dbName}) ignored: DB already opened as "${_dbName}"`);
    return false;
  }
  _dbName = dbName;
  return true;
}
const STORE_CORRECTIONS = "corrections";
const STORE_DECISIONS = "decisions";
const STORE_META = "meta";

/* the 9-tag canon · carved out to lib/correction-tags.js (2026-06-18).
   Imported here and RE-EXPORTED so vault-store's public API is unchanged: 
   existing consumers (slate.js tag-picker, cuts/03-calibration) keep reading
   these off the vault-store namespace exactly as before.
   Schema authority is liminal-agents; LABELS is prototype-ahead canon-candidate.
   See docs/architecture/EXTRACTION_PLAN_correction-tags.md. */
import {
  CORRECTION_TAGS,
  CORRECTION_TAG_DESCRIPTIONS,
  CORRECTION_TAG_LABELS,
  isValidTag,
} from "./correction-tags.js";

export {
  CORRECTION_TAGS,
  CORRECTION_TAG_DESCRIPTIONS,
  CORRECTION_TAG_LABELS,
  isValidTag,
};

/* ─── IDB internals ─────────────────────────────────────────────── */

let _dbPromise = null;

function _open() {
  if (_dbPromise) return _dbPromise;
  if (!isAvailable()) return Promise.reject(new Error("IndexedDB not available"));
  _dbPromise = new Promise((resolve, reject) => {
    /* indexedDB.open can throw synchronously (e.g. a blocked storage context) */
    const req = indexedDB.open(_dbName, DB_VERSION);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains(STORE_CORRECTIONS)) {
        const s = db.createObjectStore(STORE_CORRECTIONS, { keyPath: "id", autoIncrement: true });
        s.createIndex("surface", "surface", { unique: false });
        s.createIndex("agent", "agent", { unique: false });
        s.createIndex("tag", "tag", { unique: false });
        s.createIndex("ts", "ts", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_DECISIONS)) {
        const s = db.createObjectStore(STORE_DECISIONS, { keyPath: "id", autoIncrement: true });
        s.createIndex("surface", "surface", { unique: false });
        s.createIndex("kind", "kind", { unique: false });
        s.createIndex("ts", "ts", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  /* a failed open is not cached: the next call tries again (a retry button
     would otherwise replay the same rejection forever) */
  _dbPromise.catch(() => { _dbPromise = null; });
  return _dbPromise;
}

function _tx(stores, mode = "readonly") {
  return _open().then(db => db.transaction(stores, mode));
}

function _put(storeName, value) {
  return _tx([storeName], "readwrite").then(tx => new Promise((resolve, reject) => {
    const req = tx.objectStore(storeName).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

function _getAll(storeName, query = null, count = undefined) {
  return _tx([storeName]).then(tx => new Promise((resolve, reject) => {
    const req = tx.objectStore(storeName).getAll(query, count);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

/* ─── public API ────────────────────────────────────────────────── */

export function isAvailable() {
  /* present AND usable: a context can carry the property with no factory behind it */
  return typeof window !== "undefined" && "indexedDB" in window && !!window.indexedDB;
}

/**
 * Open + migrate · idempotent.
 * @param {Object} [opts]
 * @param {string} [opts.dbName] · optional DB name (default "liminal-vault");
 *   forwarded to configure() before opening. No-arg call is unchanged behavior.
 */
export async function init(opts = {}) {
  if (!isAvailable()) return false;
  if (opts.dbName != null) configure({ dbName: opts.dbName });
  try {
    await _open();
    return true;
  } catch (e) {
    console.warn("[vault-store] init failed", e);
    return false;
  }
}

/**
 * Append a correction to the vault.
 * @param {Object} entry
 * @param {string} entry.surface  · "personal" · "team" · "business"
 * @param {string} entry.agent    · agent name (e.g., "Synthesizer")
 * @param {string} entry.tag      · one of the 9 canon tags · null/undefined for free-form
 * @param {string} [entry.note]   · optional free-text rationale
 * @param {string} [entry.scenario] · canonical context (e.g., "brian_eng" · "founding_close_decision")
 * @param {Object} [entry.context] · arbitrary structured payload
 * @returns {Promise<number>} new entry id
 */
export async function appendCorrection(entry) {
  if (!isAvailable()) throw new Error("IndexedDB not available");
  if (!entry || !entry.surface || !entry.agent) {
    throw new Error("appendCorrection requires { surface, agent }");
  }
  if (entry.tag != null && !isValidTag(entry.tag)) {
    throw new Error(`appendCorrection: invalid tag "${entry.tag}" · must be one of ${CORRECTION_TAGS.join(", ")}`);
  }
  const row = {
    schema_version: 1,
    ts: Date.now(),
    surface: entry.surface,
    agent: entry.agent,
    tag: entry.tag ?? null,
    note: entry.note ?? null,
    scenario: entry.scenario ?? null,
    context: entry.context ?? null,
  };
  return _put(STORE_CORRECTIONS, row);
}

/**
 * Append a decision/disposition artifact.
 */
export async function appendDecision(entry) {
  if (!isAvailable()) throw new Error("IndexedDB not available");
  if (!entry || !entry.surface || !entry.kind) {
    throw new Error("appendDecision requires { surface, kind }");
  }
  const row = {
    schema_version: 1,
    ts: Date.now(),
    surface: entry.surface,
    kind: entry.kind,             // "primary" · "defer"
    hash: entry.hash ?? null,
    payload: entry.payload ?? null,
  };
  return _put(STORE_DECISIONS, row);
}

/**
 * Read corrections · optionally filtered.
 * @param {Object} [opts]
 * @param {string} [opts.surface]  · filter by surface
 * @param {number} [opts.since]    · only entries with ts >= since (epoch ms)
 * @param {number} [opts.limit]    · max results (most recent first)
 */
export async function read(opts = {}) {
  if (!isAvailable()) return [];
  const all = await _getAll(STORE_CORRECTIONS);
  let rows = all;
  if (opts.surface) rows = rows.filter(r => r.surface === opts.surface);
  if (opts.since) rows = rows.filter(r => r.ts >= opts.since);
  rows.sort((a, b) => b.ts - a.ts);
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows;
}

export async function readDecisions(opts = {}) {
  if (!isAvailable()) return [];
  const all = await _getAll(STORE_DECISIONS);
  let rows = all;
  if (opts.surface) rows = rows.filter(r => r.surface === opts.surface);
  if (opts.since) rows = rows.filter(r => r.ts >= opts.since);
  rows.sort((a, b) => b.ts - a.ts);
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows;
}

export async function count(surface) {
  const rows = await read(surface ? { surface } : {});
  return rows.length;
}

export async function countDecisions(surface) {
  const rows = await readDecisions(surface ? { surface } : {});
  return rows.length;
}

export async function clear() {
  if (!isAvailable()) return;
  const tx = await _tx([STORE_CORRECTIONS, STORE_DECISIONS, STORE_META], "readwrite");
  await Promise.all([
    new Promise((res, rej) => {
      const r = tx.objectStore(STORE_CORRECTIONS).clear();
      r.onsuccess = res; r.onerror = () => rej(r.error);
    }),
    new Promise((res, rej) => {
      const r = tx.objectStore(STORE_DECISIONS).clear();
      r.onsuccess = res; r.onerror = () => rej(r.error);
    }),
    new Promise((res, rej) => {
      const r = tx.objectStore(STORE_META).clear();
      r.onsuccess = res; r.onerror = () => rej(r.error);
    }),
  ]);
}
