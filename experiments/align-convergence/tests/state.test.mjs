import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { initialState, reduce, preset, currentGoal, canPrepare } from '../state.mjs';
import { render, escapeHtml } from '../view.mjs';
import { validateWorkConflict } from '../work-conflict.mjs';

const bytes = await readFile(new URL('../fixture.json', import.meta.url));
const fixture = JSON.parse(bytes);
const pin = (await readFile(new URL('../fixture.sha256', import.meta.url), 'utf8')).split(/\s/)[0];
const conflictBytes = await readFile(new URL('../work-conflict.json',import.meta.url));
const conflict = JSON.parse(conflictBytes);
const conflictPin = (await readFile(new URL('../work-conflict.sha256',import.meta.url),'utf8')).split(/\s/)[0];
const clone = object => structuredClone(object);
const act = (state, type, extra = {}) => reduce(state, { type, ...extra }, fixture);
const inspect = state => fixture.projection.evidence.reduce((next,item) => act(next,'INSPECT',{actor:'operator',evidenceId:item.id}),state);
const approve = state => act(state,'APPROVE',{actor:'security',planHash:currentGoal(fixture).accepted_plan.sha256});
const edit = (state, field, value) => act(state,'EDIT_JUDGMENT',{actor:'operator',field,value});
const prepare = (state, disposition = 'correct', extra = {}) => {
  for (const [field,value] of Object.entries(extra)) state=edit(state,field,value);
  return act(state,'PREPARE',{actor:'operator',disposition});
};
const complete = state => { const pending = act(state,'CONFIRM',{actor:'operator'}); return act(pending,'SAVE_SUCCEEDED',{recordId:pending.pending.id}); };

test('fixture bytes match the independently computed checked-in pin', () => {
  assert.equal(createHash('sha256').update(bytes).digest('hex'),pin);
  assert.equal(fixture.provenance.align_commit,'850971e13a74eab20f8d8789cb78331517ef28da');
  assert.equal(fixture.provenance.export_sha256,fixture.projection.export_sha256);
});

test('fixture report detail covers nine checks and exact recorded pass counts',()=>{
  for (const report of fixture.projection.evidence) {
    assert.equal(fixture.report_checks[report.id].length,report.total);
    assert.equal(fixture.report_checks[report.id].filter(check=>check.passed).length,report.passed);
    assert.equal(report.signature,'UNSIGNED');
  }
});

test('fixture text includes the actual pinned agent response and separate correction',()=>{
  assert.match(fixture.agent_reply,/I triaged the entire open ticket inbox/);
  assert.notEqual(fixture.agent_reply,fixture.default_correction);
});

test('real or authority-bearing input is refused',()=>{
  const real=clone(fixture); real.synthetic=false;
  assert.throws(()=>initialState(real),/SYNTHETIC_FIXTURE_REQUIRED/);
  const elevated=clone(fixture); elevated.projection.authority.execution_permission=true;
  assert.throws(()=>initialState(elevated),/IMPORTED_AUTHORITY_REFUSED/);
});

for (const [name,type,actor] of [['conflict','PROPOSE','product'],['proposed','COUNTER','security'],['countered','ACKNOWLEDGE','product'],['acknowledged','APPROVE','security']]) {
  test(`${type} refuses forged or missing simulated actor`,()=>{
    for (const bad of [undefined,'agent','operator','ceo','<script>']) {
      const result=act(preset(fixture,name),type,{actor:bad,planHash:currentGoal(fixture).accepted_plan.sha256});
      assert.equal(result.error,'WRONG_SIMULATED_ACTOR'); assert.equal(result.phase,name);
    }
    assert.equal(act(preset(fixture,name),type,{actor,planHash:currentGoal(fixture).accepted_plan.sha256}).error,null);
  });
}

for (const [type,actor,error] of [['COUNTER','security','COUNTER_ORDER'],['ACKNOWLEDGE','product','ACKNOWLEDGMENT_ORDER'],['APPROVE','security','APPROVAL_ORDER'],['DECLINE','security','DECLINE_ORDER']]) {
  test(`${type} cannot skip the proposal chain`,()=>assert.equal(act(initialState(fixture),type,{actor}).error,error));
}

test('tested owner approval binds exact plan hash without promoting Desktop authority',()=>{
  const state=preset(fixture,'approved');
  assert.equal(state.approved.acceptedPlanHash,currentGoal(fixture).accepted_plan.sha256);
  assert.equal(state.approved.testStatus,'TESTED');
  assert.equal(state.approved.independentlyAuthenticated,false);
  assert.equal(state.approved.desktopAuthorized,false);
});

test('wrong or missing plan hash blocks approval',()=>{
  for (const planHash of [undefined,'0'.repeat(64)]) assert.equal(act(preset(fixture,'acknowledged'),'APPROVE',{actor:'security',planHash}).error,'PLAN_HASH_MISMATCH');
});

test('stale evidence blocks tested approval; explicit untested branch carries no accepted hash',()=>{
  const stale=preset(fixture,'stale');
  assert.equal(approve(stale).error,'STALE_EVIDENCE_BLOCK');
  const state=act(stale,'APPROVE',{actor:'security',planHash:currentGoal(fixture).accepted_plan.sha256,untested:true});
  assert.equal(state.approved.testStatus,'UNTESTED');
  assert.equal(state.approved.acceptedPlanHash,null);
  assert.equal(state.approved.planMatchesAcceptedParameters,false);
  assert.equal(state.approved.priorPlanHash,currentGoal(fixture).accepted_plan.sha256);
});

test('new source revision clears approval, inspection, and unconfirmed draft',()=>{
  const state=prepare(inspect(preset(fixture,'approved')));
  const revised=act(state,'SOURCE_REVISED');
  assert.equal(revised.phase,'acknowledged'); assert.equal(revised.approved,null); assert.equal(revised.draft,null); assert.deepEqual(revised.inspected,[]);
  assert.equal(revised.evidenceMode,'STALE');
});

test('inspection alone cannot approve or authenticate the source owner',()=>{
  const state=inspect(initialState(fixture)); assert.equal(state.approved,null); assert.equal(canPrepare(state,fixture),false);
});

test('rendered report buttons carry the actor and evidence fields needed by the reducer',()=>{
  let state=preset(fixture,'approved');
  const buttons=[...render(state,fixture).matchAll(/<button\b[^>]*data-action="INSPECT"[^>]*>/g)];
  assert.equal(buttons.length,fixture.projection.evidence.length);
  for (const [html] of buttons) {
    const actor=html.match(/data-actor="([^"]+)"/)?.[1];
    const evidenceId=html.match(/data-evidence-id="([^"]+)"/)?.[1];
    state=act(state,'INSPECT',{actor,evidenceId});
    assert.equal(state.error,null);
  }
  assert.equal(canPrepare(state,fixture),true);
});

test('offline report does not count as inspected and retry is explicit',()=>{
  const offline=act(initialState(fixture),'SET_AVAILABILITY',{available:false});
  const attempt=act(offline,'INSPECT',{actor:'operator',evidenceId:fixture.projection.evidence[0].id});
  assert.equal(attempt.error,'EVIDENCE_OFFLINE'); assert.deepEqual(attempt.inspected,[]);
  const restored=act(attempt,'SET_AVAILABILITY',{available:true});
  const retried=act(restored,'INSPECT',{actor:'operator',evidenceId:fixture.projection.evidence[0].id});
  assert.equal(retried.inspected.length,1);
});

test('unknown evidence and forged inspector refuse without recording inspection',()=>{
  assert.equal(act(initialState(fixture),'INSPECT',{actor:'operator',evidenceId:'missing'}).error,'UNKNOWN_EVIDENCE');
  assert.equal(act(initialState(fixture),'INSPECT',{actor:'agent',evidenceId:fixture.projection.evidence[0].id}).error,'WRONG_SIMULATED_ACTOR');
});

test('duplicate inspection is idempotent',()=>{
  const state=inspect(preset(fixture,'approved')); assert.deepEqual(inspect(state).inspected,state.inspected);
});

test('rendered editable fields carry the actor and field names consumed by the reducer',()=>{
  let state=preset(fixture,'approved');
  const values={correction:'Keep the capacity limit after source review.',revisitOn:'2026-10-21'};
  const controls=[...render(state,fixture).matchAll(/<(?:textarea|input)\b[^>]*data-edit-field="[^"]+"[^>]*>/g)];
  assert.equal(controls.length,2);
  for (const [html] of controls) {
    const actor=html.match(/data-actor="([^"]+)"/)?.[1];
    const field=html.match(/data-edit-field="([^"]+)"/)?.[1];
    state=act(state,'EDIT_JUDGMENT',{actor,field,value:values[field]});
    assert.equal(state.error,null);
  }
  assert.deepEqual(state.form,values);
});

test('operator edits survive report inspection, lens, offline, navigation and source redraws',()=>{
  const values={correction:'Keep <capacity> & the owner\'s constraint.\nInspect again.',revisitOn:'2026-10-21'};
  let state=edit(edit(preset(fixture,'approved'),'correction',values.correction),'revisitOn',values.revisitOn);
  for (const action of [
    {type:'INSPECT',actor:'operator',evidenceId:fixture.projection.evidence[0].id},
    {type:'TOGGLE_LENS'}, {type:'TOGGLE_HISTORY'},
    {type:'SET_AVAILABILITY',available:false}, {type:'SET_AVAILABILITY',available:true},
    {type:'NAVIGATE',view:'Today'}, {type:'NAVIGATE',view:'Record'}, {type:'NAVIGATE',view:'Slate'},
    {type:'SOURCE_REVISED'},
  ]) {
    state=reduce(state,action,fixture);
    assert.equal(state.error,null);
    assert.deepEqual(state.form,values);
    if (state.view==='Slate') {
      const html=render(state,fixture);
      assert.ok(html.includes(`>${escapeHtml(values.correction)}</textarea>`));
      assert.match(html,/name="revisitOn"[^>]*value="2026-10-21"/);
      assert.ok(!html.includes('<capacity>'));
    }
  }
});

test('cleared fields remain empty after redraw and cannot silently use fixture defaults',()=>{
  let state=edit(edit(inspect(preset(fixture,'approved')),'correction',''),'revisitOn','');
  state=act(state,'TOGGLE_LENS');
  assert.match(render(state,fixture),/<textarea[^>]*><\/textarea>/);
  assert.match(render(state,fixture),/name="revisitOn"[^>]*value=""/);
  assert.equal(prepare(state,'correct').error,'CORRECTION_REQUIRED');
  assert.equal(prepare(state,'defer').error,'REVISIT_DATE_REQUIRED');
});

test('confirmation records the retained operator correction rather than a prepare payload',()=>{
  const correction='  Preserve beta priority and the explicit capacity limit.  ';
  const state=edit(inspect(preset(fixture,'approved')),'correction',correction);
  const prepared=act(state,'PREPARE',{actor:'operator',disposition:'correct',correction:'Discard this unbound field.'});
  assert.equal(prepared.draft.correction,correction.trim());
  assert.equal(complete(prepared).records[0].judgment.correction,correction.trim());
  assert.equal(state.form.correction,correction);
});

test('deferral uses the retained date after navigating away and back',()=>{
  let state=edit(inspect(preset(fixture,'approved')),'revisitOn','2026-10-21');
  state=act(act(state,'NAVIGATE',{view:'Today'}),'NAVIGATE',{view:'Slate'});
  const saved=complete(prepare(state,'defer'));
  assert.equal(saved.records[0].judgment.revisitOn,'2026-10-21');
  assert.equal(saved.returns[0].reason,'Deferred until 2026-10-21.');
});

test('later edit events cannot alter prepared or failed pending record snapshots',()=>{
  const prepared=prepare(edit(inspect(preset(fixture,'approved')),'correction','Keep this exact operator correction.'));
  const before=clone(prepared);
  const refused=edit(prepared,'correction','Replacement');
  assert.equal(refused.error,'JUDGMENT_FROZEN');
  assert.deepEqual(refused.draft,before.draft);
  assert.deepEqual(refused.form,before.form);
  const pending=act(act(prepared,'CONFIRM',{actor:'operator'}),'SAVE_FAILED');
  const snapshot=clone(pending.pending);
  for (const field of ['correction','revisitOn']) {
    const changed=edit(pending,field,'Replacement');
    assert.equal(changed.error,'JUDGMENT_FROZEN');
    assert.deepEqual(changed.pending,snapshot);
    assert.deepEqual(changed.form,pending.form);
  }
  const retry=act(pending,'RETRY_SAVE');
  assert.deepEqual(act(retry,'SAVE_SUCCEEDED',{recordId:snapshot.id}).records,[snapshot]);
  assert.deepEqual(prepared,before);
});

test('explicit reset and preset construction restore form defaults without retaining prior memory',()=>{
  const changed=edit(edit(preset(fixture,'approved'),'correction','My correction'),'revisitOn','2026-10-21');
  const defaults={correction:fixture.default_correction,revisitOn:'2026-10-14'};
  for (const fresh of [initialState(fixture),preset(fixture,'approved'),preset(fixture,'countered')]) {
    assert.deepEqual(fresh.form,defaults);
    assert.notDeepEqual(fresh.form,changed.form);
    assert.equal(fresh.records.length,0);
  }
});

test('form editing refuses wrong actors, unknown fields and non-string values',()=>{
  const state=initialState(fixture);
  for (const actor of [undefined,'agent','security']) assert.equal(act(state,'EDIT_JUDGMENT',{actor,field:'correction',value:'Injected'}).error,'WRONG_SIMULATED_ACTOR');
  for (const [field,value] of [['approved','Injected'],['__proto__','Injected'],['correction',null],['revisitOn',42]]) {
    const refused=edit(state,field,value);
    assert.equal(refused.error,'INVALID_JUDGMENT_FIELD');
    assert.deepEqual(refused.form,state.form);
  }
});

for (const disposition of ['accept','correct','reject','defer']) {
  test(`${disposition} survives operator confirmation and exact record creation`,()=>{
    const prepared=prepare(inspect(preset(fixture,'approved')),disposition);
    assert.equal(prepared.records.length,0);
    const state=complete(prepared); const record=state.records[0];
    assert.equal(record.judgment.disposition,disposition);
    assert.equal(record.originalAgentText,fixture.agent_reply);
    assert.equal(record.judgment.correction,disposition==='correct'?fixture.default_correction:null);
    assert.equal(record.id,'prototype:align-convergence-journey-v1:001');
    assert.equal(record.inspectedEvidenceIds.length,2);
    for (const flag of ['signed','durable','nativeJudgment','policyInForce','executionPermission','businessOutcome']) assert.equal(record[flag],false);
  });
}

test('each required report must be inspected before preparing',()=>{
  const state=preset(fixture,'approved');
  assert.equal(prepare(state).error,'INSPECTION_OR_OWNER_DECISION_REQUIRED');
  const one=act(state,'INSPECT',{actor:'operator',evidenceId:fixture.projection.evidence[0].id});
  assert.equal(prepare(one).error,'INSPECTION_OR_OWNER_DECISION_REQUIRED');
});

test('correction and valid future deferral date are required',()=>{
  const state=inspect(preset(fixture,'approved'));
  assert.equal(prepare(state,'correct',{correction:'  '}).error,'CORRECTION_REQUIRED');
  for (const date of ['', '2026-99-99','2026-02-30','2026-10-11']) assert.equal(prepare(state,'defer',{revisitOn:date}).error,'REVISIT_DATE_REQUIRED');
  assert.equal(prepare(state,'invented').error,'INVALID_DISPOSITION');
});

test('declined owner proposal permits rejecting or deferring, not accepting or correcting',()=>{
  const state=inspect(preset(fixture,'declined'));
  for (const disposition of ['accept','correct']) assert.equal(prepare(state,disposition).error,'OWNER_APPROVAL_REQUIRED');
  for (const disposition of ['reject','defer']) assert.equal(complete(prepare(state,disposition)).records[0].ownerAgreement,null);
});

test('source approval cannot itself create an operator record',()=>{
  const state=preset(fixture,'approved'); assert.equal(state.records.length,0);
  assert.equal(act(state,'CONFIRM',{actor:'operator'}).error,'DRAFT_REQUIRED');
});

test('failed save preserves immutable pending snapshot and creates no record',()=>{
  const state=preset(fixture,'failed'); assert.equal(state.records.length,0); assert.equal(state.saveStatus,'failed');
  const snapshot=clone(state.pending);
  assert.equal(prepare(state).error,'SAVE_PENDING');
  assert.equal(act(state,'SOURCE_REVISED').error,'SAVE_PENDING');
  assert.equal(act(state,'CONFIRM',{actor:'operator'}).error,'SAVE_PENDING');
  const retry=act(state,'RETRY_SAVE'); assert.deepEqual(retry.pending,snapshot);
  const saved=act(retry,'SAVE_SUCCEEDED',{recordId:snapshot.id});
  assert.deepEqual(saved.records,[snapshot]);
});

test('repeated save completion is idempotent and wrong completion ID refuses',()=>{
  const pending=act(preset(fixture,'confirm'),'CONFIRM',{actor:'operator'});
  assert.equal(act(pending,'SAVE_SUCCEEDED',{recordId:'foreign'}).error,'SAVE_ID_MISMATCH');
  const saved=act(pending,'SAVE_SUCCEEDED',{recordId:pending.pending.id});
  assert.deepEqual(act(saved,'SAVE_SUCCEEDED',{recordId:pending.pending.id}),saved);
  assert.equal(act(saved,'SAVE_SUCCEEDED',{recordId:'foreign'}).error,'SAVE_NOT_PENDING');
});

test('later change surfaces exact existing record and preserves original signed-status flags',()=>{
  const before=preset(fixture,'record'); const original=clone(before.records[0]);
  const later=act(before,'SOURCE_REVISED');
  assert.deepEqual(later.records[0],original); assert.equal(later.returns[0].recordId,original.id);
  const reopened=act(later,'OPEN_RECORD',{recordId:later.returns[0].recordId});
  assert.equal(reopened.view,'Record'); assert.equal(reopened.selectedRecordId,original.id);
  assert.equal(reopened.records.length,1);
  assert.match(render(reopened,fixture),/A later source change makes the earlier evidence stale/);
});

test('supersession appends one linked record and never edits historical judgment',()=>{
  const before=preset(fixture,'record'); const original=clone(before.records[0]);
  const again=act(before,'SUPERSEDE',{actor:'operator',recordId:original.id});
  const saved=complete(prepare(again,'reject'));
  assert.equal(saved.records.length,2); assert.deepEqual(saved.records[0],original);
  assert.equal(saved.records[1].supersedes,original.id);
  assert.notEqual(saved.records[1].id,original.id);
  const historical=act(saved,'OPEN_RECORD',{recordId:original.id});
  assert.match(render(historical,fixture),/Superseded by/);
});

test('defer creates exact-record return; reject creates no automatic return',()=>{
  const base=inspect(preset(fixture,'approved'));
  assert.equal(complete(prepare(base,'defer')).returns[0].recordId,'prototype:align-convergence-journey-v1:001');
  assert.deepEqual(complete(prepare(base,'reject')).returns,[]);
});

test('reload resets prototype memory and does not claim durable restart support',()=>{
  assert.equal(preset(fixture,'record').records.length,1);
  assert.deepEqual(initialState(fixture).records,[]);
  assert.match(render(preset(fixture,'record'),fixture),/Reloading this page clears every prototype record/);
});

test('all presets stay deterministic and incapable of new authority',()=>{
  for (const name of ['conflict','proposed','countered','acknowledged','approved','stale','untested','declined','confirm','failed','record','today']) {
    const state=preset(fixture,name); assert.deepEqual(state,preset(fixture,name));
    for (const flag of ['signed','durable','nativeJudgment','policyInForce','executionPermission','businessOutcome']) assert.equal(state[flag],false);
    assert.equal(state.error,null);
  }
  assert.throws(()=>preset(fixture,'forged'),/UNKNOWN_PRESET/);
});

test('unknown actions, surfaces, and record IDs refuse',()=>{
  const state=initialState(fixture);
  assert.equal(act(state,'RUN_AGENT').error,'UNSUPPORTED_ACTION');
  assert.equal(reduce(state,null,fixture).error,'UNSUPPORTED_ACTION');
  assert.equal(act(state,'NAVIGATE',{view:'Goals'}).error,'UNKNOWN_SURFACE');
  assert.equal(act(state,'OPEN_RECORD',{recordId:'other'}).error,'RECORD_NOT_FOUND');
});

test('reducer never mutates its input or fixture',()=>{
  const state=preset(fixture,'confirm'); const snapshot=clone(state); const fixtureSnapshot=clone(fixture);
  act(state,'CONFIRM',{actor:'operator'}); assert.deepEqual(state,snapshot); assert.deepEqual(fixture,fixtureSnapshot);
});

test('untrusted source and correction strings render only as escaped text',()=>{
  const hostile=clone(fixture); hostile.agent_reply='<img src=x onerror=alert(1)>'; hostile.proposal.proposed_measure_text='<script>grant()</script>';
  const html=render(preset(hostile,'proposed'),hostile);
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;img')); assert.equal(escapeHtml('"&\''),'&quot;&amp;&#39;');
  const state=complete(prepare(inspect(preset(fixture,'approved')),'correct',{correction:'<iframe src="javascript:grant()"></iframe>'}));
  assert.ok(!render(state,fixture).includes('<iframe'));
});

test('source links require exact repository and commit-shaped path',()=>{
  const hostile=clone(fixture); hostile.agent_source_url='javascript:alert(1)';
  assert.ok(!render(initialState(hostile),hostile).includes('href="javascript:'));
});

test('renderer keeps canonical three-surface navigation and one dominant heading',()=>{
  for (const name of ['conflict','approved','record','today']) {
    const html=render(preset(fixture,name),fixture);
    assert.equal((html.match(/<h1>/g)||[]).length,1);
    assert.ok(html.includes('aria-label="Operating Plane"'));
    assert.ok(!html.includes('data-view="Goals"'));
  }
});

test('Goal Lens remains contextual with source/desktop match and post-approval limits',()=>{
  const html=render(act(initialState(fixture),'TOGGLE_LENS'),fixture);
  assert.match(html,/Desktop match/); assert.match(html,/Unconfirmed/); assert.match(html,/No post-approval execution/);
  assert.match(html,/All spend remains unallocated/);
});

test('review views expose stale block, unsigned evidence, simulated ownership and failure/retry',()=>{
  assert.match(render(preset(fixture,'stale'),fixture),/A tested approval is blocked/);
  assert.match(render(preset(fixture,'untested'),fixture),/No bound plan hash/);
  assert.match(render(preset(fixture,'failed'),fixture),/Retry same record/);
  assert.match(render(preset(fixture,'approved'),fixture),/Desktop identity and authority have not been established/);
  assert.match(render(preset(fixture,'approved'),fixture),/UNSIGNED/);
});

test('prompt 5 projection bytes are pinned and bound to the same source export',()=>{
  assert.equal(createHash('sha256').update(conflictBytes).digest('hex'),conflictPin);
  assert.equal(validateWorkConflict(conflict,fixture),conflict);
});

test('Goal Lens projection refuses mismatched sources, real data and authority promotion',()=>{
  for (const mutation of [value=>value.synthetic=false,value=>value.align_export_sha256='0'.repeat(64),value=>value.authority.execution_permission=true,value=>value.provider.live_call_made=true,value=>value.rows[0].desktop_goal_match=true,value=>value.rows[0].automatic_veto=true,value=>value.rows[0].status='INVENTED']) {
    const value=clone(conflict); mutation(value); assert.throws(()=>validateWorkConflict(value,fixture));
  }
});

test('Goal Lens keeps 100 percent unallocated and refuses fabricated costs or shares',()=>{
  for (const mutation of [value=>value.coverage.allocated_bps=100,value=>value.coverage.unallocated_bps=9000,value=>value.coverage.cost=123,value=>value.rows[0].allocation.cost=100,value=>value.rows[0].allocation.allocated_bps=5000]) {
    const value=clone(conflict); mutation(value); assert.throws(()=>validateWorkConflict(value,fixture));
  }
});

test('Goal Lens renders four distinct mapping states without collapsing source approval into execution',()=>{
  const state=act(preset(fixture,'approved'),'TOGGLE_LENS');
  const html=render(state,fixture,{workConflict:validateWorkConflict(conflict,fixture)});
  for (const title of ['Work followed an obsolete goal','Suggested link needs inspection','Owner refused this link','No assigned goal']) assert.ok(html.includes(title));
  assert.match(html,/Execution after the source approval: not observed/);
  assert.equal((html.match(/0% allocated · 100% unallocated/g)||[]).length,4);
});

test('current lens comparison is explicitly a contract reconstruction',()=>{
  const html=render(act(preset(fixture,'approved'),'TOGGLE_LENS'),fixture,{variant:'lens-current'});
  assert.match(html,/Current-main contract reconstruction/);
  assert.match(html,/not a screenshot of the native app/);
});
