---
name: Cybernetic Void
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1b1b1b'
  surface-container: '#1f1f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#dcbed4'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#303030'
  outline: '#a4899d'
  outline-variant: '#564052'
  surface-tint: '#ffabf3'
  primary: '#ffabf3'
  on-primary: '#5b005b'
  primary-container: '#ff00ff'
  on-primary-container: '#510051'
  inverse-primary: '#a900a9'
  secondary: '#ffffff'
  on-secondary: '#323200'
  secondary-container: '#eaea00'
  on-secondary-container: '#686800'
  tertiary: '#00dbe9'
  on-tertiary: '#00363a'
  tertiary-container: '#00a1ab'
  on-tertiary-container: '#003033'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd7f5'
  primary-fixed-dim: '#ffabf3'
  on-primary-fixed: '#380038'
  on-primary-fixed-variant: '#810081'
  secondary-fixed: '#eaea00'
  secondary-fixed-dim: '#cdcd00'
  on-secondary-fixed: '#1d1d00'
  on-secondary-fixed-variant: '#494900'
  tertiary-fixed: '#7df4ff'
  tertiary-fixed-dim: '#00dbe9'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#131313'
  on-background: '#e2e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system is built upon a "Cyber-Minimalist" philosophy, blending the starkness of absolute black with the high-energy vibration of neon accents. It targets a sophisticated, tech-forward audience that values precision, speed, and a futuristic aesthetic.

The visual language utilizes **Absolute Black** as a canvas to create an infinite sense of depth, allowing UI elements to appear as if they are floating in digital space. We leverage **Glassmorphism** for structural layering and **High-Contrast** accents for critical interactions. The emotional response is one of "calculated power"—it feels like a high-end terminal from the near future: efficient, glowing, and undeniably premium.

## Colors
This design system operates on an absolute dark foundation. 

- **Backgrounds:** Use `#000000` (Pure Black) for the primary workspace to maximize OLED efficiency and contrast.
- **Primary Accent:** `Neon Magenta (#FF00FF)` is reserved for primary actions, critical path UI, and active states.
- **Secondary Accent:** `Neon Yellow (#FFFF00)` is used for warnings, highlights, and data-driven insights.
- **Tertiary Accent:** A subtle `Cyan (#00F0FF)` may be used for secondary data points or success states to maintain the "cyber" palette.
- **Surfaces:** Use `#111111` for cards and containers, often with a 20-40% opacity blur to create the glass effect against the pure black background.

## Typography
The typography strategy prioritizes high legibility against dark backgrounds using a hierarchy of three distinct fonts:

1.  **Display & Headlines (Sora):** A geometric sans-serif that feels futuristic and bold. Used for major titles and impactful statements.
2.  **Body & UI (Inter):** A systematic, highly legible sans-serif for all functional text, descriptions, and inputs.
3.  **Labels & Metadata (Space Mono):** A monospaced font used for "system-level" information, code snippets, and technical labels to reinforce the AI/Developer aesthetic.

Always ensure a minimum contrast ratio of 7:1 for body text. Use pure white (#FFFFFF) for headlines and light gray (#E0E0E0) for long-form body text to reduce eye strain.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px square rhythm. 

- **Desktop:** 12-column grid with wide 40px margins to allow the "void" (black space) to breathe.
- **Tablet:** 8-column grid with 24px margins.
- **Mobile:** 4-column grid with 16px margins.

Spacing should be generous between sections to emphasize the minimalist aesthetic. Use "Inner Padding" of 24px-32px for glass containers to ensure content doesn't feel cramped against the glowing borders.

## Elevation & Depth
In this design system, depth is not created with traditional shadows, but through **light emission and transparency**:

1.  **Level 0 (Floor):** Pure Black `#000000`.
2.  **Level 1 (Containers):** Semi-transparent Glass. Background: `rgba(255, 255, 255, 0.05)`, Backdrop Blur: `12px`, Border: `1px solid rgba(255, 255, 255, 0.1)`.
3.  **Level 2 (Active Elements):** Primary Magenta Glow. Surfaces that are active should have a `0px 0px 15px rgba(255, 0, 255, 0.4)` outer glow.
4.  **Floating Elements:** Elements like tooltips or modals use a darker, more opaque surface (`#1A1A1A`) with a crisp `Neon Yellow` top border (2px).

## Shapes
The shape language is "Technical-Soft." We avoid aggressive rounding (pill shapes) to maintain a serious, architectural feel. 

- **Standard Elements:** (Inputs, Small Cards) 4px border radius.
- **Large Containers:** 8px border radius.
- **Interactive Triggers:** Buttons use a slightly more pronounced 6px radius to differentiate them from static containers.
- **Accents:** Use 45-degree chamfered corners (clipped corners) on decorative elements to suggest a "military-grade" or "space-age" interface.

## Components
- **Buttons:** Primary buttons are solid `#FF00FF` with `#000000` text. Secondary buttons are ghost-style with a `1px` Magenta border and a faint hover glow.
- **Input Fields:** Absolute black background with a `1px` border of `rgba(255, 255, 255, 0.2)`. On focus, the border transitions to `#FFFF00` (Neon Yellow) with a subtle outer glow.
- **Cards:** Glassmorphic surfaces with a 1px top-left highlight border to simulate a light source.
- **Chips/Tags:** Monospaced text using `Space Mono`. Tags are always outlined, never solid, to maintain a lightweight feel.
- **Progress Bars:** Use a dual-gradient from Magenta to Cyan. The "track" of the progress bar should be `#111111`.
- **AI Pulse:** For "Processing" states, use a radial gradient animation that expands from the center of the component using Magenta with 0% to 50% opacity.