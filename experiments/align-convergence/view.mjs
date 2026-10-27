import { canPrepare, currentGoal } from './state.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const e = escapeHtml;
const button = (label, action, attrs = '', disabled = false) => `<button type="button" class="p-read__btn" data-action="${action}" ${attrs} ${disabled ? 'disabled' : ''}>${e(label)}</button>`;
const source = (label, url) => /^https:\/\/github\.com\/liminalworksinc\/align\/blob\/[a-f0-9]{40}\//.test(url || '') ? `<a href="${e(url)}" target="_blank" rel="noopener noreferrer">${e(label)} ↗</a>` : '<span>Source unavailable</span>';
const pill = text => `<span class="p-read__tag">${e(text)}</span>`;
const hash = value => `<code class="hash">${e(value || 'No bound plan hash')}</code>`;
const row = (label, value) => `<div class="p-read__row"><span class="p-read__k">${e(label)}</span><span class="p-read__v">${value}</span></div>`;
const card = (title, body, tone = 'judgment') => `<section class="p-read p-read--${tone}"><h2>${e(title)}</h2>${body}</section>`;
const errorCopy = {
  STALE_EVIDENCE_BLOCK: 'Approval blocked. The source changed after these reports. Choose an explicit untested branch or obtain a new matching test.',
  EVIDENCE_OFFLINE: 'The report could not be opened. Restore the fixture provider and retry. Inspection has not been recorded.',
  INSPECTION_OR_OWNER_DECISION_REQUIRED: 'Open both reports and finish the source owner decision before preparing this judgment.',
  OWNER_APPROVAL_REQUIRED: 'Security declined the proposal. You can record rejection or defer for another conversation.',
};

function evidence(state, fixture, variant) {
  const body = fixture.projection.evidence.slice().reverse().map(item => {
    const inspected = state.inspected.includes(item.id);
    return `<article class="evidence-item" data-evidence="${e(item.id)}"><div class="p-read__tags">${pill(item.plan)}${pill(`${item.verdict} ${item.passed}/${item.total}`)}${pill('UNSIGNED')}</div>
      <p>${item.verdict === 'FAIL' ? 'The completed work followed the oldest-first plan and failed seven checks.' : 'The saved beta-first run passed nine checks on the same mission, seed, checks, and scenario.'}</p>
      ${button(inspected ? 'Report inspected' : 'Open report', 'INSPECT', `data-actor="operator" data-evidence-id="${e(item.id)}"`, inspected)}
      ${inspected ? `<div class="report"><h3>Historical sandbox report</h3><ul>${fixture.report_checks[item.id].map(check => `<li><span class="${check.passed ? 'passed' : 'failed'}">${check.passed ? 'Pass' : 'Fail'}</span> ${e(check.label)}</li>`).join('')}</ul>${row('Report SHA-256', hash(item.report_sha256))}${row('Original bytes', source('Read pinned source report', item.report_url))}${row('Trace', source('Read pinned agent trace', item.trace_url))}<p class="caption">Opening this report records a prototype inspection action. It does not prove understanding, authenticate a person, or sign these bytes.</p></div>` : ''}
      </article>`;
  }).join('');
  const inside = `<p>These are stored synthetic sandbox runs. No provider runs here, and no organizational outcome was measured.</p>${body}<details><summary>Why these reports can be compared</summary>${row('Mission', e(fixture.projection.evidence[0].mission_id))}${row('Embedded input bodies', hash(fixture.projection.evidence[0].embedded_inputs_sha256))}<p>The flagship adapter compares the embedded seed, mission, scenario and every check definition. The package input digest remains a source claim.</p></details>`;
  return variant === 'evidence-b' ? card('Inspect the evidence', `<details class="evidence-drawer"><summary>Two source reports · historical and unsigned</summary>${inside}</details>`, 'diligence') : card('Inspect the evidence', inside, 'diligence');
}

function negotiation(state, fixture, variant) {
  const goal = currentGoal(fixture);
  const labels = { conflict: 'A source owner must decide', proposed: 'Product proposed an adjustment', countered: 'Security asked for a capacity limit', acknowledged: 'Product acknowledged the counter', approved: 'Owner approval is recorded in this replay', declined: 'Security declined this proposal' };
  const actions = {
    conflict: button('Simulate Product proposal', 'PROPOSE', 'data-actor="product"'),
    proposed: button('Simulate Security counter', 'COUNTER', 'data-actor="security"') + button('Simulate Security decline', 'DECLINE', 'data-actor="security"'),
    countered: button('Simulate Product acknowledgment', 'ACKNOWLEDGE', 'data-actor="product"') + button('Simulate Security decline', 'DECLINE', 'data-actor="security"'),
    acknowledged: button('Simulate owner approval', 'APPROVE', 'data-actor="security"') + (state.evidenceMode !== 'TESTED' ? button('Approve as explicitly untested', 'APPROVE_UNTESTED', 'data-actor="security"') : '') + button('Simulate Security decline', 'DECLINE', 'data-actor="security"'),
    approved: '', declined: '',
  };
  const history = `<ol class="history"><li><b>Product proposes</b><p>${e(fixture.proposal.proposed_measure_text)}</p><p>${e(fixture.proposal.reciprocal_commitment)}</p></li><li><b>Security counters</b><p>${e(fixture.proposal.counter_versions[0].proposed_measure_text)}</p></li><li><b>Product acknowledges</b><p>The counter and the reciprocal commitment remain separate statements.</p></li><li><b>Security owns this goal</b><p>Alex / Security Lead must approve the exact version. Product acknowledgment alone cannot approve Security's goal.</p></li></ol>`;
  return card(labels[state.phase], `<div class="p-read__tags">${pill(state.phase)}${pill(state.evidenceMode)}${pill('Synthetic source identities')}</div>
    ${row('Accountable owner', e(goal.owner.name))}${row('Source version', e(state.phase === 'approved' ? `${goal.version} supersedes v1` : 'v1; proposed successor v2.1'))}
    <p>${e(state.phase === 'conflict' ? 'Security evidence contradicts Product’s request to treat the completed work as launch-ready.' : state.phase === 'proposed' ? fixture.proposal.proposed_measure_text : fixture.proposal.counter_versions[0].proposed_measure_text)}</p>
    ${state.phase === 'approved' ? `<p>Source-claimed owner approval: <b>${e(state.approved.testStatus)}</b>. Desktop identity and authority have not been established.</p>${row('Accepted plan hash', hash(state.approved.acceptedPlanHash))}${!state.approved.planMatchesAcceptedParameters ? `<p class="refusal">The changed parameters have no matching tested plan. The old plan hash is reference only.</p>${hash(state.approved.priorPlanHash)}` : ''}` : `<details><summary>Candidate plan hash</summary>${hash(goal.accepted_plan.sha256)}${source('Pinned plan', goal.accepted_plan.source_url)}</details>`}
    ${state.evidenceMode === 'STALE' ? '<p class="refusal" role="status">Evidence is stale for the changed parameters. A tested approval is blocked.</p>' : ''}
    <div class="p-read__actions">${actions[state.phase]}</div>
    ${variant === 'history-b' ? history : `<details><summary>Read proposal, counter and acknowledgment</summary>${history}</details>`}
    <p class="caption">Every role action above is manual prototype playback. No owner is authenticated, no policy changes, and no agent receives permission.</p>`, 'synthesis');
}

function judgment(state, fixture, variant) {
  const pending = state.pending;
  if (pending) return card(state.saveStatus === 'failed' ? 'The record was not saved' : 'Confirming your record', `<p>${state.saveStatus === 'failed' ? 'Simulated save failure. Your confirmed snapshot is retained for retry; the record list is unchanged.' : 'The following controls complete or fail a memory-only save.'}</p>${row('Exact pending ID', e(pending.id))}${row('Judgment', e(pending.judgment.disposition))}<div class="p-read__actions">${state.saveStatus === 'failed' ? button('Retry same record', 'RETRY_SAVE') : button('Complete memory save', 'SAVE_SUCCEEDED') + button('Simulate save failure', 'SAVE_FAILED')}</div>`);
  if (state.draft) {
    const summary = `${row('Choice', e(state.draft.disposition))}${row('Correction', e(state.draft.correction || 'Original text preserved without correction.'))}${row('Evidence', e(`${state.inspected.length} reports opened; revision ${state.evidenceRevision}`))}${row('Owner agreement', e(state.approved?.testStatus || 'Declined'))}${row('Supersedes', e(state.supersedes || 'First record in this replay'))}<p>Your judgment will be a separate memory-only record. The original agent text and historical source reports remain unchanged.</p>`;
    return card(variant === 'confirm-b' ? 'Your judgment' : 'Confirm your judgment', `${variant === 'confirm-b' ? `<p class="caption">Selected: ${e(state.draft.disposition)}</p><details open><summary>Review the record before confirming</summary>${summary}</details>` : summary}${button('Confirm memory-only record', 'CONFIRM', 'data-actor="operator"')}`);
  }
  return card(state.supersedes ? 'Record a superseding judgment' : 'Your judgment', `<p>Read the reports, inspect the owner agreement, then choose what this completed work means. ${state.supersedes ? `The previous record ${e(state.supersedes)} will stay intact.` : ''}</p>
    <form id="judgment-form"><label for="correction">What did the agent miss?</label><textarea id="correction" name="correction" data-edit-field="correction" data-actor="operator" rows="3">${e(state.form.correction)}</textarea><label for="revisitOn">Return date if deferred</label><input id="revisitOn" name="revisitOn" data-edit-field="revisitOn" data-actor="operator" type="date" value="${e(state.form.revisitOn)}" min="2026-10-12" max="2026-12-31"><div class="p-read__actions">${['accept','correct','reject','defer'].map(item => button(item[0].toUpperCase()+item.slice(1), 'PREPARE', `data-actor="operator" data-disposition="${item}"`, !canPrepare(state,fixture))).join('')}</div></form>
    <p class="caption">${canPrepare(state,fixture) ? 'Operator identity is simulated. No signing key or native command is used.' : 'Open both source reports and finish the source owner decision to continue.'}</p>${variant === 'confirm-b' ? '<p class="refusal">B comparison: an inline confirmation summary would sit below the selected choice. This variant changes placement only; explicit confirmation remains required.</p>' : ''}`);
}

function lens(state, fixture, workConflict, variant) {
  if (!state.lensOpen) return '';
  const goal = currentGoal(fixture);
  if (variant === 'lens-current') return card('Goal Lens', '<p class="caption">Current-main contract reconstruction using this synthetic input. This is not a screenshot of the native app.</p>'+row('Desktop goal match','Unconfirmed')+row('Linked native work','No confirmed native link for this external fixture')+row('Decision packets on record','No signed packets are bound to this fixture’s linked work.')+'<p>The current native lens opens linked packet IDs in Record. It does not import this external owner negotiation or its old-plan comparison.</p>', 'diligence');
  const labels={SUPERSEDED_CONTRACT:'Work followed an obsolete goal',UNCONFIRMED_MAPPING:'Suggested link needs inspection',REFUSED_MAPPING:'Owner refused this link',NO_GOAL:'No assigned goal',LOW_CONFIDENCE:'Low confidence requires inspection',CURRENT_CONTRACT:'Source contract matches',STALE_GOAL:'Source goal needs a fresh read',PROVIDER_UNAVAILABLE:'Source provider unavailable',CONTRADICTORY_SOURCES:'Sources contradict one another'};
  const detail=workConflict ? `<p>${e(workConflict.answer)}</p><div class="lens-rows">${workConflict.rows.map(item=>`<article class="evidence-item"><h3>${e(labels[item.status])}</h3>${row('Session',e(item.session_id))}${row('Source mapping',e(item.source_mapping_state))}${row('Artifact',source(item.artifact.id,item.artifact.source_url))}${item.approved_goal ? row('Old → approved',e(`${item.artifact.goal_id} ${item.artifact.goal_version} → ${item.approved_goal.id} ${item.approved_goal.version}`))+row('Owner who must decide',e(item.owner.name))+row('Source-approved plan',hash(item.approved_goal.accepted_plan.sha256)) : '<p>No approved goal is inferred from this mapping.</p>'}${item.historical_comparison ? '<p>Historical UNSIGNED sandbox comparison: FAIL 2/9 → PASS 9/9. Execution after the source approval: not observed.</p><a href="#owner-agreement">Inspect the owner agreement</a>' : ''}<p class="caption">0% allocated · 100% unallocated · cost unknown · no automatic veto</p></article>`).join('')}</div><details><summary>Exact read-only projection</summary><pre>${e(JSON.stringify(workConflict,null,2))}</pre></details>` : '<p class="caption">Prompt 5 projection seam: optional local work-conflict.json. No provider is called.</p>';
  return card('Goal Lens', `<p>Context for this work. The source mapping is separate from a confirmed Desktop goal match.</p>${row('Pinned export version', e(`${goal.source_goal_id} · ${goal.version}`))}${row('Owner', e(goal.owner.name))}${row('Known source link', 'fixture-agent · source-confirmed in the synthetic export')}${row('Desktop match', 'Unconfirmed')}${row('Other work', 'Suggested, refused, and unassigned samples remain outside the confirmed link.')}${row('After approval', 'No post-approval execution has been observed. The 9/9 report is historical sandbox evidence.')}<p>No cost or ROI is shown. All spend remains unallocated without an actual allocation and price basis.</p>${detail}`, 'diligence');
}

function slate(state, fixture, variant, workConflict) {
  return `<header class="page-head"><p class="eyebrow">Slate · read, correct, ratify</p><h1>The work followed an obsolete goal.</h1><p class="lede">Security’s evidence changes the read. Alex owns the goal; your judgment stays yours.</p>${button(state.lensOpen ? 'Close Goal Lens' : 'Inspect Goal Lens', 'TOGGLE_LENS')}</header>
    ${lens(state,fixture,workConflict,variant)}<div class="journey-grid"><div>
      ${card('The completed work', `<p class="caption">Imported agent response. Untrusted source text, preserved verbatim.</p><blockquote>${e(fixture.agent_reply)}</blockquote>${source('Pinned source trace', fixture.agent_source_url)}<details><summary>Why the old goal conflicts</summary>${row('Old target',e(fixture.old_measure))}${row('New requirement',e(fixture.new_requirement))}</details>`, 'judgment')}
      ${evidence(state,fixture,variant)}</div><div><div id="owner-agreement">${negotiation(state,fixture,variant)}</div>${judgment(state,fixture,variant)}</div></div>`;
}

function recordView(state) {
  const record = state.records.find(item => item.id === state.selectedRecordId) || state.records.at(-1);
  const later = record && state.returns.find(item => item.recordId === record.id && item.revision > record.judgment.evidenceRevision);
  const successor = record && state.records.find(item => item.supersedes === record.id);
  const list = state.records.length ? `<nav class="record-list" aria-label="Prototype records">${state.records.map(item => button(item.id, 'OPEN_RECORD', `data-record-id="${e(item.id)}"`)).join('')}</nav>` : '';
  return `<header class="page-head"><p class="eyebrow">Record · exact judgment</p><h1>${record ? 'The original and your correction.' : 'No record has been created.'}</h1><p class="lede">Memory only. Reloading this page clears every prototype record.</p></header>${list}${record ? card('Memory-only unsigned record', `<div data-record-id="${e(record.id)}">${later ? '<p class="refusal">A later source change makes the earlier evidence stale. The record below preserves what was accepted then.</p>' : ''}${successor ? row('Superseded by',button(successor.id,'OPEN_RECORD',`data-record-id="${e(successor.id)}"`)) : ''}${row('Exact record',e(record.id))}${row('Choice',e(record.judgment.disposition))}${row('Operator',e(record.operator.label))}${row('Owner agreement',e(record.ownerAgreement ? `${record.ownerAgreement.owner.name} · source-claimed ${record.ownerAgreement.testStatus}` : 'No owner approval'))}${row('Accepted plan hash',hash(record.ownerAgreement?.acceptedPlanHash))}${row('Correction',e(record.judgment.correction || 'No correction recorded.'))}${row('Supersedes',e(record.supersedes || 'No earlier record'))}<details><summary>Original agent text and evidence references</summary><blockquote>${e(record.originalAgentText)}</blockquote>${record.evidence.map(item=>row(item.id, `${e(item.signature)} ${hash(item.reportSha256)}`)).join('')}</details><p>Receipt signed: no. Policy in force: no. Execution permission: no. Outcome observed: no.</p><div class="p-read__actions">${button('Record again', 'SUPERSEDE', `data-actor="operator" data-record-id="${e(record.id)}"`)}${button('Simulate later source change', 'SOURCE_REVISED')}${button('Open Today', 'NAVIGATE', 'data-view="Today"')}</div></div>`) : card('Start in Slate', '<p>Inspect the reports and prepare a judgment before creating a record.</p>'+button('Open Slate','NAVIGATE','data-view="Slate"'))}`;
}

function today(state) {
  return `<header class="page-head"><p class="eyebrow">Today · re-entry</p><h1>${state.returns.length ? 'The same work needs another look.' : 'Nothing has returned yet.'}</h1><p class="lede">Returns point to the exact existing record. They do not create a second judgment.</p></header>${state.returns.map(item=>card('A judgment came back', `<p>${e(item.reason)}</p>${row('Exact record',e(item.recordId))}${button('Open exact record','OPEN_RECORD',`data-record-id="${e(item.recordId)}"`)}`,'synthesis')).join('')}${!state.returns.length ? card('Continue the replay', '<p>Create a record in Slate, then simulate a later source change. A deferred judgment also returns here.</p>'+button('Open Slate','NAVIGATE','data-view="Slate"')) : ''}`;
}

export function render(state, fixture, { variant = '', workConflict = null } = {}) {
  return `<div class="frame"><header class="titlebar"><span aria-hidden="true">◇</span><span class="title-row">Liminal · synthetic convergence study</span><span class="caption">Memory only</span></header>
    <nav class="wayfinder" aria-label="Operating Plane">${['Slate','Today','Record'].map(view=>`<button type="button" data-action="NAVIGATE" data-view="${view}" aria-current="${state.view === view ? 'page' : 'false'}">${view}</button>`).join('')}</nav>
    <main id="main" tabindex="-1">${state.error ? `<div role="alert" class="refusal">${e(errorCopy[state.error] || state.error)}</div>` : ''}${state.view === 'Slate' ? slate(state,fixture,variant,workConflict) : state.view === 'Record' ? recordView(state) : today(state)}</main>
    <footer><p>Prototype state · unsigned historical sandbox evidence · no real owner authentication · no native writes · no agent execution</p><details><summary>Replay trace and source boundary</summary><ol>${state.trace.map(item=>`<li>${e(`${item.sequence}. ${item.actor}: ${item.detail}`)}</li>`).join('')}</ol><p>Fixture ${e(fixture.id)} · Align ${e(fixture.provenance.align_commit)}</p><p>Source export SHA-256 ${hash(fixture.provenance.export_sha256)}</p></details></footer></div>`;
}
