import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Tag } from "../../desktop/src/components/ui/Tag";
// The canon sheet, verbatim, as text. Its selectors (`.tag`, `.tag-dot`, `.tag-success`…) would
// collide with the class the Panda recipe emits (`.tag`), so the sheet is scoped to `.ref-tag…`
// before injection. Tokens (--frame-bg-2, --ui-state-*, --fs-mono-xs, --ls-mono-sm) come from the
// page's design-tokens.css, desktop's synced canon copy.
import sheet from "../../../components/tags.css?raw";
import { scopeSheet } from "./scope";

const scoped = scopeSheet(sheet);

const meta = { title: "reference/Tag" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const TONES = ["default", "success", "error", "warning", "info"] as const;

const label = {
  "font-family": "var(--mono)",
  "font-size": "var(--fs-mono-xs)",
  "letter-spacing": "0.08em", // no canon token at 0.08em; matches the sibling reference labels
  "text-transform": "uppercase",
  color: "var(--text-faint)",
  "margin-bottom": "12px",
} as const;

const column = { display: "grid", gap: "12px", "justify-items": "start", "align-content": "start" } as const;

/**
 * Port (desktop `tag` recipe) beside Reference (canon sheet markup + CSS), tone by tone, then with
 * the dot. `data-panel` marks each side for the reference-delta spec.
 */
export const PortVsReference: Story = {
  render: () => (
    <>
      <style>{scoped}</style>
      <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "32px", width: "560px" }}>
        <section data-panel="port" style={column}>
          <div style={label}>port · desktop recipe</div>
          {TONES.map((tone) => <Tag tone={tone}>{tone}</Tag>)}
          {TONES.map((tone) => <Tag tone={tone} dot>{tone}</Tag>)}
        </section>
        <section data-panel="reference" style={column}>
          <div style={label}>reference · canon sheet</div>
          {TONES.map((tone) => <span class={`ref-tag${tone === "default" ? "" : ` ref-tag-${tone}`}`}>{tone}</span>)}
          {TONES.map((tone) => <span class={`ref-tag ref-tag-dot${tone === "default" ? "" : ` ref-tag-${tone}`}`}>{tone}</span>)}
        </section>
      </div>
    </>
  ),
};
