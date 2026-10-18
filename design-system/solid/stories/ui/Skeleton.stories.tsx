import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Skeleton, SkeletonLine } from "../../desktop/src/components/ui/Skeleton";

// Ported 2026-09-22 from the canon sheet (design-system/components/empty-loading-skeleton.css).
// Geometry + motion live in desktop's `skeleton` Panda recipe; these stories only pick variants.
// Reduced motion is not a story: Storybook cannot flip the media query. The Argos/test-runner
// project with `reducedMotion: "reduce"` is where that state gets captured.
const meta = { title: "ui/Skeleton", component: Skeleton } satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Container carries the ARIA contract; every skeleton inside is aria-hidden. */
/** Lines carry no margin (ruled 2026-09-22); the consumer spaces them: 8px here, like the tray's slot cards. */
const Busy = (props: { children: any; width?: string }) => (
  <div role="status" aria-busy="true" aria-label="Loading" style={{ width: props.width ?? "320px", display: "grid", gap: "8px" }}>
    {props.children}
  </div>
);

export const Box: Story = {
  render: () => (
    <Busy>
      <Skeleton height="48px" />
    </Busy>
  ),
};

export const LineShort: Story = { render: () => <Busy><SkeletonLine width="short" /></Busy> };
export const LineMid: Story = { render: () => <Busy><SkeletonLine width="mid" /></Busy> };
export const LineLong: Story = { render: () => <Busy><SkeletonLine width="long" /></Busy> };

/** The sheet's intended composition: short (label) · long · mid (body). */
export const Paragraph: Story = {
  render: () => (
    <Busy>
      <SkeletonLine width="short" />
      <SkeletonLine width="long" />
      <SkeletonLine width="mid" />
    </Busy>
  ),
};

/** The tray read-slot shape from ExaminationLoading: three lines, sweep staggered 0/120/240 ms. */
export const Staggered: Story = {
  render: () => (
    <Busy>
      <SkeletonLine width="long" delay={0} />
      <SkeletonLine width="mid" delay={120} />
      <SkeletonLine width="long" delay={240} />
    </Busy>
  ),
};

/** The tray's candidate placeholders (TrayPop): three framed 92px tiles, staggered. */
export const Tiles: Story = {
  render: () => (
    <div role="status" aria-busy="true" aria-label="Loading" style={{ display: "grid", "grid-template-columns": "repeat(3, 1fr)", gap: "8px", width: "480px" }}>
      <Skeleton shape="tile" />
      <Skeleton shape="tile" delay={120} />
      <Skeleton shape="tile" delay={240} />
    </div>
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
  "margin-bottom": "12px",
} as const;

const DensitySample = (props: { density: "anointed" | "shared" | "analyst" }) => (
  <div>
    <div style={label}>{props.density}</div>
    <Busy>
      <SkeletonLine width="short" />
      <SkeletonLine width="long" />
      <SkeletonLine width="mid" />
    </Busy>
  </div>
);

/** anointed (--density-scale 1.10): spacing tokens scale up; the 12px line does not. */
export const DensityAnointed: Story = {
  globals: { density: "anointed" },
  render: () => <DensitySample density="anointed" />,
};

/** shared (--density-scale 1.00): the default register. */
export const DensityShared: Story = {
  globals: { density: "shared" },
  render: () => <DensitySample density="shared" />,
};

/** analyst (--density-scale 0.85): spacing tokens scale down; the 12px line does not. */
export const DensityAnalyst: Story = {
  globals: { density: "analyst" },
  render: () => <DensitySample density="analyst" />,
};
