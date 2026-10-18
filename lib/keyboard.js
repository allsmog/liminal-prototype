/* keyboard.js · unified keyboard shortcut layer + help overlay
 *
 * ⌘. tray · ⌘N notes · ⌘Z undo · ⌘Enter confirm · ⌘D defer
 * ⌘1/⌘2/⌘3 surface · ⌘[/⌘] prev/next context · ⌘? help · Esc close
 *
 * Consumers pass a ctx object with the actions this layer triggers.
 * No state imports needed except activeProductId for the prev/next sibling lookup.
 */
import { PERSONAL_THREADS } from "../data/personal.js";
import { TEAM_SUBJECTS } from "../data/team.js";
import { BUSINESS_SCENARIOS } from "../data/business.js";
import { SAMSEED_SUBJECTS } from "../data/sam-seed.js";
import { activeProductId, activeContextId } from "./state.js";

function siblingContexts() {
  if (activeProductId === "personal") {
    /* same visibility rule as boot.js renderPersonalRail: scenario-only
       threads join the cycle only when their ?scenario= key is in the URL */
    const key = new URLSearchParams(location.search).get("scenario") || "";
    return PERSONAL_THREADS.filter(t => !t.scenario_only || t.scenario_only === key).map(t => t.id);
  }
  if (activeProductId === "team")     return TEAM_SUBJECTS.map(s => s.id);
  if (activeProductId === "business") return BUSINESS_SCENARIOS.map(s => s.id);
  if (activeProductId === "sam-seed") return SAMSEED_SUBJECTS.map(s => s.id);
  return [];
}

export function openKbdHelp() {
  document.getElementById("kbd-help").hidden = false;
}
export function closeKbdHelp() {
  document.getElementById("kbd-help").hidden = true;
}

export function wireKeyboard(ctx) {
  /* help overlay close affordances */
  document.getElementById("kbd-close")?.addEventListener("click", closeKbdHelp);
  document.getElementById("kbd-hint")?.addEventListener("click", openKbdHelp);
  document.getElementById("kbd-help")?.addEventListener("click", (ev) => {
    if (ev.target.id === "kbd-help") closeKbdHelp();
  });

  /* tray toggle · ⌘. or Ctrl+. · also Esc closes tray when open */
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ".") {
      e.preventDefault();
      ctx.toggleTray();
    }
    if (e.key === "Escape" && document.querySelector(".stage").classList.contains("tray-open")) {
      ctx.toggleTray();
    }
  });

  /* notes toggle · ⌘N */
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n" && !e.shiftKey) {
      e.preventDefault();
      document.getElementById("notes-toggle")?.click();
    }
  });

  /* vault reset · ⌘⇧R · per UI_GAP_SPEC §3.2 ("the user is in control")
     · confirms before clearing · refreshes vault count */
  document.addEventListener("keydown", async (e) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    if (!e.shiftKey) return;
    if (e.key.toLowerCase() !== "r") return;
    e.preventDefault();
    const ok = window.confirm(
      "Reset vault?\n\n" +
      "This clears all corrections, decisions, and metadata stored in this " +
      "browser's IndexedDB. The action cannot be undone.\n\n" +
      "Continue?"
    );
    if (!ok) return;
    try {
      const vs = await import("./vault-store.js");
      await vs.clear();
      const evt = new CustomEvent("liminal:toast", {
        detail: "Vault reset · IndexedDB cleared · device-local"
      });
      window.dispatchEvent(evt);
      /* refresh the visible vault count if we have access · invoke ctx if exposed */
      if (ctx.refreshVaultCount) ctx.refreshVaultCount();
    } catch (err) {
      console.warn("[keyboard] vault reset failed", err);
      const evt = new CustomEvent("liminal:toast", {
        detail: "Vault reset failed · IndexedDB unavailable"
      });
      window.dispatchEvent(evt);
    }
  });

  /* main shortcut layer */
  document.addEventListener("keydown", (e) => {
    if (e.target.matches?.("input, textarea, [contenteditable='true']")) return;

    const meta = e.metaKey || e.ctrlKey;
    const k = e.key;

    /* ⌘? · open keyboard help · also Esc closes */
    if (meta && (k === "?" || (e.shiftKey && k === "/"))) {
      e.preventDefault();
      const help = document.getElementById("kbd-help");
      if (help.hidden) openKbdHelp();
      else closeKbdHelp();
      return;
    }
    if (k === "Escape" && !document.getElementById("kbd-help").hidden) {
      e.preventDefault();
      closeKbdHelp();
      return;
    }

    if (!meta) return;

    if (k.toLowerCase() === "z" && !e.shiftKey) {
      e.preventDefault();
      ctx.undo();
      return;
    }

    if (k === "Enter") {
      const briefVisible = !document.getElementById("brief-area").hidden;
      if (!briefVisible) return;
      e.preventDefault();
      document.getElementById("dispo-primary").click();
      return;
    }

    if (k.toLowerCase() === "d") {
      const briefVisible = !document.getElementById("brief-area").hidden;
      if (!briefVisible) return;
      e.preventDefault();
      document.getElementById("dispo-defer").click();
      return;
    }

    if (k === "1") { e.preventDefault(); ctx.setProduct("personal"); return; }
    if (k === "2") { e.preventDefault(); ctx.setProduct("team");     return; }
    if (k === "3") { e.preventDefault(); ctx.setProduct("business"); return; }

    if (k === "[" || k === "]") {
      e.preventDefault();
      const ids = siblingContexts();
      if (ids.length === 0) return;
      const i = Math.max(0, ids.indexOf(activeContextId));
      const delta = k === "[" ? -1 : +1;
      const next = ids[(i + delta + ids.length) % ids.length];
      if (next !== activeContextId) ctx.setContext(next);
    }
  });
}
