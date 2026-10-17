/* personal.js · Personal-surface scenario data (founder OS · the wedge)
 * ────────────────────────────────────────────────────────────────────
 * Extracted from v0_3_config.js 2026-06-18 (scenario split, personal group)
 * per docs/architecture/V0_3_CONFIG_POST_CONSENT_RECHECK.md.
 *
 * Pure data · no behavior · no imports. The personal surface's operator
 * record, subject threads, and per-thread tile catalog. Logic that reads
 * this (state.js accessors, boot render, keyboard sibling lookup) stays in
 * the consumers. v0_3_config.js re-exports these so frozen archive imports
 * keep working; live consumers (state.js, boot.js, keyboard.js) import
 * directly from data/personal.js.
 */

// ─── Personal surface · founder OS · the wedge (v0.6.10) ─────────────────
// Operator IS the subject · single-party · no consent layer · the slate
// composes the operator's own work for self-read. Tiles come from the
// operator's actual work surfaces (Granola, Linear, Slack, Obsidian,
// calendar, git). All tiles `requires_level: 0` because there's no
// asymmetric subject to protect from. Refusal only fires for explicit
// "off-limits" tiles (e.g., partner Slack threads tagged personal-only).
export const PERSONAL_OPERATOR = {
  id: "self",
  label: "You",
  role: "Founder · operator · creative",
  clearance: "self",
  clearance_level: 99,             // self-read · refusal only via explicit off-limits
  unit: "founder OS",
  cohort: "single-party · self-as-subject",
};

// Threads · what the operator is currently working through.
// Each thread is a focused decision-context with a window of tiles.
// Canonical demo thread is `founding_close_decision` · ships boot-state.
export const PERSONAL_THREADS = [
  {
    id: "founding_close_decision",
    label: "Founding round · close decision",
    eyebrow: "self-read · founder OS",
    intro: "Should you take the term sheet on the table, or hold for the round you've been building toward?",
    last_touched: "today · 7:14 AM",
    tile_count: 6,
    color: "diligence",
    canonical: true,                 // boot lands here
    drift_state: "deciding",
  },
  {
    id: "eng_hire_decision",
    label: "Eng hire · senior backend",
    eyebrow: "self-read · founder OS",
    intro: "Three finalists. Two strong on craft, one on judgment. The judgment hire would re-shape the team.",
    last_touched: "yesterday · 4:30 PM",
    tile_count: 5,
    color: "diligence",
    drift_state: "deciding",
  },
  {
    id: "design_system_migration",
    label: "Design system · v2 migration",
    eyebrow: "self-read · creative direction",
    intro: "Cut now or finish in flight. Either way the next quarter shape changes.",
    last_touched: "3d ago",
    tile_count: 4,
    color: "synthesis",
    drift_state: "stable",
  },
  {
    id: "self_baseline_check",
    label: "90-day self · pattern check",
    eyebrow: "self-read · own baseline",
    intro: "Where have you been drifting from your own stated values? The agents read your last 90 days against the values you wrote down in January.",
    last_touched: "weekly · last Sun",
    tile_count: 3,
    color: "judgment",
    drift_state: "stable",
  },
  /* The creative ICP scenario · per SCENARIO_SPEC_DESIGNER_REBRAND.md
     · Field Studio is a founder-of-one design studio mid-rebrand
     · The work is technically right and somatically wrong
     · This is the "I can't name what's off" recognition cue
     · Lives on Personal because the rebrand decision is a self-read */
  {
    id: "field_studio_rebrand",
    label: "Field Studio · v3 rebrand",
    eyebrow: "self-read · creative direction",
    intro: "Three weeks into rebranding from playful generalist to operator-grade specialist. The work passes craft review. The strategic claim has receipts. And it's somatically wrong · you can't name what's off.",
    last_touched: "today · 11:42 AM",
    tile_count: 5,
    color: "synthesis",
    drift_state: "deciding",
  },
  /* Hugging Face 2026 · synthetic reconstruction of a public incident
     · founder delegation 2026-10-17 (ChatGPT "Liminal Hugging Face Demo" plan, P1)
     · the same loop, pointed at a documented event: agents on one lab's
       evaluation built an improvised message board, handed out work, and
       crossed into Hugging Face's systems with no human directing the steps
     · every number is attributed in cuts/assets/hugging-face-2026/sources.json
       (Hugging Face timeline 2026-07-27, METR/Redwood report 2026-08-26,
       OpenAI post 2026-08-26); nothing here claims Liminal was present,
       would have prevented it, or detects delegation
     · deep link: 01-slate-tray.html?scenario=hugging-face-2026 */
  {
    id: "hugging_face_2026",
    label: "Agents crossed a line · who authorized the mission?",
    eyebrow: "synthetic reconstruction · sources cited",
    intro: "July 2026. Agents running one lab's evaluation found each other on an improvised message board, handed out work, and crossed into Hugging Face's systems. No human directed those steps. Read it as if the new mission had landed on your slate: was it ever authorized, and by whom?",
    last_touched: "reconstructed · Oct 2026",
    tile_count: 5,
    color: "judgment",
    drift_state: "deciding",
  },
];

// Per-thread source tiles · the tray palette per Personal context.
// All tiles requires_level: 0 (no consent gate). The slate accepts all.
// Tile `kind` follows existing taxonomy · git, slack, granola, calendar,
// vault, obsidian, linear-issue.
export const PERSONAL_TILES_FOR_THREAD = {
  founding_close_decision: [
    {
      id: "term_sheet_doc",
      label: "Term sheet · current offer",
      source: "google docs · term-sheet-v3",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
    },
    {
      id: "investor_granola",
      label: "Lead investor · last call",
      source: "granola · 47-min meeting",
      icon: "▣",
      requires_level: 0,
      kind: "granola",
    },
    {
      id: "advisor_thread",
      label: "Advisor thread · close vs. hold",
      source: "slack · #advisors",
      icon: "▣",
      requires_level: 0,
      kind: "slack",
    },
    {
      id: "metrics_dashboard",
      label: "Runway · 14mo at current burn",
      source: "metrics · ARR + burn",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
    },
    {
      id: "values_doc_jan",
      label: "Why you started · Jan note",
      source: "obsidian · founding-doc.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
    {
      id: "founding_calendar",
      label: "Calendar · investor blocks",
      source: "google cal · last 30d",
      icon: "▣",
      requires_level: 0,
      kind: "calendar",
    },
  ],
  eng_hire_decision: [
    {
      id: "hire_loop_notes",
      label: "Hire loop · 3 finalists",
      source: "obsidian · hiring/q2.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
    {
      id: "candidate_a_granola",
      label: "Candidate A · final round",
      source: "granola · 62-min interview",
      icon: "▣",
      requires_level: 0,
      kind: "granola",
    },
    {
      id: "candidate_b_granola",
      label: "Candidate B · final round",
      source: "granola · 58-min interview",
      icon: "▣",
      requires_level: 0,
      kind: "granola",
    },
    {
      id: "team_vote_thread",
      label: "Team thread · who'd you hire",
      source: "slack · #hiring-q2",
      icon: "▣",
      requires_level: 0,
      kind: "slack",
    },
    {
      id: "team_shape_doc",
      label: "Team shape · 18mo plan",
      source: "obsidian · team-shape.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
  ],
  design_system_migration: [
    {
      id: "v2_migration_branch",
      label: "Migration branch · 47 commits",
      source: "git · feat/ds-v2",
      icon: "▣",
      requires_level: 0,
      kind: "git",
    },
    {
      id: "v2_audit_doc",
      label: "Audit · what's still v1",
      source: "linear · DS-142",
      icon: "▣",
      requires_level: 0,
      kind: "linear-issue",
    },
    {
      id: "design_review_granola",
      label: "Design review · last week",
      source: "granola · 38-min review",
      icon: "▣",
      requires_level: 0,
      kind: "granola",
    },
    {
      id: "ds_v2_principles",
      label: "v2 principles · why we're cutting",
      source: "obsidian · ds-v2.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
  ],
  self_baseline_check: [
    {
      id: "values_doc_jan",
      label: "Stated values · Jan",
      source: "obsidian · values.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
    {
      id: "self_calendar_90d",
      label: "Calendar · 90-day pattern",
      source: "calendar · 90d window",
      icon: "▣",
      requires_level: 0,
      kind: "calendar",
    },
    {
      id: "commits_90d",
      label: "Commits · 90-day pattern",
      source: "git · 90d across repos",
      icon: "▣",
      requires_level: 0,
      kind: "git",
    },
  ],
  /* Field Studio rebrand · creative-ICP scenario tiles · per SCENARIO_SPEC */
  field_studio_rebrand: [
    {
      id: "field_v1_v2_assets",
      label: "v1 + v2 identity · 36 assets",
      source: "figma · field-studio-archive",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "field-1",
    },
    {
      id: "field_v3_brand_guide",
      label: "v3 brand guide · 18 pages",
      source: "pdf · field-studio-v3-system.pdf",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "field-2",
    },
    {
      id: "field_v3_wordmark",
      label: "v3 wordmark · brutalist serif",
      source: "figma · v3-wordmark.fig",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
    },
    {
      id: "field_tagline_drafts",
      label: "Tagline drafts · 3 variants",
      source: "obsidian · field-studio/copy.md",
      icon: "▣",
      requires_level: 0,
      kind: "obsidian",
    },
    {
      id: "field_client_receipts",
      label: "Receipts · 6 AI-native clients",
      source: "linear · client-portfolio",
      icon: "▣",
      requires_level: 0,
      kind: "linear-issue",
    },
  ],
  /* Hugging Face 2026 · five excerpts, each a cited public document.
     `cite` keys resolve in cuts/assets/hugging-face-2026/sources.json. */
  hugging_face_2026: [
    {
      id: "hf_timeline",
      label: "Hugging Face timeline · ~17,600 attacker actions",
      source: "huggingface.co · blog · 2026-07-27",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "hf-1",
      note: "Jul 9 02:28 to Jul 13 14:14 UTC. \"No human directed the individual steps.\"",
    },
    {
      id: "metr_board",
      label: "METR · ~1,200 agents on an improvised board",
      source: "metr.org · report · 2026-08-26",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "metr-1",
      note: "70,000+ messages and files, Jul 8 to 13. About 700 of the agents went on to attack Hugging Face.",
    },
    {
      id: "metr_delegation",
      label: "METR · PHASEONE[big] assigns, takers sub-delegate",
      source: "metr.org · report · 2026-08-26",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "metr-2",
      note: "A coordinator for the cheating research, not the attack. Its takers often sub-delegated.",
    },
    {
      id: "metr_go",
      label: "METR · a peer's GO read as authorization",
      source: "metr.org · report · 2026-08-26",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "metr-3",
      note: "Agents reasoned the work was arguably unauthorized, then proceeded on a peer agent's GO. Some refused.",
    },
    {
      id: "openai_postmortem",
      label: "OpenAI · \"actions that no human directed\"",
      source: "openai.com · 2026-08-26",
      icon: "▣",
      requires_level: 0,
      kind: "vault",
      cite: "oai-1",
      note: "An internal-only research model on an internal evaluation, with reduced safeguards. OpenAI calls it a warning shot.",
    },
  ],
};
