import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Tag } from "../../desktop/src/components/ui/Tag";

// Ported 2026-10-12 from the canon sheet (design-system/components/tags.css).
// Type, geometry and colour live in desktop's `tag` Panda recipe; these stories only pick variants.
// Tones bind to the canon --ui-state-* bindings; this recipe is their first product consumer.
const meta = { title: "ui/Tag", component: Tag } satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

const TONES = ["default", "success", "error", "warning", "info"] as const;

const Row = (props: { children: any }) => (
  <div style={{ display: "flex", "flex-wrap": "wrap", gap: "12px", "align-items": "center" }}>{props.children}</div>
);

const label = {
  "font-family": "var(--mono)",
  "font-size": "10px",
  "letter-spacing": "0.08em",
  "text-transform": "uppercase",
  color: "var(--text-faint)",
  "margin-bottom": "12px",
} as const;

/** The canon pill in every tone. The label states the status; colour never carries it alone. */
export const Tones: Story = {
  render: () => (
    <Row>
      {TONES.map((tone) => <Tag tone={tone}>{tone}</Tag>)}
    </Row>
  ),
};

/** Leading 5px dot in the tone colour (`.tag-dot` in the sheet). */
export const WithDot: Story = {
  render: () => (
    <Row>
      {TONES.map((tone) => <Tag tone={tone} dot>{tone}</Tag>)}
    </Row>
  ),
};

/** `box={false}`: the register eyebrow idiom. Same type, no chrome; tone still colours the text. */
export const Eyebrow: Story = {
  render: () => (
    <Row>
      <Tag box={false}>Founder · Personal</Tag>
      <Tag box={false} tone="error">Refused · Values</Tag>
      <Tag box={false} tone="warning" dot>Pending · Review</Tag>
      <Tag box={false} tone="success" dot>Sealed</Tag>
    </Row>
  ),
};

/** A register hue overrides `--tag-fg`, the way RefusalChip colours its REFUSED · <kind> label. */
export const RegisterHue: Story = {
  render: () => (
    <Row>
      <Tag box={false} style={{ "--tag-fg": "var(--diligence)" }}>Forensic · Diligence</Tag>
      <Tag box={false} style={{ "--tag-fg": "var(--outreach)" }}>SDR · Outreach</Tag>
      <Tag box={false} style={{ "--tag-fg": "var(--judgment)" }}>Auditor · Judgment</Tag>
    </Row>
  ),
};

/** The operator badge vocabulary after the fold: seven raw-hex states onto four tones. */
export const OperatorBadges: Story = {
  render: () => (
    <Row>
      <Tag tone="warning">underfunded</Tag>
      <Tag tone="warning">silent</Tag>
      <Tag tone="warning">unallocated</Tag>
      <Tag tone="info">overfunded</Tag>
      <Tag tone="info">trickle</Tag>
      <Tag tone="error">off_track</Tag>
      <Tag tone="error">$0 streak</Tag>
      <Tag tone="success">moving</Tag>
    </Row>
  ),
};

/** Same tones under the three density registers: padding and gap scale, type does not. */
export const Densities: Story = {
  render: () => (
    <div style={{ display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "24px" }}>
      {(["anointed", "shared", "analyst"] as const).map((density) => (
        <div data-density={density}>
          <div style={label}>{density}</div>
          <div style={{ display: "grid", gap: "8px", "justify-items": "start" }}>
            <Tag>default</Tag>
            <Tag tone="success" dot>verified</Tag>
            <Tag tone="warning" dot>pending</Tag>
            <Tag box={false} tone="error">Refused · Scope</Tag>
          </div>
        </div>
      ))}
    </div>
  ),
};
