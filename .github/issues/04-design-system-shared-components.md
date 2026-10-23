# Issue #04: Design System — Shared Gaming UI Components

**Labels:** `design-system`, `ui`, `components`, `priority: critical`  
**Complexity:** High (200 points)  
**Milestone:** Sprint 1 — Foundation  
**Estimate:** 8–10 hours  
**Depends on:** #01

---

## Description

Build the reusable design system that establishes the **Cyberpunk 2077 × Apex Legends × Crypto Trading Platform** aesthetic across the entire dApp. This includes gaming-styled cards, animated counters, countdown timers, progress bars, buttons, inputs, toggles, tabs, badges, team badges, background effects, and HUD elements.

Every page and feature depends on these primitives. Contributors working on Issues #05–#16 will compose UIs from these building blocks.

**Why it matters:** Without a consistent, high-quality component library, each page will look different and the gaming aesthetic will be inconsistent. Centralizing these components also prevents duplication across issues worked on in parallel.

---

## Requirements and Context

### Components to Build

All components go in `components/shared/`. Each should accept a `className` prop for extension and support `prefers-reduced-motion` for accessibility.

---

#### 1. `GlowCard` — `components/shared/glow-card.tsx`

The foundational card used across the entire app.

- Angular/clipped corners via CSS `clip-path`
- Multiple border layers (inner + outer) with different opacities
- Animated neon border that pulses (configurable color)
- Holographic gradient overlay that shifts on hover (subtle `background-position` animation)
- Tech grid pattern background (subtle CSS background-image)
- Horizontal scan-line overlay animation
- Layered depth: inner shadow + outer glow

**Props:** `variant: 'default' | 'success' | 'danger' | 'gold'`, `glowColor?: string`, `animated?: boolean`, `className?: string`, `children: ReactNode`

---

#### 2. `AnimatedCounter` — `components/shared/animated-counter.tsx`

Slot-machine style number counter for stats and currency.

- Numbers roll/flip when value changes (animate from old → new)
- Glowing pulse effect when animation completes
- Shake effect on large value changes (>20% delta)
- Monospace font (`font-mono`)
- Currency formatting with `$` prefix

**Props:** `value: number`, `prefix?: string`, `suffix?: string`, `duration?: number`, `format: 'currency' | 'number' | 'compact'`

---

#### 3. `CountdownTimer` — `components/shared/countdown-timer.tsx`

Digital countdown with LED/segment display aesthetic.

- Shows days, hours, minutes, seconds
- Color transitions based on urgency:
    - `#00d9ff` (cyan) — safe: >1 hour
    - `#ffd700` (gold/yellow) — warning: 15–60 min
    - `#ff006e` (magenta) — urgent: 5–15 min
    - Pulsing magenta + "⚠" icon — critical: <5 min
- Glowing text-shadow matching current color
- Tick animation on each second change

**Props:** `targetTime: string`, `label?: string`, `onExpire?: () => void`, `size: 'sm' | 'md' | 'lg'`, `compact?: boolean`

---

#### 4. `GamingButton` — `components/shared/gaming-button.tsx`

Primary action button with full gaming treatment.

- Angular/beveled edges via `clip-path`
- Multiple border layers with inner + outer glow
- Animated background gradient (slow sweep)
- Text: letter-spacing, text-shadow (neon glow)
- **Hover:** scale(1.05), intense glow, subtle rotate(1deg), shine sweep (linear gradient animation)
- **Active/Click:** scale(0.95), shockwave ripple effect
- **Loading:** rotating hexagon spinner with particle trail
- **Disabled:** dimmed opacity, no glow, cursor-not-allowed

**Variants:** `primary` (cyan), `success` (green), `danger` (magenta), `gold`, `ghost` (outline)  
**Sizes:** `sm`, `md`, `lg`  
**Props:** `variant`, `size`, `loading?: boolean`, `disabled?: boolean`, `onClick`, `children`, `className`

---

#### 5. `PoolProgressBar` — `components/shared/pool-progress-bar.tsx`

Dual-sided pool distribution visualization.

- Thick bar with inner glow
- Animated fill with gradient flow
- Segment ticks at 25%, 50%, 75%
- Spark/energy effect at fill edge
- Left side = Yes (cyan), Right side = No (magenta)
- Labels: percentages + dollar amounts above/below bar

**Props:** `yesPercentage: number`, `yesAmount: number`, `noAmount: number`, `animated?: boolean`, `size: 'sm' | 'md' | 'lg'`

---

#### 6. `BadgeComponent` — `components/shared/badge-component.tsx`

Achievement/rank badge with gaming flair.

- Hexagonal frame with glowing border
- Military-style icon inside (stripes, stars, shield)
- Float/pulse animation (subtle)
- Holographic shine on hover

**Props:** `type: 'achievement' | 'rank' | 'streak' | 'win' | 'loss'`, `label: string`, `icon?: ReactNode`, `variant: 'success' | 'danger' | 'neutral' | 'gold'`

---

#### 7. `TeamBadge` — `components/shared/team-badge.tsx`

Hexagonal team logo/color display.

- Hexagonal frame with glowing border
- Team primary color as fill or border tint
- Float/pulse animation
- Holographic shine on hover

**Props:** `team: Team`, `size: 'sm' | 'md' | 'lg'`

---

#### 8. `GamingInput` — `components/shared/gaming-input.tsx`

Styled input field for the gaming aesthetic.

- Glowing border that intensifies on focus
- Placeholder with typing cursor animation
- Numeric mode: +/- stepper buttons with click feedback
- Error state: red glow + shake animation
- Angular styling consistent with theme

**Props:** `type: 'text' | 'number'`, `value`, `onChange`, `prefix?: string`, `suffix?: string`, `error?: string`, `placeholder`, `min?`, `max?`

---

#### 9. `GamingTabs` — `components/shared/gaming-tabs.tsx`

Tab navigation with glowing indicators.

- Active tab: glowing underline/overline (animated sliding indicator)
- Hover: preview glow effect
- Smooth slide indicator between tabs on switch
- Count badge support per tab

**Props:** `tabs: Array<{ key: string; label: string; count?: number }>`, `activeTab: string`, `onChange: (key: string) => void`

---

#### 10. `ToggleSwitch` — `components/shared/toggle-switch.tsx`

Yes/No toggle with gaming feel.

- Chunky design with satisfying snap animation (Framer Motion `spring`)
- Glow color changes: cyan (Yes) ↔ magenta (No)
- Electric arc/spark effect on toggle (brief flash)

**Props:** `value: 'yes' | 'no'`, `onChange: (value: 'yes' | 'no') => void`, `labels?: [string, string]`, `size: 'sm' | 'md' | 'lg'`

---

#### 11. `BackgroundEffects` — `components/shared/background-effects.tsx`

Global ambient background layer.

- Animated starfield / particle system (CSS or lightweight canvas)
- Subtle floating geometric shapes (hexagons, triangles)
- Neon grid lines (subtle football field pattern)
- Gradient mesh that shifts slowly
- **Performance:** use CSS animations or `requestAnimationFrame`, respect `prefers-reduced-motion`
- Renders behind all content (`position: fixed`, `z-index: -1`)

---

#### 12. `AchievementToast` — `components/shared/achievement-toast.tsx`

Game-style achievement notification.

- Slide in from top-right with trail effect
- Icon + title + XP-style progress animation
- Auto-dismiss after 3 seconds
- Gaming card aesthetic (glow border, dark bg)

**Props:** `title: string`, `description?: string`, `icon: ReactNode`, `xp?: number`

---

#### 13. `GlowIcon` — `components/shared/glow-icon.tsx`

Wrapper for Lucide icons with gaming treatment.

- Outlined style with inner glow effect (text-shadow / filter)
- Animated on hover: rotate, pulse, or float
- Configurable glow color

**Props:** `icon: LucideIcon`, `color?: string`, `size?: number`, `animated?: boolean`

---

### Shared CSS Utility Classes — add to `globals.css`

```css
.scan-lines       /* horizontal scan line overlay */
.glow-text-cyan   /* neon text glow — cyan */
.glow-text-green  /* neon text glow — green */
.glow-text-magenta /* neon text glow — magenta */
.glow-text-gold   /* neon text glow — gold */
.clip-corners     /* angular corner clip-path */
.holo-gradient    /* holographic gradient overlay */
.grid-bg          /* tech grid pattern */
.vignette         /* darkened corners */
.energy-shield    /* pulsing shield around high-value elements */
```

> **Status:** only `.glow-text-cyan` is in `app/globals.css` today. The rest were added without call sites and later removed (#367); re-add one alongside the component that uses it.

---

## Suggested Execution

1. **Create branch**

    ```bash
    git checkout -b feat/design-system
    ```

2. **Start with `GlowCard`** — it's used by every other component and page

3. **Build utility CSS classes** in `globals.css` — glow, scan-lines, clip-corners, etc.

4. **Build simple components:** `GlowIcon`, `BadgeComponent`, `TeamBadge`

5. **Build interactive components:** `GamingButton`, `GamingInput`, `ToggleSwitch`, `GamingTabs`

6. **Build data-display components:** `AnimatedCounter`, `CountdownTimer`, `PoolProgressBar`

7. **Build ambient components:** `BackgroundEffects`, `AchievementToast`

8. **Create a `/dev` page** (or Storybook equivalent) rendering every component with various props for visual QA

**Example commit message:**

```
feat: design system — 13 gaming-styled shared components
```

---

## Acceptance Criteria

- [ ] All 13 components listed above are implemented and exported
- [ ] Every component accepts `className` for extension
- [ ] `GlowCard` renders with animated glow border, scan lines, holographic hover
- [ ] `AnimatedCounter` rolls numbers like a slot machine on value change
- [ ] `CountdownTimer` counts down every second with correct color transitions
- [ ] `GamingButton` has hover scale + glow, click ripple, loading spinner, disabled state
- [ ] `PoolProgressBar` shows dual-sided Yes/No with animated fill and spark
- [ ] `ToggleSwitch` snaps between Yes/No with color change and arc effect
- [ ] `BackgroundEffects` renders particle/starfield behind content without blocking interaction
- [ ] All animations respect `prefers-reduced-motion` media query
- [ ] Shared CSS utility classes are available globally
- [ ] Components render correctly on mobile (320px+) and desktop (1440px+)
- [ ] No hydration mismatches (all random/animated values are client-side only)

---

## Guidelines

- **PR description must include:** `Closes #4`
- **Include screenshots/gifs** of each component in the PR for visual review
- Use Framer Motion for complex animations (spring physics, layout), CSS for simple ones
- Prefer `box-shadow` and `text-shadow` over `filter` for glow effects (performance)
- Do NOT use real data — use hardcoded demo values for showcasing components
- Components should be composable — accept `children` where appropriate
- Keep bundle size reasonable — no heavy animation libraries beyond Framer Motion
