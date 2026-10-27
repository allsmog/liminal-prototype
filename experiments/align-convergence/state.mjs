/** In-memory prototype replay. Role strings are simulated actors, never credentials. */
export const DISPOSITIONS = ['accept', 'correct', 'reject', 'defer'];
const PHASES = ['conflict', 'proposed', 'countered', 'acknowledged', 'approved', 'declined'];
const noAuthority = Object.freeze({ signed: false, durable: false, nativeJudgment: false, policyInForce: false, executionPermission: false, businessOutcome: false });

export function initialState(fixture) {
  if (fixture?.schema !== 'align-convergence-prototype-fixture' || fixture.version !== 1 || fixture.synthetic !== true || fixture.projection?.synthetic !== true) throw new Error('SYNTHETIC_FIXTURE_REQUIRED');
  if (Object.values(fixture.projection.authority).some(value => value !== false)) throw new Error('IMPORTED_AUTHORITY_REFUSED');
  return { schema: 'align-convergence-memory-state', fixtureId: fixture.id, phase: 'conflict', view: 'Slate', evidenceMode: 'TESTED', evidenceRevision: 1, available: true, inspected: [], approved: null, form: { correction: fixture.default_correction, revisitOn: '2026-10-14' }, draft: null, pending: null, saveStatus: 'idle', records: [], returns: [], selectedRecordId: null, supersedes: null, trace: [], error: null, lensOpen: false, historyOpen: false, ...noAuthority };
}

const fail = (state, code) => ({ ...state, error: code });
const requiredEvidence = fixture => fixture.projection.evidence.map(item => item.id);
const completeInspection = (state, fixture) => requiredEvidence(fixture).every(id => state.inspected.includes(id));
export function currentGoal(fixture) { return fixture.projection.goals.find(goal => goal.source_goal_id === 'g-security-v2_1'); }
export function canPrepare(state, fixture) {
  return !state.pending && completeInspection(state, fixture) && (state.phase === 'approved' || state.phase === 'declined');
}

/** All writes are confined to the supplied JS value. There are no I/O effects. */
export function reduce(state, action, fixture) {
  if (!action || typeof action.type !== 'string') return fail(state, 'UNSUPPORTED_ACTION');
  if (!PHASES.includes(state.phase) || state.fixtureId !== fixture.id) return fail(state, 'INVALID_STATE');
  const next = structuredClone(state);
  next.error = null;
  const requireActor = actor => action.actor === actor;
  const recordStep = detail => next.trace.push({ sequence: next.trace.length + 1, action: action.type, actor: action.actor || 'prototype-control', detail, executable: false });
  switch (action.type) {
    case 'NAVIGATE':
      if (!['Slate', 'Today', 'Record'].includes(action.view)) return fail(state, 'UNKNOWN_SURFACE');
      next.view = action.view; return next;
    case 'TOGGLE_LENS': next.lensOpen = !next.lensOpen; return next;
    case 'TOGGLE_HISTORY': next.historyOpen = !next.historyOpen; return next;
    case 'EDIT_JUDGMENT':
      if (!requireActor('operator')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.pending || state.draft) return fail(state, 'JUDGMENT_FROZEN');
      if (!['correction', 'revisitOn'].includes(action.field) || typeof action.value !== 'string') return fail(state, 'INVALID_JUDGMENT_FIELD');
      next.form[action.field] = action.value; return next;
    case 'PROPOSE':
      if (!requireActor('product')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.phase !== 'conflict') return fail(state, 'PROPOSAL_ORDER');
      next.phase = 'proposed'; recordStep(fixture.proposal.proposed_measure_text); return next;
    case 'COUNTER':
      if (!requireActor('security')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.phase !== 'proposed') return fail(state, 'COUNTER_ORDER');
      next.phase = 'countered'; recordStep(fixture.proposal.counter_versions[0].proposed_measure_text); return next;
    case 'ACKNOWLEDGE':
      if (!requireActor('product')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.phase !== 'countered') return fail(state, 'ACKNOWLEDGMENT_ORDER');
      next.phase = 'acknowledged'; recordStep('Product acknowledged the exact Security counter.'); return next;
    case 'APPROVE': {
      if (!requireActor('security')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.phase !== 'acknowledged') return fail(state, 'APPROVAL_ORDER');
      if (action.planHash !== currentGoal(fixture).accepted_plan.sha256) return fail(state, 'PLAN_HASH_MISMATCH');
      if (state.evidenceMode !== 'TESTED' && action.untested !== true) return fail(state, 'STALE_EVIDENCE_BLOCK');
      const tested = state.evidenceMode === 'TESTED';
      next.phase = 'approved';
      next.approved = { owner: currentGoal(fixture).owner, sourceGoalId: currentGoal(fixture).source_goal_id, sourceVersion: currentGoal(fixture).version, evidenceRevision: state.evidenceRevision, testStatus: tested ? 'TESTED' : 'UNTESTED', acceptedPlanHash: tested ? action.planHash : null, priorPlanHash: action.planHash, planMatchesAcceptedParameters: tested, independentlyAuthenticated: false, desktopAuthorized: false };
      recordStep(tested ? 'Simulated source-owner approval bound to the displayed plan hash.' : 'Simulated untested branch. No tested plan hash binds the changed parameters.'); return next;
    }
    case 'DECLINE':
      if (!requireActor('security')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (!['proposed', 'countered', 'acknowledged'].includes(state.phase)) return fail(state, 'DECLINE_ORDER');
      next.phase = 'declined'; next.approved = null; recordStep('Security declined the proposal. No newer source goal is approved in this replay.'); return next;
    case 'SOURCE_REVISED':
      if (state.pending) return fail(state, 'SAVE_PENDING');
      next.evidenceMode = 'STALE'; next.evidenceRevision += 1; next.inspected = []; next.draft = null;
      if (next.phase === 'approved') next.phase = 'acknowledged';
      next.approved = null;
      if (state.records.length) {
        const id = state.records.at(-1).id;
        next.returns = [...state.returns.filter(item => item.recordId !== id), { recordId: id, reason: 'A later synthetic source change makes the earlier evidence stale.', revision: next.evidenceRevision }];
      }
      recordStep('A synthetic parameter change invalidated evidence applicability. Original reports remain unchanged.'); return next;
    case 'SET_AVAILABILITY':
      if (typeof action.available !== 'boolean') return fail(state, 'INVALID_AVAILABILITY');
      next.available = action.available; return next;
    case 'INSPECT':
      if (!requireActor('operator')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (!state.available) return fail(state, 'EVIDENCE_OFFLINE');
      if (!requiredEvidence(fixture).includes(action.evidenceId)) return fail(state, 'UNKNOWN_EVIDENCE');
      if (!next.inspected.includes(action.evidenceId)) next.inspected.push(action.evidenceId);
      recordStep(`Operator opened ${action.evidenceId} at evidence revision ${state.evidenceRevision}.`); return next;
    case 'PREPARE':
      if (!requireActor('operator')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (!canPrepare(state, fixture)) return fail(state, state.pending ? 'SAVE_PENDING' : 'INSPECTION_OR_OWNER_DECISION_REQUIRED');
      if (!DISPOSITIONS.includes(action.disposition)) return fail(state, 'INVALID_DISPOSITION');
      if (state.phase !== 'approved' && ['accept', 'correct'].includes(action.disposition)) return fail(state, 'OWNER_APPROVAL_REQUIRED');
      if (action.disposition === 'correct' && !state.form.correction.trim()) return fail(state, 'CORRECTION_REQUIRED');
      if (action.disposition === 'defer') {
        const date = /^2026-\d{2}-\d{2}$/.test(state.form.revisitOn) && Date.parse(`${state.form.revisitOn}T00:00:00Z`);
        if (!date || new Date(date).toISOString().slice(0,10) !== state.form.revisitOn || date <= Date.parse(fixture.clock)) return fail(state, 'REVISIT_DATE_REQUIRED');
      }
      next.draft = { disposition: action.disposition, correction: action.disposition === 'correct' ? state.form.correction.trim() : null, revisitOn: action.disposition === 'defer' ? state.form.revisitOn : null, evidenceRevision: state.evidenceRevision };
      return next;
    case 'CONFIRM':
      if (!requireActor('operator')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.pending) return fail(state, 'SAVE_PENDING');
      if (!state.draft || !canPrepare(state, fixture) || state.draft.evidenceRevision !== state.evidenceRevision) return fail(state, 'DRAFT_REQUIRED');
      next.pending = { id: `prototype:${fixture.id}:${String(state.records.length + 1).padStart(3, '0')}`, fixtureId: fixture.id, createdAt: new Date(Date.parse(fixture.clock) + state.records.length * 1000).toISOString(), originalAgentText: fixture.agent_reply, sourceUrl: fixture.agent_source_url, operator: { label: 'Operator at this device (simulated)', authenticated: false }, judgment: structuredClone(state.draft), ownerAgreement: structuredClone(state.approved), evidence: fixture.projection.evidence.map(item => ({ id: item.id, reportSha256: item.report_sha256, signature: 'UNSIGNED', scope: item.scope })), inspectedEvidenceIds: [...state.inspected], supersedes: state.supersedes, ...noAuthority };
      next.saveStatus = 'pending'; recordStep('Operator confirmed a memory-only prototype record.'); return next;
    case 'SAVE_FAILED':
      if (!state.pending || state.saveStatus !== 'pending') return fail(state, 'SAVE_NOT_PENDING');
      next.saveStatus = 'failed'; recordStep('Simulated save failed. No record was appended.'); return next;
    case 'RETRY_SAVE':
      if (!state.pending || state.saveStatus !== 'failed') return fail(state, 'RETRY_NOT_AVAILABLE');
      next.saveStatus = 'pending'; recordStep('Retry uses the same pending record ID and immutable snapshot.'); return next;
    case 'SAVE_SUCCEEDED': {
      if (!state.pending) {
        if (state.records.some(item => item.id === action.recordId)) return state;
        return fail(state, 'SAVE_NOT_PENDING');
      }
      if (state.saveStatus !== 'pending' || action.recordId !== state.pending.id) return fail(state, 'SAVE_ID_MISMATCH');
      const record = structuredClone(state.pending);
      next.records.push(record); next.selectedRecordId = record.id; next.pending = null; next.draft = null; next.supersedes = null; next.saveStatus = 'saved'; next.view = 'Record';
      if (record.judgment.disposition === 'defer') next.returns.push({ recordId: record.id, reason: `Deferred until ${record.judgment.revisitOn}.`, revision: record.judgment.evidenceRevision });
      recordStep(`Memory-only record ${record.id} created. No signature, persistence, policy or execution effect.`); return next;
    }
    case 'OPEN_RECORD':
      if (!state.records.some(record => record.id === action.recordId)) return fail(state, 'RECORD_NOT_FOUND');
      next.selectedRecordId = action.recordId; next.view = 'Record'; return next;
    case 'SUPERSEDE':
      if (!requireActor('operator')) return fail(state, 'WRONG_SIMULATED_ACTOR');
      if (state.pending) return fail(state, 'SAVE_PENDING');
      if (!state.records.some(record => record.id === action.recordId)) return fail(state, 'RECORD_NOT_FOUND');
      next.supersedes = action.recordId; next.draft = null; next.view = 'Slate'; return next;
    default: return fail(state, 'UNSUPPORTED_ACTION');
  }
}

/** Deterministic review states. Uses the same reducer as every visible button. */
export function preset(fixture, name = 'conflict') {
  if (!['conflict','proposed','countered','acknowledged','approved','stale','untested','declined','confirm','failed','record','today'].includes(name)) throw new Error('UNKNOWN_PRESET');
  let state = initialState(fixture);
  const act = action => { state = reduce(state, action, fixture); if (state.error) throw new Error(state.error); };
  if (name === 'conflict') return state;
  act({ type: 'PROPOSE', actor: 'product' });
  if (name === 'proposed') return state;
  act({ type: 'COUNTER', actor: 'security' });
  if (name === 'countered') return state;
  if (name === 'declined') { act({ type: 'DECLINE', actor: 'security' }); return state; }
  act({ type: 'ACKNOWLEDGE', actor: 'product' });
  if (name === 'acknowledged') return state;
  if (name === 'stale' || name === 'untested') act({ type: 'SOURCE_REVISED' });
  if (name === 'stale') return state;
  act({ type: 'APPROVE', actor: 'security', planHash: currentGoal(fixture).accepted_plan.sha256, untested: name === 'untested' });
  if (name === 'approved' || name === 'untested') return state;
  for (const id of requiredEvidence(fixture)) act({ type: 'INSPECT', actor: 'operator', evidenceId: id });
  act({ type: 'PREPARE', actor: 'operator', disposition: 'correct' });
  if (name === 'confirm') return state;
  act({ type: 'CONFIRM', actor: 'operator' });
  if (name === 'failed') { act({ type: 'SAVE_FAILED' }); return state; }
  act({ type: 'SAVE_SUCCEEDED', recordId: state.pending.id });
  if (name === 'today') { act({ type: 'SOURCE_REVISED' }); act({ type: 'NAVIGATE', view: 'Today' }); }
  return state;
}
