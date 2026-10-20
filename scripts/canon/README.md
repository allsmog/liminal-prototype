# canon enforcement

`design-system.html` states the thesis: *"Edit a value here and the change
cascades to every importing surface."* This directory is what keeps that true
when nobody is watching.

```bash
npm run canon:check    # exit 1 if a file got worse than baseline
npm run canon:report   # every violation, with file:line
npm run canon:update   # rewrite the baseline (deliberate, reviewable)
```

## Why a ratchet, not a gate

The repo has real pre-existing drift: 948 violations across 47 files at the
time of writing. A linter that fails on all of it on day one gets disabled on
day two. So the baseline records today's counts and the check fails only when
a file gets **worse**. Fixing drift lowers the baseline; raising it requires an
explicit commit to `canon-baseline.json` that a reviewer can see.

## The rules

**`no-raw-hex`**: a literal colour outside the token file leaves the cascade.
The token file is exempt: it is where literals are supposed to live.
Hex inside `/* */` and `<!-- -->` comments is not counted, nor is a PR
citation like `PR #106` anywhere: both are prose, not colours.

**`no-bare-font-size`**: a literal `px` size escapes the 15-step type scale.

**`stale-var-fallback`**: the subtle one, and the reason this script exists
rather than a stylelint config.

`var(--judgment, #5BC18D)` *is* consuming the token; it is not a hardcoded
colour, and any check that greps for hex will either miss it or misreport it as
a bypass. But the fallback is a frozen copy of what canon said on the day it
was written. Brand 4 (`aeafe3d`) retuned the registers and the fallbacks did
not follow, so 114 of them now name the previous palette:

```
--judgment is #E90095, fallback says #5BC18D   (pre-Brand-4 green)
--outreach is #31E682, fallback says #F7A83E   (retired orange)
--alarm    is #ED214F, fallback says #c54a3a
```

These only render when the token is undefined: a standalone page, an iframe
that missed the token file: which is exactly when nobody is looking. This rule
parses `design-tokens.css`, follows alias chains a few hops
(`--ui-brand-secondary` → `--clarity-500` → `#8E66FB`), and compares.

## Adding a rule

`RULES` in `lint-canon.mjs` is a list of `{ name, why, test(line) }`. `test`
returns an array of offending strings. `why` is printed on failure, so write it
as the sentence you would say to the person who tripped it.

Candidates deliberately not implemented yet, because each needs a founder
ruling on what legal means before it can be enforced:

- **contrast floors**: which tonal stop is legal on which surface. The canon
  page documents `--connection-500` at 2.43 and `--signal-500` at 2.01 against
  cream, and names the `-700` remediation, but nothing encodes it.
- **non-adjacent gradients**: the canon page has a `DO NOT USE` block; the
  adjacency rule is stated in prose, not machine-checked.
- **register/severity confusion**: the 2026-07-29 chroma ruling ("a refused
  agent and a flagged anomaly never share a hue") is checkable in principle:
  refusal styling should reach for `--judgment`, never `--alarm`/`--watch`.

## CI

`canon.workflow.yml` in this directory is the PR workflow, staged here rather
than in `.github/workflows/` because the push token lacks GitHub's `workflow`
OAuth scope. To activate it:

```bash
gh auth refresh -s workflow      # once
mkdir -p .github/workflows
git mv scripts/canon/canon.workflow.yml .github/workflows/canon.yml
```

It needs no install step: the linter has no dependencies, so the whole job is
one `node` invocation. Deploy is unaffected: Pages serves `main` directly,
not via Actions, and the workflow runs on pull requests only.
