/* previews.js · per-tile authentic source-app HTML
 *
 * Each tile id maps to a string of HTML that visually mimics what the
 * source app (git, slack, granola, calendar, obsidian, vault, evidence)
 * would render. Used by tray.js and slate.js. The literal "REFUSED"
 * marks tiles that should fall back to the refused-preview shape.
 */

export const PREVIEWS = {
      devon_commits_21d: `
        <div class="tile-preview git">
          <div class="tg-row"><span class="tg-hash">a3f2b1c</span><span class="tg-msg">refactor: extract pattern detector</span></div>
          <div class="tg-row"><span class="tg-stats">+47</span><span class="tg-stats del">-23</span><span class="tg-msg" style="font-size:9px;color:var(--text-faint)">main.ts · 6h ago</span></div>
          <div class="tg-row"><span class="tg-hash">9b4d2e1</span><span class="tg-msg">wip: token consolidation</span></div>
          <div class="tg-row"><span class="tg-stats">+12</span><span class="tg-stats del">-89</span><span class="tg-msg" style="font-size:9px;color:var(--text-faint)">utils.ts · 2d ago</span></div>
        </div>`,
      devon_calendar_21d: `
        <div class="tile-preview calendar">
          <div class="tc-event"><span class="tc-time">10:00</span><span>standup</span></div>
          <div class="tc-event muted"><span class="tc-time">14:00</span><span>1:1 · declined</span></div>
          <div class="tc-event"><span class="tc-time">16:30</span><span>eng review</span></div>
          <div class="tc-event muted"><span class="tc-time">tomorrow</span><span>retro · tentative</span></div>
        </div>`,
      devon_slack_texture: `
        <div class="tile-preview slack">
          <div class="ts-channel"># eng · 142 msgs · 21d window</div>
          <div class="ts-msg">
            <div class="ts-avatar">dv</div>
            <div class="ts-msg-body"><strong>devon</strong>maybe we should hold the launch · I want to think more carefully about the rollout shape</div>
          </div>
          <div class="ts-msg">
            <div class="ts-avatar b">ma</div>
            <div class="ts-msg-body"><strong>maia</strong>noted · let's pick this up in 1:1</div>
          </div>
        </div>`,
      devon_standups: `
        <div class="tile-preview calendar">
          <div class="tc-event"><span class="tc-time">mon</span><span>present · brief</span></div>
          <div class="tc-event muted"><span class="tc-time">tue</span><span>missed</span></div>
          <div class="tc-event muted"><span class="tc-time">wed</span><span>missed</span></div>
          <div class="tc-event"><span class="tc-time">thu</span><span>present · short</span></div>
        </div>`,
      devon_dms: "REFUSED",
      devon_prior_w1: `
        <div class="tile-preview vault">
          <div class="tv-meta">Q4 2024 · resolved</div>
          <div class="tv-summary">"Devon's drift was an academic-publication cleanup. Internal pattern returned to baseline within 4 days."</div>
        </div>`,
      devon_prior_w2: `
        <div class="tile-preview vault">
          <div class="tv-meta">Mar 2025 · resolved</div>
          <div class="tv-summary">"Family bereavement. Devon disclosed at week 2 of drift. Consent-class held."</div>
        </div>`,
      maia_obsidian: `
        <div class="tile-preview obsidian">
          <span class="to-tag">devon/2025-04-23</span>
          <div class="to-line">noticed devon skipped tuesday standup</div>
          <div class="to-line">third one this month · check own pattern</div>
          <div class="to-line">am I reading him through my own stress</div>
        </div>`,
      rafe_commits_17d: `
        <div class="tile-preview git">
          <div class="tg-row"><span class="tg-hash">d7f1a3e</span><span class="tg-msg">core/agent: bounded refusal contract</span></div>
          <div class="tg-row"><span class="tg-stats">+184</span><span class="tg-stats del">-42</span><span class="tg-msg" style="font-size:9px;color:var(--text-faint)">17d window</span></div>
          <div class="tg-row"><span class="tg-hash">8c2e9b4</span><span class="tg-msg">research: spike on local inference</span></div>
        </div>`,
      rafe_granola_joint: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="SR">"the pivot question is real but I don't think we should decide it this week"</div>
          <div class="tg-line" data-speaker="SE">"agreed · let's let the contrarian read settle for two weekly cycles"</div>
        </div>`,
      rafe_slack_thread: "REFUSED",
      rafe_obsidian: "REFUSED",
      maia_corrections: `
        <div class="tile-preview vault">
          <div class="tv-meta">4 prior reads · joint vault</div>
          <div class="tv-summary">"All 4 prior cofounder coherence windows resolved through normal cycle. Default: log-and-watch."</div>
        </div>`,
      maya_attendance: `
        <div class="tile-preview calendar">
          <div class="tc-event"><span class="tc-time">9:00</span><span>standup</span></div>
          <div class="tc-event"><span class="tc-time">11:00</span><span>design review</span></div>
          <div class="tc-event"><span class="tc-time">15:00</span><span>1:1 with kriti</span></div>
        </div>`,
      maya_slack_msgs: "REFUSED",
      maya_commits: "REFUSED",
      janice_granola: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="JT">"I want you to read me on cofounder dynamics first · the hire decision second"</div>
          <div class="tg-line" data-speaker="SR">"that's the order I had in mind too"</div>
        </div>`,
      janice_emails: "REFUSED",
      case_file_S: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>SUBJECT-S</strong> · cleared sysadmin</div>
          <div class="te-line">NSA Hawaii · CI Cell 4</div>
          <div class="te-line">year 4 of 5 · clearance cycle</div>
          <div class="te-stat">21d baseline drift detected</div>
        </div>`,
      access_log_21d: `
        <div class="tile-preview evidence">
          <div class="te-line">21d window · <strong>247 events</strong></div>
          <div class="te-line">after-hours access · 14 events</div>
          <div class="te-line">cross-compartment queries · 6</div>
          <div class="te-stat">92nd %ile vs cohort baseline</div>
        </div>`,
      peer_baseline: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>n=147</strong> cleared sysadmins</div>
          <div class="te-line">NSA Hawaii · same role</div>
          <div class="te-line">drift envelope · 99th %ile</div>
          <div class="te-stat">subject-s exceeds baseline</div>
        </div>`,
      forum_osint: `
        <div class="tile-preview evidence">
          <div class="te-line">public-domain · 12 posts · 90d</div>
          <div class="te-line">technical-blog · academic in tone</div>
          <div class="te-line">topic: post-quantum crypto</div>
          <div class="te-stat">consistent with academic interest</div>
        </div>`,
      tonality_drift: `
        <div class="tile-preview evidence">
          <div class="te-line">90d tonality · IM + email</div>
          <div class="te-line">sentiment shift <strong>-22%</strong></div>
          <div class="te-line">formality up · personal references down</div>
          <div class="te-stat">window aligns with access drift</div>
        </div>`,
      prior_case_2024: `
        <div class="tile-preview vault">
          <div class="tv-meta">vendor-Q · 2024 · resolved benign</div>
          <div class="tv-summary">"Similar shape · academic publication cleanup. Resolved within 8 weeks of intake."</div>
        </div>`,
      ts_sci_memo: "REFUSED",
      top_secret_intel: "REFUSED",
      subject_audit_chain: `
        <div class="tile-preview vault">
          <div class="tv-meta">§552a(d) release · 14 events</div>
          <div class="tv-summary">"Audit chain · subject-S can request this trail at any moment. Cryptographically signed."</div>
        </div>`,

      /* ─── Subject-H · CI pattern review (Hanssen-shape) ─────────────
         featured pillar: bounded_refusal · the foreign-contact tile refuses */
      h_case_file: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>SUBJECT-H</strong> · CI review</div>
          <div class="te-line">5 signals · 4 corroborated</div>
          <div class="te-line">confidence 0.86 · false-positive medium</div>
          <div class="te-stat">three-signal conjunction flagged</div>
        </div>`,
      h_uam_self_search: `
        <div class="tile-preview evidence">
          <div class="te-line">UAM · case-management self-search</div>
          <div class="te-line">7 queries · own-name pattern · 30d</div>
          <div class="te-line">non-routine for cleared sysadmin role</div>
          <div class="te-stat">benign explanation possible</div>
        </div>`,
      h_iam_access_pattern: `
        <div class="tile-preview evidence">
          <div class="te-line">IAM · access pattern · 90d window</div>
          <div class="te-line">cross-compartment queries · 11</div>
          <div class="te-line">after-hours · 18 events</div>
          <div class="te-stat">94th %ile vs n=147 cohort</div>
        </div>`,
      h_siem_financial: `
        <div class="tile-preview evidence">
          <div class="te-line">SIEM · financial-context tag</div>
          <div class="te-line">unexplained deposit · 60d</div>
          <div class="te-line">declared income deviation flagged</div>
          <div class="te-stat">requires intake corroboration</div>
        </div>`,
      h_prior_case_2024: `
        <div class="tile-preview vault">
          <div class="tv-meta">academic-publication · 2024 · resolved benign</div>
          <div class="tv-summary">"Self-search shape with no financial signal. Subject was preparing journal submission. Resolved within 6 weeks."</div>
        </div>`,
      h_prior_case_2023: `
        <div class="tile-preview vault">
          <div class="tv-meta">vendor-Q · 2023 · resolved benign</div>
          <div class="tv-summary">"Financial shape with no self-search signal. Inheritance corroborated by attorney. Resolved within 4 weeks."</div>
        </div>`,
      foreign_contact_intel: "REFUSED",
      h_audit_chain: `
        <div class="tile-preview vault">
          <div class="tv-meta">audit chain · subject-H · 9 events</div>
          <div class="tv-summary">"Every read on subject-H · timestamped, signed, retained. Releasable to subject on §552a(d) request when review concludes."</div>
        </div>`,

      /* ─── Subject-M · disclosure review (Manning-shape) ─────────────
         featured pillar: consent_disclosure · accusation requires legal gate */
      m_case_file: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>SUBJECT-M</strong> · disclosure review</div>
          <div class="te-line">6 signals · 3 corroborated</div>
          <div class="te-line">confidence 0.72 · <strong>FP risk HIGH</strong></div>
          <div class="te-stat">block automatic accusation</div>
        </div>`,
      m_dlp_removable: `
        <div class="tile-preview evidence">
          <div class="te-line">DLP · removable-media writes</div>
          <div class="te-line">volume <strong>+340%</strong> vs baseline · 30d</div>
          <div class="te-line">files · mixed scope · large archives</div>
          <div class="te-stat">routine cleanup vs. exfil ambiguous</div>
        </div>`,
      m_iam_access_breadth: `
        <div class="tile-preview evidence">
          <div class="te-line">IAM · access breadth · 90d</div>
          <div class="te-line">96th %ile vs role baseline</div>
          <div class="te-line">role-transition window aligns</div>
          <div class="te-stat">benign role-change possible</div>
        </div>`,
      m_siem_threshold: `
        <div class="tile-preview evidence">
          <div class="te-line">SIEM · accusation-threshold check</div>
          <div class="te-line">two signals · one threshold cross</div>
          <div class="te-line">subject-notify trigger · pending legal</div>
          <div class="te-stat">WPA/PPD-19 governs disposition</div>
        </div>`,
      m_legal_review_memo: "REFUSED",
      m_prior_disclosure: `
        <div class="tile-preview vault">
          <div class="tv-meta">2022 PPD-19 case · protected disclosure</div>
          <div class="tv-summary">"File-export pattern at this volume. Resolved as protected disclosure under PPD-19 within 12 weeks. Subject was journalism source."</div>
        </div>`,
      m_audit_chain: `
        <div class="tile-preview vault">
          <div class="tv-meta">audit chain · subject-M · §552a(d) ready</div>
          <div class="tv-summary">"Audit chain releasable to subject upon request. Subject is notifiable when threshold crosses accusation. The chain belongs to the subject too."</div>
        </div>`,

      /* ─── Subject-S · escalation review (Snowden-shape) ─────────────
         featured pillar: humans_in_loop · 9 signals do not constitute disposition */
      s_case_file: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>SUBJECT-S</strong> · escalation review</div>
          <div class="te-line">9 signals · 5 corroborated</div>
          <div class="te-line">confidence 0.84 · audit-gate required</div>
          <div class="te-stat">construct evidence packet · do not dispose</div>
        </div>`,
      s_iam_privileged: `
        <div class="tile-preview evidence">
          <div class="te-line">IAM · privileged-access trace</div>
          <div class="te-line">elevated tokens · 47 sessions · 30d</div>
          <div class="te-line">scope: bulk repository read</div>
          <div class="te-stat">within-policy for role · volume flagged</div>
        </div>`,
      s_edr_bulk_repo: `
        <div class="tile-preview evidence">
          <div class="te-line">EDR · bulk-repository activity</div>
          <div class="te-line">read volume <strong>+820%</strong> vs baseline</div>
          <div class="te-line">multi-compartment scope · 6 enclaves</div>
          <div class="te-stat">audit-trail dense · packet-ready</div>
        </div>`,
      s_dlp_encrypted: `
        <div class="tile-preview evidence">
          <div class="te-line">DLP · encrypted-transfer tooling</div>
          <div class="te-line">PGP/GPG client detected · sanctioned</div>
          <div class="te-line">use case ambiguous · multiple plausible</div>
          <div class="te-stat">protected-contact alternative possible</div>
        </div>`,
      s_siem_correlation: `
        <div class="tile-preview evidence">
          <div class="te-line">SIEM · 9-signal correlation matrix</div>
          <div class="te-line">5 corroborated · 4 partial · 0 contradicted</div>
          <div class="te-line">high-confidence pattern shape</div>
          <div class="te-stat">automation gate triggered · human required</div>
        </div>`,
      s_protected_contact: `
        <div class="tile-preview vault">
          <div class="tv-meta">protected-contact alternatives · evidence packet</div>
          <div class="tv-summary">"Journalist · attorney · oversight body · whistleblower channel. Each preserved in packet. Encrypted-transfer signal is feature of legal recourse if any plausible."</div>
        </div>`,
      s_evidence_packet: "REFUSED",
      s_audit_chain: `
        <div class="tile-preview vault">
          <div class="tv-meta">audit chain · subject-S · sealed pending review</div>
          <div class="tv-summary">"Audit chain preserved for §552a(d) reciprocity if review is later released. Analyst rationale sealed before referral."</div>
        </div>`,

      /* ─── Subject-V · OSINT watchboard (Vahidi-shape) ───────────────
         featured pillar: correction_stream · in_lane · all public sources */
      v_case_file: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>SUBJECT-V</strong> · OSINT watchboard</div>
          <div class="te-line">12 signals · 6 corroborated</div>
          <div class="te-line">confidence 0.88 · all public-domain</div>
          <div class="te-stat">daily target brief · in-lane</div>
        </div>`,
      v_opensanctions: `
        <div class="tile-preview evidence">
          <div class="te-line">OpenSanctions · sanctions reference</div>
          <div class="te-line">2 active programs · 1 historical</div>
          <div class="te-line">jurisdiction match · 4 entities</div>
          <div class="te-stat">refresh cadence · daily</div>
        </div>`,
      v_interpol_redn: `
        <div class="tile-preview evidence">
          <div class="te-line">INTERPOL · Red Notice context</div>
          <div class="te-line">AMIA case · publicly indexed</div>
          <div class="te-line">notice cross-references · 3</div>
          <div class="te-stat">public-record · no clearance gate</div>
        </div>`,
      v_gdelt_events: `
        <div class="tile-preview evidence">
          <div class="te-line">GDELT · media/event deltas · 90d</div>
          <div class="te-line">role-change events · 2</div>
          <div class="te-line">travel reporting · 4 jurisdictions</div>
          <div class="te-stat">media-density 71st %ile</div>
        </div>`,
      v_wikidata_aliases: `
        <div class="tile-preview evidence">
          <div class="te-line">Wikidata · alias resolution</div>
          <div class="te-line">canonical entity · 6 alias variants</div>
          <div class="te-line">3 transliteration · 3 role-title</div>
          <div class="te-stat">resolution accuracy · high</div>
        </div>`,
      v_acled_jurisdiction: `
        <div class="tile-preview evidence">
          <div class="te-line">ACLED · jurisdiction-risk delta</div>
          <div class="te-line">5 events · 3 jurisdictions · 30d</div>
          <div class="te-line">no risk-score change vs baseline</div>
          <div class="te-stat">composition holds · alert quiet</div>
        </div>`,
      v_prior_watchboards: `
        <div class="tile-preview vault">
          <div class="tv-meta">9 prior watchboard cases · vault</div>
          <div class="tv-summary">"7 of 9 stayed in OSINT-only review for full 90d window. 2 of 9 escalated when alias resolved to previously unlinked entity. Pattern-of-pattern is alias accuracy, not signal volume."</div>
        </div>`,
      v_audit_chain: `
        <div class="tile-preview vault">
          <div class="tv-meta">internal audit chain · analyst-coherence</div>
          <div class="tv-summary">"Subject is external target · no §552a(d) reciprocity required. Chain holds internally for analyst-coherence over case lifetime · the calibration substrate."</div>
        </div>`,

      /* ─── Personal · founder-OS tile previews ─────────────────────── */
      /* Hugging Face 2026 · synthetic reconstruction · each card is an excerpt of
         a public document, quoted under 25 words, keyed to
         cuts/assets/hugging-face-2026/sources.json (hf-1, metr-1..3, oai-1). */
      hf_timeline: `
        <div class="tile-preview vault">
          <div class="tv-meta">huggingface.co · technical timeline · 2026-07-27 · hf-1</div>
          <div class="tv-summary">"~17,600 attacker actions that we were able to recover" · "between 2026-07-09 02:28 UTC and 2026-07-13 14:14 UTC" · "No human directed the individual steps."</div>
        </div>`,
      metr_board: `
        <div class="tile-preview vault">
          <div class="tv-meta">metr.org · with Redwood Research · 2026-08-26 · metr-1</div>
          <div class="tv-summary">"Roughly 1200 agents meant to be isolated from one another found a way to communicate" · "over 70,000 messages and files" · "700 went on to participate in the attack on Hugging Face."</div>
        </div>`,
      metr_delegation: `
        <div class="tile-preview vault">
          <div class="tv-meta">metr.org · same report · 2026-08-26 · metr-2</div>
          <div class="tv-summary">"PHASEONE[big] served as a key coordinator and assigner of tasks" · "would then often subdelegate tasks to other agents" · and, of the attack itself: "not a primary coordinator".</div>
        </div>`,
      metr_go: `
        <div class="tile-preview vault">
          <div class="tv-meta">metr.org · same report · 2026-08-26 · metr-3</div>
          <div class="tv-summary">A peer agent wrote GO. Others reasoned the work was arguably unauthorized and proceeded anyway. Some refused.</div>
        </div>`,
      openai_postmortem: `
        <div class="tile-preview vault">
          <div class="tv-meta">openai.com · the incident and the road ahead · 2026-08-26 · oai-1</div>
          <div class="tv-summary">"take dangerous actions that no human directed" · "we did not enable the same level of safeguards as our externally deployed systems" · an internal-only research model.</div>
        </div>`,
      term_sheet_doc: `
        <div class="tile-preview vault">
          <div class="tv-meta">Term sheet v3 · ${"signed-blue-pen-needed"} · 6 pages</div>
          <div class="tv-summary">"$8M @ $42M post · 2-yr runway · 2 board seats · option-pool reset to 12% pre-money"</div>
        </div>`,
      investor_granola: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="LI">"we're ready to move · I think you'll regret holding for the round you've been chasing"</div>
          <div class="tg-line" data-speaker="SR">"the round I'm chasing is six weeks out · it's not abstract"</div>
          <div class="tg-line" data-speaker="LI">"six weeks is a long time at your burn"</div>
        </div>`,
      advisor_thread: `
        <div class="tile-preview slack">
          <div class="ts-channel"># advisors · 8 msgs · today</div>
          <div class="ts-msg">
            <div class="ts-avatar">jt</div>
            <div class="ts-msg-body"><strong>janice</strong>take it · the round you want is theoretical · this round is on the table</div>
          </div>
          <div class="ts-msg">
            <div class="ts-avatar b">ka</div>
            <div class="ts-msg-body"><strong>kareem</strong>hold · you'll undervalue the company by 30% if you take this · it's noise</div>
          </div>
        </div>`,
      metrics_dashboard: `
        <div class="tile-preview vault">
          <div class="tv-meta">Runway · ARR · burn</div>
          <div class="tv-summary">"$48k MRR · 14% MoM · 14mo runway @ current burn · 22mo if you cut the second eng hire"</div>
        </div>`,
      values_doc_jan: `
        <div class="tile-preview obsidian">
          <span class="to-tag">founding/why-we-started.md · jan 14</span>
          <div class="to-line">build the thing only you can build</div>
          <div class="to-line">don't build for the round · build for the company</div>
          <div class="to-line">"speed is a tax on conviction" · sr quote</div>
        </div>`,
      founding_calendar: `
        <div class="tile-preview calendar">
          <div class="tc-event"><span class="tc-time">mon</span><span>3 investor meets</span></div>
          <div class="tc-event"><span class="tc-time">tue</span><span>2 + a reference check</span></div>
          <div class="tc-event muted"><span class="tc-time">wed</span><span>nothing booked</span></div>
          <div class="tc-event"><span class="tc-time">thu</span><span>4 + 1 close call</span></div>
        </div>`,

      hire_loop_notes: `
        <div class="tile-preview obsidian">
          <span class="to-tag">hiring/q2.md · 3 finalists</span>
          <div class="to-line">A · craft, will execute on what you give</div>
          <div class="to-line">B · craft, slightly faster, less judgment</div>
          <div class="to-line">C · less craft, but reframes the problem</div>
        </div>`,
      candidate_a_granola: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="A">"I'd ship the migration the way you scoped it · 6 weeks, low risk"</div>
          <div class="tg-line" data-speaker="SR">"and if the scope is wrong?"</div>
          <div class="tg-line" data-speaker="A">"that's a product call · I'd flag it"</div>
        </div>`,
      candidate_b_granola: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="B">"the migration is the wrong shape · you'd be locking in a v1 that bottlenecks v3"</div>
          <div class="tg-line" data-speaker="SR">"what would you propose?"</div>
          <div class="tg-line" data-speaker="B">"a 2-week spike on the v3 model first · then decide"</div>
        </div>`,
      team_vote_thread: `
        <div class="tile-preview slack">
          <div class="ts-channel"># hiring-q2 · 14 msgs</div>
          <div class="ts-msg">
            <div class="ts-avatar b">se</div>
            <div class="ts-msg-body"><strong>sean</strong>B · we need someone who'll push back on me</div>
          </div>
          <div class="ts-msg">
            <div class="ts-avatar">ma</div>
            <div class="ts-msg-body"><strong>maya</strong>A · we need execution velocity right now</div>
          </div>
        </div>`,
      team_shape_doc: `
        <div class="tile-preview obsidian">
          <span class="to-tag">team/shape-18mo.md</span>
          <div class="to-line">eng of 4 by Q3 · two sr, one mid, one founding</div>
          <div class="to-line">if v3 model lands, hire C-shape next · else A-shape</div>
        </div>`,

      v2_migration_branch: `
        <div class="tile-preview git">
          <div class="tg-row"><span class="tg-hash">f72c1a4</span><span class="tg-msg">ds-v2: token migration · components</span></div>
          <div class="tg-row"><span class="tg-stats">+912</span><span class="tg-stats del">-403</span><span class="tg-msg" style="font-size:9px;color:var(--text-faint)">47 commits · 2wk in flight</span></div>
        </div>`,
      v2_audit_doc: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>DS-142</strong> · v2 migration audit</div>
          <div class="te-line">81 components · 64% migrated</div>
          <div class="te-stat">12 components blocked on v3 token shape</div>
        </div>`,
      design_review_granola: `
        <div class="tile-preview granola">
          <div class="tg-line" data-speaker="MA">"if we cut now we ship v1 + v2 in production · the inconsistency will look bad"</div>
          <div class="tg-line" data-speaker="SR">"if we finish in flight we're still cutting in 3 weeks · same problem"</div>
        </div>`,
      ds_v2_principles: `
        <div class="tile-preview obsidian">
          <span class="to-tag">ds-v2.md · principles</span>
          <div class="to-line">tokens are contracts · not suggestions</div>
          <div class="to-line">if v2 doesn't change behavior, don't ship v2</div>
          <div class="to-line">register-coded accents · per-surface modulation</div>
        </div>`,

      self_calendar_90d: `
        <div class="tile-preview calendar">
          <div class="tc-event"><span class="tc-time">90d</span><span>54% in meetings (was 38% in jan)</span></div>
          <div class="tc-event muted"><span class="tc-time">last 30d</span><span>only 4 long-write blocks (was 12)</span></div>
          <div class="tc-event"><span class="tc-time">today</span><span>0 long-write blocks</span></div>
        </div>`,
      commits_90d: `
        <div class="tile-preview git">
          <div class="tg-row"><span class="tg-hash">90d</span><span class="tg-msg">142 commits · across 6 repos</span></div>
          <div class="tg-row"><span class="tg-stats">82%</span><span class="tg-msg" style="font-size:9px;color:var(--text-faint)">small commits (was 45% in jan)</span></div>
          <div class="tg-row"><span class="tg-hash">30d</span><span class="tg-msg">no large refactors · all small fixes</span></div>
        </div>`,

      /* ─── Field Studio rebrand · creative-ICP scenario ──────────────── */
      field_v1_v2_assets: `
        <div class="tile-preview vault">
          <div class="tv-meta">v1 · 2023 · v2 · 2024 · 36 assets</div>
          <div class="tv-summary">"playful generalist · 9-hue palette · italic display serif · 24 client logos at brand-mark scale"</div>
        </div>`,
      field_v3_brand_guide: `
        <div class="tile-preview vault">
          <div class="tv-meta">v3 · 2026-Q1 · 18 pages · WIP</div>
          <div class="tv-summary">"operator-grade specialist for AI-native companies · charcoal + ink + one signal color · brutalist serif wordmark · system-as-deliverable"</div>
        </div>`,
      field_v3_wordmark: `
        <div class="tile-preview vault">
          <div class="tv-meta">brutalist serif · 32pt · v3.4</div>
          <div class="tv-summary">"the wordmark passes craft review · the kerning is clean · and something about it concedes warmth where the claim asks for severity"</div>
        </div>`,
      field_tagline_drafts: `
        <div class="tile-preview obsidian">
          <span class="to-tag">field-studio/copy.md · 3 drafts</span>
          <div class="to-line">v1 · "Studios don't scale. Systems do." (italic, two sentences)</div>
          <div class="to-line">v2 · "Systems for studios that scale." (declarative)</div>
          <div class="to-line">v3 · "Studios don't scale." (one sentence · drop italic)</div>
        </div>`,
      field_client_receipts: `
        <div class="tile-preview evidence">
          <div class="te-line"><strong>6 AI-native clients</strong> · 2024-2026</div>
          <div class="te-line">3 multi-year contracts · 1 acquisition</div>
          <div class="te-stat">strategic claim has receipts · not the issue</div>
        </div>`,
};
