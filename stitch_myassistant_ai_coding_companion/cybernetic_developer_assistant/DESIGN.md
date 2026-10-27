---
name: Cybernetic Developer Assistant
colors:
  surface: '#11131c'
  surface-dim: '#11131c'
  surface-bright: '#373943'
  surface-container-lowest: '#0c0e17'
  surface-container-low: '#191b24'
  surface-container: '#1d1f29'
  surface-container-high: '#282933'
  surface-container-highest: '#32343e'
  on-surface: '#e1e1ef'
  on-surface-variant: '#b9cac4'
  inverse-surface: '#e1e1ef'
  inverse-on-surface: '#2e303a'
  outline: '#83948f'
  outline-variant: '#3a4a46'
  surface-tint: '#00dfc1'
  primary: '#d7fff3'
  on-primary: '#00382f'
  primary-container: '#00f5d4'
  on-primary-container: '#006c5c'
  inverse-primary: '#006b5b'
  secondary: '#e0b6ff'
  on-secondary: '#4c007d'
  secondary-container: '#6d11ad'
  on-secondary-container: '#d7a4ff'
  tertiary: '#f5f6ff'
  on-tertiary: '#002e69'
  tertiary-container: '#cbdaff'
  on-tertiary-container: '#005bc3'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#26fedc'
  primary-fixed-dim: '#00dfc1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005144'
  secondary-fixed: '#f2daff'
  secondary-fixed-dim: '#e0b6ff'
  on-secondary-fixed: '#2e004e'
  on-secondary-fixed-variant: '#6a0baa'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a41'
  on-tertiary-fixed-variant: '#004494'
  background: '#11131c'
  on-background: '#e1e1ef'
  surface-variant: '#32343e'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The brand personality is precise, intelligent, highly technical, and responsive. Built tailored for mobile-first Android engineers and technical leads, the experience should evoke focused calm, elevated capability, and cutting-edge machine intelligence. 

The aesthetic is a hybrid of **Minimalist Dark Mode** and **Cybernetic Glassmorphism**:
- Deep slate-indigo bases eliminate eye strain during prolonged nighttime coding sessions.
- Luminescent cyan and electric purple accents denote AI inference, telemetry feedback, and context states.
- Monospaced typography accents and subtle glowing edges echo modern IDE interfaces and hardware debugger shells.
- First-class bilingual ergonomics honor English (LTR) and Persian (RTL) scripts with balanced visual hierarchy and baseline harmony.

## Colors
The palette leverages a deep spectral distribution designed to mimic dynamic terminal-to-IDE interfaces with luminescent AI focal points.

- **Primary (`#00F5D4` - Cyber Cyan):** Primary calls to action, code diff additions, active build statuses, and primary machine intelligence feedback.
- **Secondary (`#9D4EDD` - Electric Purple):** AI context threads, token generation markers, neural search prompts, and GitHub/Google model integration highlights.
- **Tertiary (`#3A86FF` - Hyperlink Blue):** Deep system metadata, standard telemetry links, and secondary actionable nodes.
- **Neutral Surface Palette:**
  - `Canvas / Background`: `#0A0C14` (Deep Indigo-Slate)
  - `Surface 01 (Subdued)`: `#111422`
  - `Surface 02 (Containers & Cards)`: `#171B2E`
  - `Surface 03 (Elevated Floating/Modals)`: `#21263F`
  - `Border / Hairline Outline`: `rgba(0, 245, 212, 0.12)`
  - `Border Subdued`: `rgba(255, 255, 255, 0.08)`
- **Content / Foreground:**
  - `On Neutral Highest`: `#F8FAFC` (98% contrast)
  - `On Neutral Medium`: `#94A3B8` (Muted metadata and timestamps)
  - `On Neutral Low`: `#64748B` (Inactive states, placeholders)
- **Status Accents:**
  - `Error / Conflict`: `#FF3366` (Compiler errors, lint fails)
  - `Warning / Warning Trace`: `#FFB703` (Deprecation notices, warnings)
  - `Success`: `#00F5D4` (Tests passed, sync successful)

## Typography
The system enforces a tri-font hierarchy supporting dual LTR/RTL reading flows:

- **Space Grotesk:** Technical, geometric headline typography that delivers modern mechanical cadence for English headers.
- **Inter:** Exceptional legibility for extended text, prompt explanations, documentation reading, and UI strings.
- **JetBrains Mono:** Code snippets, terminal logs, git commit SHAs, latency tags, and technical badges.
- **RTL Script Support (Persian):**
  - Use `Vazirmatn` as the systematic substitute font across Persian UI locales for both display and body contexts.
  - Scale Persian body fonts by +1px relative to Latin counterparts (`15px` for `body-md`) and expand line-height by 15-20% to account for dynamic calligraphic loops, ascenders, and marks.
  - Code structures (`JetBrains Mono`) retain LTR formatting regardless of application RTL orientation.

## Layout & Spacing
The layout follows an 8pt architectural rhythm, with a supplementary 4pt micro-step for fine-tuning compact code tags, pills, and indicators.

- **Mobile Viewport (< 600dp):** Fluid single-column system with a `16px` outer margin (`margin`) and `16px` gutters. Elements flow vertically with dynamic code card stacking.
- **Foldable / Tablet Viewport (600dp - 1024dp):** Dual-pane structure (Left: Assistant threads & logs; Right: Interactive code playground/diff inspector) with a `24px` outer margin and `24px` gutter.
- **Desktop/DeX Viewport (> 1024dp):** 12-column layout max-width constrained to `1200px` centered canvas, with a `48px` outer margin.
- **RTL Flipping Matrix:**
  - Mirror column orders, padding vectors, navigation icon placements, and chevron directions automatically under Persian locale (`dir="rtl"`).
  - Terminal windows, JSON responses, and code blocks preserve strictly LTR directionality with left-aligned monospaced text.

## Elevation & Depth
Depth is maintained through dark tonal layering, frosted surface translucency, and spectral edge lighting rather than standard drop shadows.

- **Level 0 (Canvas Base):** Solid background `#0A0C14`.
- **Level 1 (Cards & Code Panes):** `#171B2E` with `backdrop-filter: blur(16px)` and an internal stroke border of `1px solid rgba(255, 255, 255, 0.06)`.
- **Level 2 (Dropdowns, Sheets, Dialogs):** `#21263F` backed by ambient diffuse drop-glow: `0 12px 32px -4px rgba(0, 0, 0, 0.6)`.
- **AI Focal States (Glowing Depth):**
  - Active AI processing or selected cards introduce a secondary luminous outline: `box-shadow: 0 0 20px -2px rgba(0, 245, 212, 0.18), inset 0 0 0 1px rgba(0, 245, 212, 0.4)`.
  - Purple AI inference states utilize `rgba(157, 78, 221, 0.25)` ambient back-glow.

## Shapes
A unified rounded geometric language (`roundedness: 2`) balances industrial precision with comfortable touch targets.

- **Default Component Radius (0.5rem / 8px):** Code blocks, chips, inputs, list items, action menus.
- **Containers & Surface Cards (1rem / 16px):** Main chat cards, code overview panels, dialogs, bottom sheets.
- **Floating Modals & Sheets (1.5rem / 24px):** Persistent prompt drawers, contextual code inspectors.
- **Pills / Status Dots (9999px):** Status badges, notification indicators, prompt tag chips.

## Components

### Buttons
- **Primary (Action / Execute):** Solid `#00F5D4` background, dark text `#0A0C14`, font `Space Grotesk` medium. On press, scale `0.98` with a cyan pulse glow (`0 0 14px rgba(0, 245, 212, 0.5)`).
- **Secondary / AI Variant:** Translucent electric purple surface (`rgba(157, 78, 221, 0.15)`), border `1px solid rgba(157, 78, 221, 0.4)`, text `#D8B4FE`.
- **Ghost / Utility:** Transparent fill, `1px solid rgba(255, 255, 255, 0.1)` border, hover fill `rgba(255, 255, 255, 0.05)`.

### Chips & Badges
- **Status & Integration Badges:** Height 24px, pill-shaped (`9999px`), `JetBrains Mono` 10px uppercase.
  - **GitHub Chip:** `#161B22` background with white-gray icon and subtle border.
  - **Google AI Chip:** `#1F1A3A` background with `#C084FC` text and a subtle radial purple glow.
  - **Active State Dot:** 6px circle with animated CSS keyframe pulse `box-shadow: 0 0 8px currentColor`.

### Input Fields & Prompt Bar
- **Prompt Bar:** Elevated floating container with 16px corner radius, background `#171B2E`, 1px border `rgba(0, 245, 212, 0.2)`. 
- Incorporates quick action code-mode toggle on the leading edge (trailing edge in RTL) and an expandable multi-line text input with bilingual direction auto-detection based on the first strong directional character.

### Cards
- **Code Snippet Cards:** Matte dark slate `#111422` with a discrete top metadata bar showing language tag (`KT`, `XML`, `GRADLE`), execution time, copy icon, and branch name. Syntax highlighting mirrors dark-terminal themes using cyan, neon pink, and muted purple.
- **AI Thread Cards:** Soft indigo border gradient from cyan to electric purple.

### Checkboxes & Radio Buttons
- 20px squares/circles, `2px` border with `rgba(255, 255, 255, 0.3)`. Checked state displays `#00F5D4` fill with `#0A0C14` inner checkmark/pip and cyan glow perimeter.

### Lists
- Flat list entries delimited by `1px` subtle divider (`rgba(255, 255, 255, 0.05)`). Interactive states highlight background to `#1E233D` with smooth 150ms transitions.