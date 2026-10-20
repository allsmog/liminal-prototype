#!/usr/bin/env node
/* lint-canon.mjs · the canon holds even when nobody is holding it
 * ════════════════════════════════════════════════════════════════════════
 *
 * PROBLEM · design-system.html states the thesis plainly: "Edit a value here
 * and the change cascades to every importing surface." That promise is only
 * true for surfaces that actually consume tokens. Where a literal is baked in,
 * the cascade silently stops: retune `clarity` on the canon page and the
 * surface-nav brand glyph does NOT follow. Nothing in the repo prevented that
 * from happening, so it happened.
 *
 * APPROACH · a RATCHET, not a gate. The repo has real, pre-existing drift; a
 * linter that fails on all of it on day one gets disabled on day two. So we
 * record today's counts as a baseline and fail only when a file gets WORSE.
 * Fixing drift lowers the baseline (run --update); nothing can raise it
 * without an explicit, reviewable commit to the baseline file.
 *
 * NO NEW DEPENDENCIES · this repo is deliberately no-build (PRODUCT.md: "the
 * public, no-build, click-able catalog"), and its one existing script,
 * scripts/tokens/sync-upstream.mjs, is plain Node. stylelint would have meant
 * a toolchain the repo has so far refused. Same idiom instead.
 *
 * USAGE
 *   node scripts/canon/lint-canon.mjs            · check (exit 1 on regression)
 *   node scripts/canon/lint-canon.mjs --update   · rewrite the baseline
 *   node scripts/canon/lint-canon.mjs --report   · full violation listing
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASELINE = join(ROOT, "scripts", "canon", "canon-baseline.json");

/* ─── what the canon exempts ──────────────────────────────────────────────
   The token file is where literals are SUPPOSED to live. It is the source
   the cascade flows from. Everything downstream should be var(). */
const EXEMPT = [
  "design-system/tokens/design-tokens.css",
  /* The semantic half of the same source (--fg-*, --surface-*, --type-*,
     --brand-*), shipped here 2026-08-02. Exempt for the identical reason as
     the line above: it is upstream of the cascade, not downstream of it, and
     it arrives byte-identical from canon: a literal in it cannot be "fixed"
     locally without forking the file the drift guard exists to keep in
     lockstep. Its declarations do consume the wheel (`--brand-primary:
     var(--wholeness)`); the hexes this rule sees are in trailing comments
     documenting what those vars resolve to. */
  "design-system/tokens/colors-and-type.css",
];

/* Specimen and atlas pages exist to SHOW raw values; a hex in a swatch label
   is the content, not drift. */
const EXEMPT_DIRS = ["design-system/atlas/", "_baseline/", "_archive/", "node_modules/"];

/* ─── the token map · what canon currently says ───────────────────────────
   Parsed from the token file so the fallback rule below can compare a frozen
   literal against the live value. Follows var() indirection a few hops, since
   canon aliases heavily (--ui-brand-secondary → --clarity-500 → #8E66FB). */
function tokenMap() {
  const src = readFileSync(join(ROOT, EXEMPT[0]), "utf8");
  const raw = {};
  for (const m of src.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gim)) {
    raw[m[1]] = m[2].trim();
  }
  const resolve = (name, depth = 0) => {
    const v = raw[name];
    if (!v || depth > 4) return null;
    const alias = v.match(/^var\(\s*(--[a-z0-9-]+)/i);
    return alias ? resolve(alias[1], depth + 1) : v;
  };
  const out = {};
  for (const k of Object.keys(raw)) out[k] = resolve(k);
  return out;
}
const TOKENS = tokenMap();

/* ─── rules ───────────────────────────────────────────────────────────────
   Each rule: a name, a matcher over one line, and why it matters. Kept
   deliberately few: a rule nobody understands is a rule nobody keeps. */
const RULES = [
  {
    name: "no-raw-hex",
    why: "a literal colour leaves the cascade · use the canon token",
    /* Skips url(#...) SVG refs, &#123; entities, and var() fallbacks. The
       last of those ARE consuming the token and get their own rule below.
       Conflating the two was the mistake that sent an audit chasing
       "hardcoded colours" in a file that had none.
       Reads the comment-masked line (see maskComments): "#106" is a valid
       3-digit hex AND the usual way prose cites a PR, and the PR citations
       vastly outnumber colours in this repo's comments. The same citation in
       a runtime string ("defect PR #106 had to repair") is skipped by the
       PR-reference strip. Before this, PRs 140 and 143 had to spell
       "PR 106" to keep a comment from failing the ratchet. */
    masked: true,
    test(line) {
      const stripped = line
        .replace(/\b(?:PRs?|pull request|issue)\s*#\d+\b/gi, "")
        .replace(/url\(#[^)]*\)/g, "")
        .replace(/&#\d+;/g, "")
        .replace(/var\(\s*--[a-z0-9-]+\s*,\s*#[0-9A-Fa-f]{3,8}\s*\)/gi, "");
      return [...stripped.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)].map(m => m[0]);
    },
  },
  {
    name: "stale-var-fallback",
    why: "the fallback froze an old value · it renders canon's past when the token is missing",
    test(line) {
      const out = [];
      for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,\s*(#[0-9A-Fa-f]{3,8})\s*\)/gi)) {
        const [, name, fallback] = m;
        const current = TOKENS[name];
        if (!current || !/^#[0-9A-Fa-f]{3,8}$/.test(current)) continue;
        if (current.toLowerCase() !== fallback.toLowerCase()) {
          out.push(`${name} is ${current}, fallback says ${fallback}`);
        }
      }
      return out;
    },
  },
  {
    name: "no-bare-font-size",
    why: "a literal size escapes the type scale · use a --fs-* token",
    test(line) {
      if (/--fs-|--text-|:root/.test(line)) return [];
      return [...line.matchAll(/font-size:\s*([0-9.]+)px/g)].map(m => m[0]);
    },
  },
];

/* ─── file walk ───────────────────────────────────────────────────────── */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    const rel = relative(ROOT, full).split("\\").join("/");
    if (EXEMPT_DIRS.some(d => rel.startsWith(d) || rel.includes("/" + d))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(css|html)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

/* Blank out /* *\/ and <!-- --> comments, keeping every newline so line
   numbers still point at the source. Only rules marked `masked` read this. */
function maskComments(text) {
  const blank = s => s.replace(/[^\n]/g, " ");
  return text.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/<!--[\s\S]*?-->/g, blank);
}

/* ─── scan ────────────────────────────────────────────────────────────── */
function scan() {
  const findings = {};
  for (const rel of walk(ROOT).sort()) {
    if (EXEMPT.includes(rel)) continue;
    const text = readFileSync(join(ROOT, rel), "utf8");
    const lines = text.split("\n");
    const masked = maskComments(text).split("\n");
    lines.forEach((line, i) => {
      for (const rule of RULES) {
        for (const hit of rule.test(rule.masked ? masked[i] : line)) {
          (findings[rel] ??= {});
          (findings[rel][rule.name] ??= []).push({ line: i + 1, hit: hit.trim() });
        }
      }
    });
  }
  return findings;
}

function counts(findings) {
  const out = {};
  for (const [file, rules] of Object.entries(findings)) {
    out[file] = {};
    for (const [rule, hits] of Object.entries(rules)) out[file][rule] = hits.length;
  }
  return out;
}

/* ─── main ────────────────────────────────────────────────────────────── */
const args = new Set(process.argv.slice(2));
const findings = scan();
const now = counts(findings);
const total = Object.values(now).reduce(
  (a, r) => a + Object.values(r).reduce((b, n) => b + n, 0), 0);

if (args.has("--report")) {
  for (const [file, rules] of Object.entries(findings)) {
    console.log(`\n${file}`);
    for (const [rule, hits] of Object.entries(rules)) {
      console.log(`  ${rule} · ${hits.length}`);
      for (const h of hits) console.log(`    ${file}:${h.line}  ${h.hit}`);
    }
  }
  console.log(`\ntotal · ${total} violations across ${Object.keys(now).length} files`);
  process.exit(0);
}

if (args.has("--update")) {
  writeFileSync(BASELINE, JSON.stringify(now, null, 2) + "\n");
  console.log(`canon · baseline written · ${total} known violations across ${Object.keys(now).length} files`);
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error("canon · no baseline. Run: node scripts/canon/lint-canon.mjs --update");
  process.exit(1);
}

const base = JSON.parse(readFileSync(BASELINE, "utf8"));
const regressions = [];
const improvements = [];

for (const [file, rules] of Object.entries(now)) {
  for (const [rule, n] of Object.entries(rules)) {
    const was = base[file]?.[rule] ?? 0;
    if (n > was) regressions.push({ file, rule, was, now: n });
  }
}
for (const [file, rules] of Object.entries(base)) {
  for (const [rule, was] of Object.entries(rules)) {
    const n = now[file]?.[rule] ?? 0;
    if (n < was) improvements.push({ file, rule, was, now: n });
  }
}

for (const i of improvements) {
  console.log(`canon · improved · ${i.file} · ${i.rule} · ${i.was} → ${i.now}`);
}

if (regressions.length) {
  console.error("\ncanon · NEW drift · the cascade stops wherever these literals sit:\n");
  for (const r of regressions) {
    const rule = RULES.find(x => x.name === r.rule);
    const hits = findings[r.file][r.rule];
    console.error(`  ${r.file}`);
    console.error(`    ${r.rule} · ${r.was} → ${r.now} · ${rule.why}`);
    /* Counts are all the baseline knows, so we cannot say WHICH hit is new.
       Dump every one and a 16-hit file buries the single line that broke the
       build: which is how a linter earns its way into someone's ignore list.
       Show the tail (new lines are usually appended) and say what was held back. */
    const SHOW = 6;
    const shown = hits.slice(-SHOW);
    if (hits.length > SHOW) console.error(`      … ${hits.length - SHOW} earlier, unchanged`);
    for (const h of shown) console.error(`      :${h.line}  ${h.hit}`);
  }
  console.error(`\nFix them, or if this is deliberate and reviewed:`);
  console.error(`  node scripts/canon/lint-canon.mjs --update\n`);
  process.exit(1);
}

if (improvements.length) {
  console.log(`\ncanon · ${improvements.length} file/rule pair(s) improved · lower the baseline with --update`);
}
console.log(`canon · clean · no new drift · ${total} known violations held at baseline`);
