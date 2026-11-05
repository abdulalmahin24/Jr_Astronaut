# Design: Jr_AstroCamp

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Workbench
- Theme: Rim (Aerospace Night Instrument)
- Axes: dark/grotesk-sans/warm · posture: committed

## Tokens
`src/tokens.css` is the source of truth. The roles:
```css
:root {
  --color-paper: oklch(9.5% 0.008 75);
  --color-paper-2: oklch(13% 0.012 75);
  --color-paper-3: oklch(7% 0.006 75);
  --color-ink: oklch(96% 0.010 80);
  --color-ink-2: oklch(86% 0.011 80);
  --color-muted: oklch(68% 0.012 80);
  --color-rule: oklch(24% 0.012 78);
  --color-accent: oklch(74% 0.18 48);       /* Artemis Solar Gold */
  --color-accent-ink: oklch(12% 0.02 48);   /* Dark text on Solar Gold CTA */
  --color-accent-2: oklch(76% 0.14 240);    /* Apollo Telemetry Blue */
  --color-accent-green: oklch(78% 0.15 150);/* Nominal Safe */
  --color-focus: oklch(78% 0.16 48);
  --font-display: "Space Grotesk", "Outfit", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-outlier: "JetBrains Mono", ui-monospace, monospace;
  --radius-card: 0px;
  --radius-pill: 0px;
  --rule-hair: 1px;
  --shadow-card: none;
}
```
The spacing scale, type scale, easings, and durations live in `src/tokens.css`.

## Controls
- Primary: Solar Gold fill (`--color-accent`) · 0px radius · 36px/40px height · high-contrast ink
- Secondary: Console card fill (`--color-paper-2`) · hairline border (`--color-rule`) · same height

## Motion
- Character: brisk, technical; zero layout shift; under reduced motion everything ends at once.

## Exports
`src/tokens.css` and `src/base.css` in this project.
