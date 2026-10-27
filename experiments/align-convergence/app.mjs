import { currentGoal, preset, reduce } from './state.mjs';
import { render } from './view.mjs';
import { validateWorkConflict } from './work-conflict.mjs';

const app = document.querySelector('#app');
const status = document.querySelector('#load-status');
const scenario = document.querySelector('#scenario');
const availability = document.querySelector('#availability');
const params = new URLSearchParams(location.search);
const allowed = [...scenario.options].map(option => option.value);
const variant = ['evidence-b', 'history-b', 'confirm-b', 'lens-current'].includes(params.get('variant')) ? params.get('variant') : '';

try {
  const [fixtureResponse, pinResponse] = await Promise.all([fetch('./fixture.json'), fetch('./fixture.sha256')]);
  if (!fixtureResponse.ok || !pinResponse.ok) throw new Error('The local fixture is unavailable.');
  const bytes = await fixtureResponse.arrayBuffer();
  const expected = (await pinResponse.text()).split(/\s/)[0];
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2,'0')).join('');
  if (digest !== expected) throw new Error('Fixture integrity check failed.');
  const fixture = JSON.parse(new TextDecoder().decode(bytes));
  let workConflict = null;
  // Optional sibling deliverable. Presence changes read-only context, never authority.
  if (params.get('lens') === 'work-conflict') {
    const [response, conflictPinResponse] = await Promise.all([fetch('./work-conflict.json'), fetch('./work-conflict.sha256')]);
    if (!response.ok || !conflictPinResponse.ok) throw new Error('The optional local Goal Lens projection is unavailable.');
    const conflictBytes = await response.arrayBuffer();
    const conflictDigest = [...new Uint8Array(await crypto.subtle.digest('SHA-256',conflictBytes))].map(value=>value.toString(16).padStart(2,'0')).join('');
    if (conflictDigest !== (await conflictPinResponse.text()).split(/\s/)[0]) throw new Error('Goal Lens fixture integrity check failed.');
    workConflict = validateWorkConflict(JSON.parse(new TextDecoder().decode(conflictBytes)),fixture);
  }
  scenario.value = allowed.includes(params.get('state')) ? params.get('state') : 'conflict';
  let state = preset(fixture, scenario.value);
  if (params.get('context') === 'goal') state.lensOpen = true;
  const draw = () => {
    const focus = document.activeElement;
    const focusAction = focus?.dataset?.action;
    const focusText = focus?.textContent;
    app.innerHTML = render(state, fixture, { variant, workConflict });
    availability.setAttribute('aria-pressed', String(!state.available));
    availability.textContent = state.available ? 'Simulate offline evidence' : 'Restore fixture evidence';
    if (focusAction) {
      const replacement = [...app.querySelectorAll('[data-action]')].find(item => item.dataset.action === focusAction && item.textContent === focusText && !item.disabled);
      (replacement || app.querySelector('#main'))?.focus({preventScroll:true});
    }
    status.textContent = `${state.phase} · ${state.evidenceMode} · ${state.records.length} memory record(s)`;
  };
  const dispatch = action => { state = reduce(state, action, fixture); draw(); };
  app.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    const data = target.dataset;
    const action = { type: data.action, actor: data.actor, view: data.view, evidenceId: data.evidenceId, recordId: data.recordId };
    if (action.type.startsWith('APPROVE')) {
      action.untested = action.type === 'APPROVE_UNTESTED'; action.type = 'APPROVE'; action.planHash = currentGoal(fixture).accepted_plan.sha256;
    }
    if (action.type === 'PREPARE') action.disposition = data.disposition;
    if (action.type === 'SAVE_SUCCEEDED') action.recordId = state.pending?.id;
    dispatch(action);
  });
  const retainJudgmentInput = event => {
    const target = event.target.closest('[data-edit-field]');
    if (!target) return;
    // Capture each edit without replacing the focused control or moving its caret.
    state = reduce(state, { type: 'EDIT_JUDGMENT', actor: target.dataset.actor, field: target.dataset.editField, value: target.value }, fixture);
  };
  app.addEventListener('input', retainJudgmentInput);
  app.addEventListener('change', retainJudgmentInput);
  app.addEventListener('submit', event => event.preventDefault());
  scenario.addEventListener('change', () => { state = preset(fixture, scenario.value); draw(); });
  document.querySelector('#reset').addEventListener('click', () => { state = preset(fixture, scenario.value); draw(); });
  availability.addEventListener('click', () => dispatch({ type: 'SET_AVAILABILITY', available: !state.available }));
  document.querySelector('#revise').addEventListener('click', () => dispatch({ type: 'SOURCE_REVISED' }));
  draw();
} catch (error) {
  status.textContent = 'Study unavailable';
  const message = document.createElement('p'); message.className = 'refusal'; message.setAttribute('role','alert'); message.textContent = error.message;
  app.replaceChildren(message);
}
