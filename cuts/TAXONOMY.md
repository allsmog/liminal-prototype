# Cuts · the product taxonomy

> The cascade gives **one visual substrate, many cuts**. This doc gives the missing
> other half: **one product model, many cuts**, and it does NOT invent that model.
> It maps the prototype's cuts onto the company's already-canonical strategic ladder.

_v2 · 2026-06-16. Synthesis of two frames: the **coordinate mechanism** (how you
address a cut) and the **canonical strategic ladder** (what that address means).
Companion to `CONTRIBUTING.md` (the contract-block schema) and the cascade._

**Canonical sources (verified 2026-06-16, read directly: not secondhand):**
- `founder-brain/strategy/HARMONIZED_FRAME_AGENT_PROVENANCE_2026-06-12.md`: one substrate, three altitudes (**senior frame**; the altitude ladder binds here).
- `founder-brain/strategy/CANONICAL_POSITIONING_FRAME_2026-05-04.md`: the four-layer ladder + wedge-vs-category + (June-15 addendum) the wedge→platform framing rule.
- `founder-brain/strategy/THESIS_CONVERGENCE_2026-06-15.md`: newest; declares HARMONIZED_FRAME `parent_canon`, leaves the 3 altitudes **"Unchanged."** So this ladder is **bound-and-current, not stale.** It also sharpens the framing flag (below) into the raise's #1 objection.

**Re-sync clock:** re-check this binding after the **Speedrun cohort decision (~2026-07-27)**. That's the live clock, not the frames' `stale_after` dates (HARMONIZED 08-31, CONVERGENCE 08-15). If positioning moves at that gate, the altitude ladder + framing values need a re-sync.

---

## Why this exists

The repo enforced coherence on the **visual cascade** (`design-tokens.css → cut-shell.css → cut`)
and never on the **product model**. So a drifted *token* gets caught; a drifted
*product loop* does not: the capture→read→decide loop is re-implemented, slightly
differently, across ~8 cut files.

The symptom: "cut" silently absorbed four jobs (code / demo / product-idea /
audience), and the contract block's `ICP`/`Surface` fields became a junk drawer.

The deeper finding (v2): **the company already has a product taxonomy**. It's the
four-layer ladder in `CANONICAL_POSITIONING_FRAME`, one repo over. v1 of this doc
reinvented a generic PM ladder (`Journey/Feature/Flow`) from first principles. v2
discards the invention and uses the canonical ladder. The cuts have simply never
been mapped onto it. **That missing join is now written: `docs/CUT_CONSOLIDATION_MAP.md`
(2026-07-01): the ladder × fold × situation × divergence join cut 00 promised; binding
for the consolidation build.**

---

## The model: two things fused

A cut is **not a thing: it's a projection** of one product onto a viewing context.
The model has two halves that were previously conflated:

### Half 1 · The substrate invariant (what every cut shares)

There is **one Product**: Liminal. The desktop app, the marketing site, the natsec
build are not different products: they're the same product on different surfaces.
Positioning is explicit: natsec/OSINT is the **depth proof that the substrate
generalizes**, not a separate company.

The invariant is **the loop**: positioning's words, verbatim:

> *"Same loop: capture → read → decide → record, pointed at a [subject] first."*

This is **literally cut 00's code**: a `SUBJECTS = {spend, custody, osint, notice,
pattern}` object that one render loop reads. Positioning and the prototype
independently arrived at the same architecture. Cut 00 is the invariant made flesh.

```
Capture → Read → Decide → Record → Re-enter        ← the loop · the substrate
```

### Half 2 · The canonical ladder (what differentiates cuts), NOT flat, ORDERED

The thing that makes cuts *read* as different products is **altitude**, and
positioning already orders it. This is the canonical four-layer ladder, verbatim
from `CANONICAL_POSITIONING_FRAME` §"four-layer category ladder", cross-walked to
`HARMONIZED_FRAME`'s three altitudes:

```
L1  FOUNDER-OS          diffuse founder context → next move          [the wedge · front door]
L2  TEAM / OPERATOR     messy org context → coordinated judgment      [expansion]
L3  HIGH-STAKES         evidence · audit · constraints → judgment      [depth proof · "it travels"]
                        at the lever
L4  CATEGORY            judgment infrastructure for founders directing AI agents  ·  [the long game]
                        trusted context infrastructure for humans making
                        consequential decisions with AI
                        making consequential decisions with AI
```

Harmonized-frame cross-walk: **L1 = near-term wedge** · **L2–L3 = the depth/moat**
· **L4 = the long game (the ontology, PPA-filed).**

The v1 mistake: it treated `founder · operator · analyst · defense` as an *unordered*
audience list. They are **rungs**, not peers. Founder is the wedge; defense/analyst
is the proof the substrate travels. **Altitude replaces the old flat `Audience` field.**

### Half 3 · The framing flag (how a cut gets priced), NEW in v2

Positioning's load-bearing rule (June-15 addendum, verbatim):

> *"A founder who leads with the spend cockpit gets priced as a feature. A founder
> who leads with the verified-decision layer gets priced as infrastructure."*

So every cut carries a **framing flag**, is it being shown *as the wedge* (entered
here, priced as a feature) or *as the infrastructure* (the judgment layer, the
company)? Cut 11 (govern / AI-spend) is positioning's exact worked example of the
**wedge→infra seam**. This flag has no equivalent in v1 and is the second substantive
correction.

> **This flag is fundraise-critical, not cosmetic.** `THESIS_CONVERGENCE_2026-06-15`
> names the wedge→platform bridge as **the VC's #1 objection** and an OKR (O2/KR1), 
> *"judgment layer = company; spend = wedge; same loop."* So how cut 11 is framed in a
> demo is the raise's #1 objection in miniature: which is precisely why the
> demonstration strategy resolved to **cut-01-forward, shell as proof** (below):
> entered as founder-OS, priced as infrastructure.

---

## The coordinate (the addressing mechanism)

```
A cut = (Loop-stage)  ×  (Altitude)  ×  (Surface)  ×  (Framing)  ×  (Maturity)
        └─ substrate ─┘  └─ ordered ─┘  └ render ┘  └ pricing ┘   └─ state ─┘
           invariant       ladder        target       posture
```

Pick where on the loop, at which altitude, on which surface, framed how, at what
maturity: and render it for a viewing context. That's a cut. It's allowed to be
throwaway. The Product is not.

**Controlled vocabulary** (seed + allow additions: add a value with a one-line
justification in the commit; don't fork the model):

- **`loop-stage`**: `Capture` · `Read` · `Decide` · `Record` · `Re-enter` · `full-loop` · `pre-loop` (onboarding/entry)
- **`altitude`**: `L1-founder` · `L2-team` · `L3-high-stakes` · `L4-category` _(ordered; the canonical ladder)_
- **`surface`**: `desktop` · `embed` · `marketing` · `cli` · `mobile` _(only desktop + embed exist today)_
- **`framing`**: `wedge` (entered/priced as a feature) · `infra` (the judgment layer) · `wedge→infra` (the seam)
- **`maturity`**: `stub` · `sketch` · `refining` · `live`

Access tiers (pilot v0.1, invite-only) and *who-it's-shown-to* (investor, judge,
sponsor) are **per-cut notes, not coordinate fields**: they're viewing context, not
the cut's address.

---

## The map: every cut as a coordinate (verified placement)

> **Status lives in `cuts/cut-status.json`** (live / frozen / archive for every HTML surface under `cuts/`, machine-checked by `tests/cut-status.spec.js`). This table is the coordinate model for the main cuts and does not list every surface; the maturity column here is a coordinate, not a status.

| Cut | loop-stage | altitude | surface | framing | maturity | convergence verdict |
|---|---|---|---|---|---|---|
| **00 agency** | full-loop | L1–L4 (subject-switch) | desktop | infra | refining | **The shell.** Literally `SUBJECTS={spend,custody,osint,notice,pattern}`. The others are panes of this. |
| 01 slate-tray | Capture→Read→Decide | L1-founder | desktop | wedge | live | Canonical front door. The L1 reference render |
| 02 forensic | Read (contradiction) | L1-founder | desktop | wedge | refining | A Read-stage detail of L1 → cut-00 evidence pane candidate |
| 03 calibration | Record (over time) | L1→L2 | desktop | infra | refining | Record view; the "pattern" subject of cut 00 (moat made visible) |
| 04 onboarding | pre-loop (first-run) | L1-founder | desktop | wedge | live | First-touch; orthogonal (entry, not a loop subject). Access: pilot v0.1 |
| 06 margin-read | full-loop | L1-founder | desktop | wedge | refining | **The explanation layer.** The only cut whose subject is the marginalia: renders the loop as real UX, then narrates it with staged founder notes anchored to live elements. Refusal is the focal beat. (06 slot reused; old onboarding-06 archived → cut 04.) |
| 10 today | Re-enter | L1-founder | desktop | wedge | live | The Re-enter stage; closes the loop. Already thinks in coordinates. |
| 12 operating-plane | full-loop | L1-founder | desktop | wedge | sketch | The four-zone desktop plane (loop map, slate, agent workspace, intake dock) that cut 01's slate-tray unwinds into per FP-DESIGN. Shares altitude/surface/framing with cut 01, not loop-stage (cut 01 is Capture→Read→Decide detail; this is the full loop, plus Re-enter via the vault scene). Not a duplicate, the wider frame around the same wedge. |
| 11 govern | full-loop (agent fleet) | L1→L2 | desktop | **wedge→infra** | live | **The seam cut**, positioning's exact wedge→platform example (AI-spend) |
| 08 custody | full-loop (defense) | L3-high-stakes | desktop | infra | sketch | A subject of cut 00 (custody); proof-of-travel |
| 09 osint | full-loop (frozen kernel) | L3-high-stakes | desktop | infra | frozen | A subject of cut 00 (osint). **Permanently frozen** (LIM-1135, 2026-08-21): the kernel bundle still computes in-browser, but its source is gone and it is not rebuilt. Front door: "archived concept" |
| molehunt | full-loop (CI) | L3-high-stakes | desktop | infra | live | A subject, proof-of-travel (CI) |
| team-drift | Record/correct (team) | L2-team | desktop | infra | live | The L2 (team) render |

### What the map reveals

1. **Cut 00 is the convergence target made flesh.** Cuts 02/03/08/09/molehunt are
   already enumerated as `SUBJECTS` in cut 00's code. The prototype has half-built
   the collapse. The standalone cuts are the deep reference renders; cut 00 is the
   shell that proves they're one substrate.
2. **The L3 cluster (08, 09, molehunt) is the depth proof, not separate products**, 
   positioning closed this. They are subjects of one substrate, framed `infra`.
3. **Cut 11 is the only `wedge→infra` cut**: the literal pricing seam. Worth watching:
   how it's framed determines whether the demo gets priced as a feature or as the company.
4. **Altitude does the differentiating, and it's ordered** L1→L4: that ordering is
   the strategy (wedge → expansion → depth → category), not a flat tag.

---

## The convergence rule (the counter-force the architecture lacked)

The cascade is a **centrifuge with no centripetal rule**, CONTRIBUTING rules #1–4
let you fork framings cheaply. This is the centripetal rule:

> **Declare a new cut's coordinate before writing it. If it shares
> `(loop-stage, altitude, surface)` with an existing cut, it's a duplicate
> projection → merge or supersede, don't add a file. If it shares everything but
> `altitude` (i.e. it's the same loop at a different rung / for a different
> audience), it belongs as a PARAMETER on the existing surface. The cut-00
> "subject is a parameter" pattern: not a new file.**

`grep` declared coordinates the way you'd `grep` a hex value to catch a token that
should consume canon. The Substrate Console (`cuts/_console.html`) consumes these
coordinates as its grouping vocabulary.

---

## What this DOES decide

- **Demonstration strategy: DECIDED 2026-06-16: cut-01-forward, shell as proof.**
  The prototype leads with cut 01 (the founder front door, `live`); cut 00 sits
  behind it as the "same loop, every subject" infrastructure proof. This is the most
  literal expression of positioning's wedge→platform resolution: *entered as
  founder-OS, priced as infrastructure.* Applied in `index.html` (card order +
  framing) and noted in the Substrate Console masthead. Rejected: cut-00-forward
  (leads with an unfinished, abstract surface) and two-door-by-audience (maintains
  two front doors, dilutes the one-product story).

## What this does NOT decide (deliberately: these are gated elsewhere)

- **Who the first buyer is.** `HARMONIZED_FRAME` §"OPEN DECISION" rules this
  **discovery-gated: "NOT a whiteboard pick"** (4 options, deferred to discovery
  calls). This taxonomy is structured so it doesn't depend on the answer.
- **Whether to actually merge 00/08/09/11** into one parametric surface. The map
  makes it *addressable*; executing it is a larger product-build decision, and the
  product spine is `liminal-desktop` (Sean's lane). This doc maps demos to layers, 
  it does not propose product convergence on Sean's spine.
- **A shared product-behavior kernel** for all Journey cuts (cut 09 has one; the
  others re-implement inline). Enabled by this taxonomy, not done by it, see the
  console scope's "product-behavior coherence" deferred work.
