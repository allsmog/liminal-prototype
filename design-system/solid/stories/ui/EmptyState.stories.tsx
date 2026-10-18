import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { EmptyState } from "../../desktop/src/components/ui/EmptyState";

// Ported 2026-09-22 to the `emptyState` slot recipe. Two registers, founder-ruled:
// chrome (default, what shipped) and canon (the design-system sheet). The Density* stories show
// both registers under each of the three spacing scales.
const meta = { title: "ui/EmptyState", component: EmptyState } satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

const Frame = (props: { children: any }) => <div style={{ width: "360px" }}>{props.children}</div>;

export const ChromeTitleOnly: Story = { render: () => <Frame><EmptyState title="nothing in the tray" /></Frame> };
export const ChromeWithHint: Story = {
  render: () => <Frame><EmptyState title="nothing in the tray" hint="drop context to start a read" /></Frame>,
};
export const ChromeWithAction: Story = {
  render: () => (
    <Frame>
      <EmptyState
        title="no packets yet"
        hint="the vault fills as you sign"
        action={{ label: "open the slate", onClick: () => {} }}
      />
    </Frame>
  ),
};

export const CanonTitleOnly: Story = { render: () => <Frame><EmptyState register="canon" title="Nothing in the tray" /></Frame> };
export const CanonWithHint: Story = {
  render: () => (
    <Frame>
      <EmptyState register="canon" title="Nothing in the tray" hint="Drop context to start a read." />
    </Frame>
  ),
};
export const CanonWithAction: Story = {
  render: () => (
    <Frame>
      <EmptyState
        register="canon"
        title="No packets yet"
        hint="The vault fills as you sign."
        action={{ label: "open the slate", onClick: () => {} }}
      />
    </Frame>
  ),
};

// Density is read where canon reads it: design-tokens.css sets --density-scale only on
// `body[data-density=…]`, so a per-element data-density wrapper changes nothing. Each story pins
// the gallery's `density` global; preview.tsx's withRegister decorator writes it to <body>, and
// also to its own wrapper div (for desktop Panda's element-agnostic `[data-density]` rule, which
// this repo cannot see), so the sample needs no data-density attribute of its own.
// One story per register, so each Argos snapshot carries a genuinely different scale.
const label = {
  "font-family": "var(--mono)",
  "font-size": "var(--fs-mono-xs)",
  "letter-spacing": "0.08em", // no canon token at 0.08em; matches the sibling reference labels
  "text-transform": "uppercase",
  color: "var(--text-faint)",
} as const;

const DensitySample = (props: { density: "anointed" | "shared" | "analyst" }) => (
  <div style={{ width: "360px", display: "grid", gap: "16px" }}>
    <div style={label}>{props.density}</div>
    <EmptyState title="nothing in the tray" hint="drop context to start a read" />
    <EmptyState register="canon" title="Nothing in the tray" hint="Drop context to start a read." />
  </div>
);

/** anointed (--density-scale 1.10): both registers; only spacing tokens scale up. */
export const DensityAnointed: Story = {
  globals: { density: "anointed" },
  render: () => <DensitySample density="anointed" />,
};

/** shared (--density-scale 1.00): the default register. */
export const DensityShared: Story = {
  globals: { density: "shared" },
  render: () => <DensitySample density="shared" />,
};

/** analyst (--density-scale 0.85): both registers; only spacing tokens scale down. */
export const DensityAnalyst: Story = {
  globals: { density: "analyst" },
  render: () => <DensitySample density="analyst" />,
};
