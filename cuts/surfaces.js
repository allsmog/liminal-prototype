// surfaces.js · the shared cut-coordinate substrate
// ════════════════════════════════════════════════════════════════════════
// Single source of truth for "every surface in the catalog + its coordinate."
// Extracted from _console.html (2026-06-18) so MORE THAN ONE consumer can read
// it without copy-paste drift. Consumers today:
//   · cuts/_console.html: directory + survey + coherence scan
//   · cuts/_compare.html: pairwise A/B comparison harness
// Edit a coordinate HERE and both surfaces update on next load. This is the
// CONTRIBUTING-rule-#5 substrate: don't grow a third vocabulary: grow this one.
//
// Add a row when a surface lands. `survey:true` = appears in the console's Survey grid.
//
// TAXONOMY (2026-06-16): live cuts + consoles carry their coordinate per
// cuts/TAXONOMY.md v2: alt (altitude L1-L4) · framing (wedge/infra) · stage
// (loop-stage). The console's "Group by" toggle re-groups the directory by
// Altitude (the canonical strategic ladder) instead of the nav-type `grp`. ONE
// taxonomy, two views. The `grp` key remains the navigation grouping
// (find-a-file); altitude is the product grouping (see-the-strategy).
export const SURFACES = [
  { grp: 'Live cuts', desc: 'current audience surfaces · slot-numbered', items: [
    { num:'00', file:'00-agency.html', name:'Agency master', meta:'subject-as-parameter', badge:'live', survey:true,
      alt:'L1–L4', framing:'infra', stage:'full-loop',
      jump:'One shell, one loop; subject switches (pattern · notification · custody · OSINT · spend).',
      check:'register reskin + evidence-pane swap hold across subjects; orbital coverage viz renders; Tray→Slate works.' },
    { num:'01', file:'01-slate-tray.html', src:'01-slate-tray.html?reset', name:'Three-surface slate', meta:'canonical front door', badge:'live', survey:true,
      alt:'L1-founder', framing:'wedge', stage:'Capture→Read→Decide',
      jump:'Canonical front door: slate-tray-vault workspace; brand/speedrun hero toggle.',
      check:'three-doors overlay on first session (?reset); slate · tray · agency rail · audit ribbon all visible.' },
    { num:'02', file:'02-forensic-agent.html', name:'Forensic Agent', meta:'diligence loop · v0.3', badge:'live', survey:true,
      alt:'L1-founder', framing:'wedge', stage:'Read',
      jump:'Contradicting-notification diligence loop.',
      check:'three-pane shape holds; audit column no overflow; contradiction claim wraps cleanly.' },
    { num:'03', file:'03-calibration.html', name:'Calibration view', meta:'12wk × 4-register', badge:'live', survey:true,
      alt:'L1→L2', framing:'infra', stage:'Record',
      jump:'12wk × 4-register vault heatmap: the moat-visibility cut.',
      check:'each register row shows its color; cells encode count; drill panel responds to clicks.' },
    { num:'04', file:'04-onboarding.html', name:'Onboarding · first touch', meta:'JSX in cuts/onboarding/', badge:'live', survey:true,
      alt:'L1-founder', framing:'wedge', stage:'pre-loop',
      jump:'Desktop land-tier first-run (the install ceremony). Consolidates archived cuts 05/06/07.',
      check:'step progression holds; the correction/delta moment reads clearly.' },
    { num:'05', file:'05-plugin-seed.html', name:'Plugin seed · terminal first-run', meta:'renders shipped liminal-agents flow', badge:'live', survey:true,
      alt:'L2-team', framing:'wedge', stage:'pre-loop',
      jump:'The plugin-surface entry (G1 · matrix B1). Renders the shipped enable → /onboard-swarm → /try-liminal → install flow as a terminal session. The SEED before the desktop land (cut 04).',
      check:'four beats reveal in sequence; swarm labels by extraction (facts/commitments/risks), try-liminal by register (Diligence/Outreach/Judgment); refusals shown verbatim.' },
    { num:'06', file:'06-margin-read.html', name:'Margin-read · the founder’s hand', meta:'marginalia over the live loop', badge:'live', survey:true,
      alt:'L1-founder', framing:'wedge', stage:'full-loop',
      jump:'The re-entry loop rendered as real UX, narrated by staged founder marginalia (⌘N / ←→). Refusal is the focal beat. (06 slot reused. The old 06 onboarding-compare is archived, folded into cut 04.)',
      check:'clean surface loads first; ⌘N walks notes one-at-a-time, each spotlighting its live element; refusal step reads as the product; reduced-motion still reveals.' },
    { num:'08', file:'08-liminal-custody.html', name:'Liminal Custody · NatSec', meta:'DoD/IC register', badge:'live', survey:true,
      alt:'L3-high-stakes', framing:'infra', stage:'full-loop',
      jump:'NatSec-register custody view (DoD/IC audience).',
      check:'classification banner + custody chrome render; register doesn’t bleed into other palettes.' },
    { num:'09', file:'09-osint-custody.html', name:'OSINT Custody · live kernel', meta:'recomputes in-browser', badge:'live', survey:true,
      alt:'L3-high-stakes', framing:'infra', stage:'full-loop',
      jump:'Wired to the real kernel; loop recomputed live in-browser.',
      check:'INGEST→READ→GUARD→REVIEW→VAULT runs; provenance snapshot renders; DISCORD toggle works. (Heavy, loads on click.)' },
    { num:'10', file:'10-today.html', name:'Today · re-entry', meta:'the loop closes', badge:'live', survey:true,
      alt:'L1-founder', framing:'wedge', stage:'Re-enter',
      jump:'Held compositions re-read overnight; the loop closes.',
      check:'re-entry cards render; the “how it landed” correction prompt is reachable.' },
    { num:'11', file:'11-govern.html', name:'Govern · the Agency Loop', meta:'correction-primary · ⌘K', badge:'live', survey:true,
      alt:'L1→L2', framing:'wedge→infra', stage:'full-loop',
      jump:'Correction-as-primary; Today re-entry; Mirror reflect-back; ⌘K palette.',
      check:'⌘K opens; OKR allocation bar renders; Amend marks a read corrected; Mirror reflects the stream.' },
    { num:'13', file:'13-judgment.html', name:'Judgment · acceptance & correction', meta:'one AI result → one record (LIM-2273)', badge:'live', survey:true,
      alt:'L1→L2', framing:'wedge→infra', stage:'Decide→Record',
      jump:'Cut 11’s F-CAL proposal judged as one continuous act: inspect evidence · accept / correct / reject / defer · confirm · six-question record · re-entry on Today.',
      check:'AI card says not-yet-accepted; opening evidence marks it inspected; selecting an assertion opens the correction form; confirm writes to IndexedDB and the record shows original beside correction; Today shows the card and reopens the same record.' },
  ]},
  { grp: 'Scaffold + exploration', desc: 'authoring tools and in-flight directions', items: [
    { file:'_template.html', name:'_template', badge:'', jump:'Starting shape for a new cut.' },
    { file:'_console.html', name:'_console (this console)', badge:'', jump:'This page: the Substrate Console.' },
    { file:'_compare.html', name:'_compare (A/B harness)', badge:'', jump:'Mount any two surfaces side by side; read the taxonomy delta.' },
    { file:'_explore/ledger-directions.html', name:'ledger-directions', badge:'wip',
      jump:'Provenance chain as a decision ledger: Spine / Sealed Stack / Anchor Strand.' },
  ]},
  { grp: 'Standalone consoles', desc: 'self-contained surfaces with their own shell', items: [
    { file:'../molehunt/index.html', repo:'molehunt/index.html', name:'molehunt', badge:'live',
      alt:'L3-high-stakes', framing:'infra', stage:'full-loop',
      jump:'Counterintelligence analyst console: high-assurance, print-to-dossier.' },
    { file:'../team-drift/index.html', repo:'team-drift/index.html', name:'team-drift', badge:'live',
      alt:'L2-team', framing:'infra', stage:'Read/decide + Record/correct',
      jump:'Claim drift + team coherence telemetry: one claim, five surfaces, three answers; governance-as-a-pipe.',
      check:'claim-drift card leads (fictional dataset, display language only, v2-vocab-gate enforced); Devon telemetry below; correction-queued action beat renders.' },
  ]},
  { grp: 'Embeds', desc: 'embeddable composition demos', items: [
    { file:'../embed-slate-tray-demo.html', repo:'embed-slate-tray-demo.html', name:'embed-slate-tray-demo', badge:'', jump:'Slate & Tray: live composition surface.' },
    { file:'../embed-vault-demo.html', repo:'embed-vault-demo.html', name:'embed-vault-demo', badge:'', jump:'Vault + Agents: four-register read.' },
    { file:'../embed-agent-hack.html', repo:'embed-agent-hack.html', name:'embed-agent-hack', badge:'', jump:'Agent hackathon composition cut.' },
  ]},
  { grp: 'Specimens + design system', desc: 'token browser, type ramps, surface specimens', items: [
    { file:'../index.html', repo:'index.html', name:'index (public catalog)', badge:'', jump:'The public curated front door (root).' },
    { file:'../design-system.html', repo:'design-system.html', name:'design-system', badge:'', jump:'Token browser, type ramp, motion specimens.' },
    { file:'../design-system/atlas/state-atlas.html', repo:'design-system/atlas/state-atlas.html', name:'state-atlas', badge:'', jump:'Component-state matrix (v0.1).' },
    { file:'../liminal-desktop-specimen.html', repo:'liminal-desktop-specimen.html', name:'liminal-desktop-specimen', badge:'', jump:'Desktop app specimen (2026-05-12).' },
    { file:'../nineties-headliner-specimen.html', repo:'nineties-headliner-specimen.html', name:'nineties-headliner-specimen', badge:'', jump:'NinetiesHeadliner type: visual inspection.' },
    { file:'../ontology-agent-travel-3d.html', repo:'ontology-agent-travel-3d.html', name:'ontology-agent-travel-3d', badge:'', jump:'3D ontology agent-travel mock (root).' },
  ]},
  { grp: 'Archive · retired cuts', desc: 'consolidated or superseded: kept for genealogy', frozen:true, items: [
    { file:'_archive/00-hero-demo.html', name:'00-hero-demo', badge:'retired', jump:'Speedrun-pipeline hero → folded into cut 01.' },
    { file:'_archive/01-slate-tray-speedrun.html', name:'01-slate-tray-speedrun', badge:'retired', jump:'Speedrun-register slate → now a toggle inside cut 01.' },
    { file:'_archive/05-onboarding-argument.html', name:'05-onboarding-argument', badge:'retired', jump:'“the redline IS the onboarding” → folded into cut 04.' },
    { file:'_archive/06-onboarding-compare.html', name:'06-onboarding-compare', badge:'retired', jump:'7-step vs 3-step → folded into cut 04.' },
    { file:'_archive/07-onboarding-radical.html', name:'07-onboarding-radical', badge:'retired', jump:'3 steps, “the delta IS the onboarding” → folded into cut 04.' },
    { file:'_archive/11-govern-cockpit-iter.html', name:'11-govern-cockpit-iter', badge:'retired', jump:'Govern desktop-shell iteration → folded into cut 11.' },
    { file:'_archive/12-agency-govern-iter.html', name:'12-agency-govern-iter', badge:'retired', jump:'Agency · Govern reconciled-loop iteration → folded into cut 11.' },
    { file:'_archive/index-agenthansa-frozen.html', name:'index-agenthansa-frozen', badge:'retired', jump:'Frozen “Agenthansa” Speedrun-pipeline hero.' },
  ]},
  { grp: 'Archive · root-experiments', desc: 'frozen index versions + the ontology-agent-travel 3D series', frozen:true, items: [
    { file:'_archive/root-experiments/index-v04-frozen.html', name:'index-v04-frozen', badge:'retired', jump:'Frozen index · v0.4 (Agents · Space).' },
    { file:'_archive/root-experiments/ontology-agent-travel-options.html', name:'ontology-agent-travel-options', badge:'retired', jump:'Ontology agent-travel: options exploration.' },
    { file:'_archive/root-experiments/ontology-agent-travel-real-3d.html', name:'ontology-agent-travel-real-3d', badge:'retired', jump:'Ontology agent-travel: real 3D graphs.' },
    { file:'_archive/root-experiments/ontology-agent-travel-more-3d.html', name:'ontology-agent-travel-more-3d', badge:'retired', jump:'Ontology agent-travel: more 3D mocks.' },
  ]},
  // 'Frozen baselines' group removed 2026-07-31 along with root _baseline/.
  // Those two snapshots were served publicly by GitHub Pages (200 at
  // liminalshruti.github.io/liminal-prototype/_baseline/*), which was a side
  // effect of .nojekyll rather than a decision: without it, Jekyll excludes
  // underscore-prefixed directories by default. server.mjs had always listed
  // '_baseline' in SKIP_DIRS, so the repo's own dev server never served them.
  // REPO_ATLAS.md classes the directory EXHAUST: "regenerable; archive or drop".
  // Git history holds both files if a pre-pivot snapshot is ever wanted.
];

// repo-relative path for a surface (for matching against /__state dirty list).
// Console + compare both live in cuts/, so a bare file is cuts/<file>;
// `repo` overrides for ../ paths.
export function repoPath(it) { return it.repo || (it.file.startsWith('../') ? it.file.replace(/^\.\.\//,'') : 'cuts/' + it.file); }
