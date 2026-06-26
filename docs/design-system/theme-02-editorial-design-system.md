# Editorial — Complete Design System
> Version 1.0 · Derived from Theme 02: EDITORIAL

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [CSS Custom Properties — Master Token Sheet](#2-css-custom-properties--master-token-sheet)
3. [Color Palette](#3-color-palette)
4. [Typography System](#4-typography-system)
5. [Spacing System](#5-spacing-system)
6. [Border Radius System](#6-border-radius-system)
7. [Shadow & Elevation System](#7-shadow--elevation-system)
8. [Component Specifications](#8-component-specifications)
9. [Layout & Grid System](#9-layout--grid-system)
10. [Animation & Transition Tokens](#10-animation--transition-tokens)
11. [Z-Index System](#11-z-index-system)
12. [Breakpoints](#12-breakpoints)
13. [Icon System](#13-icon-system)
14. [State Definitions](#14-state-definitions)
15. [Dark Mode — Token Overrides & Guidelines](#15-dark-mode--token-overrides--guidelines)

---

## 1. System Overview

**Design Language:** Editorial / Refined Print
**Aesthetic Family:** Warm cream backgrounds, deep burgundy primary accent, serif display with geometric sans, refined newspaper sensibility
**Personality:** Cultured, deliberate, warm authority — communicates heritage, expertise, and literary sophistication
**Best Suited For:** Publishing platforms, editorial content tools, literary journals, content management systems, cultural institutions, premium blog platforms, media companies, academic publishing

**Core Principles:**
- Cream warmth over clinical white — background `#faf7f2`, not pure white
- Burgundy as the single prestige accent — deep, serious, not corporate
- Cormorant Garamond for all display headlines — the editorial serif
- Syne for all body and UI text — geometric structure that contrasts the flowing serif
- Small radius (4px) — enough to soften edges without losing editorial restraint
- Warm shadow with opacity — depth without harshness
- Typographic hierarchy carries structure over decorative elements

---

## 2. CSS Custom Properties — Master Token Sheet

Paste this block into the `:root` of every project using this system.

```css
:root {

  /* ─── COLOR: BACKGROUNDS ─────────────────────────────────────── */
  --color-bg-base:          #faf7f2;   /* Page / app background */
  --color-bg-surface:       #ffffff;   /* Cards, panels, raised containers */
  --color-bg-elevated:      #ffffff;   /* Inputs, modals, popups */
  --color-bg-secondary:     #f4ede3;   /* Secondary surfaces, hover washes */
  --color-bg-sunken:        #f4ede3;   /* Inset areas, code blocks */
  --color-bg-overlay:       rgba(250, 247, 242, 0.90); /* Modal backdrop */

  /* ─── COLOR: PRIMARY (BURGUNDY) ──────────────────────────────── */
  --color-primary:          #7b2d3b;   /* Deep burgundy — buttons, borders, headings */
  --color-primary-hover:    #5e2330;   /* Darker burgundy on hover */
  --color-primary-active:   #4a1a28;   /* Deepest on press */
  --color-primary-light:    #f0d8dc;   /* Tinted wash for hover surfaces */

  /* ─── COLOR: TEXT ────────────────────────────────────────────── */
  --color-text-primary:     #2c1810;   /* Near-black warm brown — headings, emphasis */
  --color-text-secondary:   #5e4a3e;   /* Warm brown — body copy, descriptions */
  --color-text-tertiary:    #8c7b6e;   /* Muted warm — labels, hints, captions */
  --color-text-muted:       #8c7b6e;   /* Metadata, timestamps, supplementary */
  --color-text-disabled:    #c4b4a4;   /* Disabled state text */
  --color-text-inverse:     #ffffff;   /* Light text on burgundy backgrounds */

  /* ─── COLOR: BORDERS ─────────────────────────────────────────── */
  --color-border-hairline:  #f0e8dc;   /* Subtlest separator */
  --color-border-light:     #e8e0d5;   /* Section dividers, card edges */
  --color-border-medium:    #e8e0d5;   /* Default input, card border */
  --color-border-strong:    #7b2d3b;   /* Active/focused state, accent border */

  /* ─── COLOR: INTERACTIVE ─────────────────────────────────────── */
  --color-btn-primary-bg:   #7b2d3b;
  --color-btn-primary-text: #ffffff;
  --color-btn-primary-hover:#5e2330;
  --color-btn-secondary-bg: transparent;
  --color-btn-secondary-text:#7b2d3b;
  --color-btn-secondary-border:#7b2d3b;
  --color-btn-secondary-hover:#f4ede3;
  --color-btn-ghost-bg:     transparent;
  --color-btn-ghost-text:   #8c7b6e;
  --color-btn-ghost-border: #e8e0d5;
  --color-btn-ghost-hover:  #f4ede3;

  /* ─── COLOR: SEMANTIC ────────────────────────────────────────── */
  --color-success:          #2d6a4f;
  --color-success-bg:       #d4edda;
  --color-warning:          #c77c2c;
  --color-warning-bg:       #fff3cd;
  --color-error:            #9b2335;
  --color-error-bg:         #f8d7da;
  --color-info:             #2c4a7b;
  --color-info-bg:          #d1e4ff;

  /* ─── TYPOGRAPHY: FONT FAMILIES ─────────────────────────────── */
  --font-display:  'Cormorant Garamond', 'Palatino Linotype', Georgia, serif;
  --font-body:     'Syne', 'Segoe UI', system-ui, sans-serif;
  --font-mono:     'IBM Plex Mono', 'Cascadia Code', monospace;  /* optional */

  /* ─── TYPOGRAPHY: SCALE ──────────────────────────────────────── */
  --text-2xs:   0.625rem;   /* 10px */
  --text-xs:    0.6875rem;  /* 11px */
  --text-sm:    0.75rem;    /* 12px */
  --text-base:  0.8125rem;  /* 13px */
  --text-md:    0.875rem;   /* 14px */
  --text-lg:    0.9375rem;  /* 15px */
  --text-xl:    1.125rem;   /* 18px */
  --text-2xl:   1.25rem;    /* 20px */
  --text-3xl:   1.75rem;    /* 28px */
  --text-4xl:   2.5rem;     /* 40px */
  --text-5xl:   3rem;       /* 48px */
  --text-6xl:   3.75rem;    /* 60px */

  /* ─── TYPOGRAPHY: WEIGHTS ────────────────────────────────────── */
  --weight-light:    300;
  --weight-regular:  400;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ─── TYPOGRAPHY: LINE HEIGHTS ───────────────────────────────── */
  --leading-tight:   1.0;
  --leading-snug:    1.2;
  --leading-base:    1.5;
  --leading-relaxed: 1.7;
  --leading-loose:   1.85;

  /* ─── TYPOGRAPHY: LETTER SPACING ─────────────────────────────── */
  --tracking-tighter: -0.02em;
  --tracking-tight:   -0.01em;
  --tracking-normal:   0em;
  --tracking-wide:     0.08em;
  --tracking-wider:    0.12em;
  --tracking-widest:   0.20em;

  /* ─── SPACING SCALE ──────────────────────────────────────────── */
  --space-1:   2px;
  --space-2:   4px;
  --space-3:   6px;
  --space-4:   8px;
  --space-5:   10px;
  --space-6:   12px;
  --space-7:   14px;
  --space-8:   16px;
  --space-9:   18px;
  --space-10:  20px;
  --space-12:  24px;
  --space-14:  28px;
  --space-16:  32px;
  --space-20:  40px;
  --space-24:  48px;
  --space-32:  64px;
  --space-48:  96px;

  /* ─── BORDER RADIUS ──────────────────────────────────────────── */
  --radius-none:   0px;
  --radius-xs:     2px;    /* Inner elements only */
  --radius-sm:     4px;    /* PRIMARY — all interactive + containers */
  --radius-md:     6px;    /* Image crops, decorative only */
  --radius-full:   9999px; /* Status pills only */

  /* ─── SHADOWS ────────────────────────────────────────────────── */
  --shadow-none:    none;
  --shadow-xs:      0 1px 3px rgba(44, 24, 16, 0.08);
  --shadow-sm:      0 2px 8px rgba(44, 24, 16, 0.10);
  --shadow-md:      0 6px 20px rgba(44, 24, 16, 0.12);
  --shadow-lg:      0 16px 40px rgba(44, 24, 16, 0.16);
  --shadow-card:    0 1px 3px rgba(44, 24, 16, 0.08);
  --shadow-modal:   0 8px 24px rgba(44, 24, 16, 0.10);
  --shadow-input-focus: 0 0 0 3px rgba(123, 45, 59, 0.10);

  /* ─── ANIMATION ──────────────────────────────────────────────── */
  --ease-standard:  cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:        cubic-bezier(0.4, 0, 1, 1);
  --ease-out:       cubic-bezier(0, 0, 0.2, 1);

  --duration-instant:  50ms;
  --duration-fast:    100ms;
  --duration-base:    200ms;
  --duration-slow:    350ms;

  /* ─── LAYOUT ─────────────────────────────────────────────────── */
  --container-xs:    380px;
  --container-sm:    480px;
  --container-md:    640px;
  --container-lg:    800px;
  --container-xl:   1040px;
  --container-2xl:  1280px;

  /* ─── Z-INDEX STACK ──────────────────────────────────────────── */
  --z-below:    -1;
  --z-base:      0;
  --z-raised:   10;
  --z-dropdown: 100;
  --z-sticky:   200;
  --z-overlay:  300;
  --z-modal:    400;
  --z-toast:    500;
  --z-tooltip:  600;
  --z-top:      999;

}
```

---

## 3. Color Palette

### 3.1 Background Colors

| Token | Hex | RGB | Use |
|-------|-----|-----|-----|
| `--color-bg-base` | `#faf7f2` | 250, 247, 242 | Page-level background |
| `--color-bg-surface` | `#ffffff` | 255, 255, 255 | Cards, modals, panels |
| `--color-bg-secondary` | `#f4ede3` | 244, 237, 227 | Secondary surfaces, hover, inset areas |
| `--color-bg-overlay` | `rgba(250,247,242,0.90)` | — | Modal backdrop |

### 3.2 Burgundy Accent Scale

| Token | Hex | Use |
|-------|-----|-----|
| `--color-primary` | `#7b2d3b` | **Core accent** — buttons, active borders, table headers underline |
| `--color-primary-hover` | `#5e2330` | Hover on primary button |
| `--color-primary-active` | `#4a1a28` | Pressed state |
| `--color-primary-light` | `#f0d8dc` | Tinted wash |

### 3.3 Text Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--color-text-primary` | `#2c1810` | Headings, high-emphasis, strong values |
| `--color-text-secondary` | `#5e4a3e` | Body copy, descriptions |
| `--color-text-tertiary` | `#8c7b6e` | Labels, captions, section eyebrows |
| `--color-text-muted` | `#8c7b6e` | Counters, timestamps, metadata |
| `--color-text-disabled` | `#c4b4a4` | Disabled elements |
| `--color-text-inverse` | `#ffffff` | Text on burgundy backgrounds |

### 3.4 Border Colors

| Token | Hex | Role |
|-------|-----|------|
| `--color-border-hairline` | `#f0e8dc` | Subtlest separator |
| `--color-border-light` | `#e8e0d5` | Section dividers, card edges |
| `--color-border-medium` | `#e8e0d5` | Default inputs, standard containers |
| `--color-border-strong` | `#7b2d3b` | Focused state, burgundy accent borders |

### 3.5 Semantic Colors

| State | Text | Background |
|-------|------|------------|
| Published / Success | `#2d6a4f` | `#d4edda` |
| Draft / Warning | `#c77c2c` | `#fff3cd` |
| Archived / Error | `#9b2335` | `#f8d7da` |
| Review / Info | `#2c4a7b` | `#d1e4ff` |

---

## 4. Typography System

### 4.1 Font Families

**Display / Headings — `'Cormorant Garamond'`**
- Google Fonts import: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap')`
- Fallback: `'Palatino Linotype', Georgia, serif`
- Weights used: 300 (Light), 400 (Regular), 400 Italic, 600 (SemiBold)
- Character: Classical editorial serif — flowing, literary, sophisticated
- Usage: All page and section titles H1–H3, display hero text, editorial pull quotes

**Body / UI — `'Syne'`**
- Google Fonts import: `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&display=swap')`
- Fallback: `'Segoe UI', system-ui, sans-serif`
- Weights used: 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- Character: Geometric sans with personality — modern contrast to the serif
- Usage: All body text, all buttons, all navigation, all UI labels, descriptions, form elements

---

### 4.2 Type Scale — Full Specification

#### Display / Title (Cormorant Garamond)

| Role | Size Token | Size (rem/px) | Weight | Style | Line Height | Letter Spacing |
|------|-----------|---------------|--------|-------|-------------|----------------|
| Hero Display | `--text-6xl` | 3.75rem / 60px | 300 | normal | 1.0 | -0.02em |
| Page Title | `--text-5xl` | 3rem / 48px | 300 | normal | 1.0 | -0.01em |
| Section H1 | `--text-4xl` | 2.5rem / 40px | 600 | normal | 1.1 | -0.01em |
| Editorial H2 | `--text-3xl` | 1.75rem / 28px | 400 | italic | 1.2 | 0em |
| Sub-title H3 | `--text-2xl` | 1.25rem / 20px | 400 | normal | 1.3 | 0em |

#### Body / UI (Syne)

| Role | Size Token | Size (rem/px) | Weight | Line Height | Letter Spacing |
|------|-----------|---------------|--------|-------------|----------------|
| Large Body | `--text-xl` | 1.125rem / 18px | 400 | 1.7 | 0em |
| Base Body | `--text-lg` | 0.9375rem / 15px | 400 | 1.7 | 0em |
| Small Body | `--text-md` | 0.875rem / 14px | 400 | 1.65 | 0em |
| Caption | `--text-sm` | 0.75rem / 12px | 400 | 1.6 | 0em |
| Button Large | `--text-md` | 0.875rem / 14px | 600 | 1 | 0.08em |
| Button Base | `--text-base` | 0.8125rem / 13px | 600 | 1 | 0.08em |
| Nav Link | `--text-md` | 0.875rem / 14px | 700 | 1 | 0.10em |
| Section Eyebrow | `--text-xs` | 0.6875rem / 10px | 700 | uppercase | 0.18em |
| Field Label | `--text-xs` | 0.6875rem / 11px | 700 | uppercase | 0.10em |
| Badge | `--text-xs` | 0.6875rem / 11px | 700 | uppercase | 0.06em |

---

### 4.3 Google Fonts Import Block

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Syne:wght@400;600;700;800&display=swap');
```

---

### 4.4 Heading System (HTML Mapping)

```css
h1 {
  font-family: var(--font-display);
  font-size: var(--text-5xl);       /* 48px */
  font-weight: 300;
  line-height: 1.0;
  letter-spacing: -0.01em;
  color: var(--color-text-primary);
}

h2 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);       /* 40px */
  font-weight: 600;
  line-height: 1.1;
  color: var(--color-text-primary);
}

h3 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);       /* 28px */
  font-weight: 400;
  font-style: italic;
  line-height: 1.2;
  color: var(--color-text-secondary);
}

h4 {
  font-family: var(--font-body);
  font-size: var(--text-xl);        /* 18px */
  font-weight: 500;
  line-height: 1.3;
  color: var(--color-text-primary);
}

h5, h6 {
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-xs);        /* 10px */
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

p {
  font-family: var(--font-body);
  font-size: var(--text-lg);        /* 15px */
  font-weight: 400;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--color-text-muted);
}
```

---

## 5. Spacing System

### 5.1 Base Scale Table

| Token | Value | Pixels | Common Use |
|-------|-------|--------|------------|
| `--space-1` | 2px | 2 | Micro gaps |
| `--space-2` | 4px | 4 | Badge padding V |
| `--space-3` | 6px | 6 | Label-to-input gap |
| `--space-4` | 8px | 8 | Badge padding H |
| `--space-5` | 10px | 10 | Button padding V (small) |
| `--space-6` | 12px | 12 | Button group gap |
| `--space-7` | 14px | 14 | Input padding H |
| `--space-8` | 16px | 16 | Nav items, section padding |
| `--space-10` | 20px | 20 | Card inner gap, form field gap |
| `--space-12` | 24px | 24 | Card padding, section breaks |
| `--space-14` | 28px | 28 | Large button H padding |
| `--space-16` | 32px | 32 | Modal padding |
| `--space-20` | 40px | 40 | Page section breaks |
| `--space-24` | 48px | 48 | Major content sections |

---

### 5.2 Component Spacing Specifications

#### Modal
```
padding-all:         32px  (--space-16)
eyebrow-to-title:     12px
title-bottom:        12px
hr-rule-margin-v:    10px  top + 10px bottom
description-bottom:  20px
label-bottom:         6px
input-to-helper:      4px
field-gap:           20px
button-gap:          12px
```

#### Card
```
padding-all:          24px  (--space-12)
inner-section-gap:    20px
border-radius:         4px  (--radius-sm)
```

#### Button
```
height-base:          40px
height-small:         34px

padding-v-base:       10px
padding-h-base:       22px
padding-h-small:      16px

border-radius:         4px  (--radius-sm)
letter-spacing:       0.08em  (uppercase tracking)
```

#### Input / Textarea
```
padding-v:            10px
padding-h:            14px
border-radius:         4px  (--radius-sm)
border-width:         1.5px
min-height-textarea:  80px
```

#### Table
```
cell-padding-v:       12px
cell-padding-h:       16px
header-padding-v:     10px
border-bottom-header: 2px solid var(--color-primary)  /* Burgundy underline */
```

#### Badge
```
padding-v:             3px
padding-h:            10px
border-radius:         4px  (--radius-sm)
font-size:            11px
letter-spacing:       0.06em
```

---

## 6. Border Radius System

| Token | Value | Where Used |
|-------|-------|-----------| 
| `--radius-none` | 0px | Horizontal rules, table cells, accent lines |
| `--radius-xs` | 2px | Inner sub-elements only |
| `--radius-sm` | 4px | **PRIMARY** — all buttons, inputs, badges, cards, modals, dropdowns |
| `--radius-md` | 6px | Image crops, decorative containers |
| `--radius-full` | 9999px | Status indicator pills only |

**Radius Budget Rules:**
- Default to `--radius-sm` (4px) for all interactive elements and containers
- 4px is the universal value — it provides the minimal softening without losing editorial gravity
- Never use `--radius-md` on interactive elements
- Never use `--radius-full` on buttons

---

## 7. Shadow & Elevation System

### 7.1 Elevation Levels

All shadows use the warm brown tint `rgba(44, 24, 16, ...)` — matching the text and background warmth.

| Level | Token | Value | Use |
|-------|-------|-------|-----|
| 0 — Flat | `--shadow-none` | none | Flat cards on surface |
| 1 — Subtle | `--shadow-xs` | `0 1px 3px rgba(44,24,16,0.08)` | Inline hover states |
| 2 — Card | `--shadow-card` | `0 1px 3px rgba(44,24,16,0.08)` | Standard cards |
| 3 — Float | `--shadow-sm` | `0 2px 8px rgba(44,24,16,0.10)` | Dropdown panels |
| 4 — Modal | `--shadow-modal` | `0 8px 24px rgba(44,24,16,0.10)` | Dialogs, modals |
| 5 — Deep | `--shadow-md` | `0 6px 20px rgba(44,24,16,0.12)` | Side panels |

### 7.2 Focus Shadow

Inputs and focused elements use a subtle burgundy ring instead of a hard border-only focus:

```css
input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(123, 45, 59, 0.10);
}
```

### 7.3 Shadow Color Logic

All shadows use `rgba(44, 24, 16, opacity)` — the warm dark brown from the text system. Never use pure black shadows in this system.

---

## 8. Component Specifications

### 8.1 Buttons

#### Primary Button
```css
.btn-primary {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-btn-primary-text);

  background: var(--color-btn-primary-bg);  /* #7b2d3b */
  border: 1.5px solid transparent;
  border-radius: var(--radius-sm);          /* 4px */
  padding: 10px 22px;
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
}
.btn-primary:hover  { background: var(--color-primary-hover); }
.btn-primary:active { background: var(--color-primary-active); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
```

#### Secondary / Outline Button
```css
.btn-secondary {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-btn-secondary-text);     /* #7b2d3b */
  background: var(--color-btn-secondary-bg);  /* transparent */
  border: 1.5px solid var(--color-primary);
  border-radius: var(--radius-sm);
  padding: 10px 22px;
  cursor: pointer;
  transition: background var(--duration-base) var(--ease-out);
}
.btn-secondary:hover { background: var(--color-btn-secondary-hover); }
```

#### Ghost Button
```css
.btn-ghost {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-btn-ghost-text);      /* #8c7b6e */
  background: transparent;
  border: 1.5px solid var(--color-border-light);
  border-radius: var(--radius-sm);
  padding: 10px 22px;
  cursor: pointer;
  transition: background var(--duration-base), color var(--duration-base);
}
.btn-ghost:hover {
  background: var(--color-btn-ghost-hover);
  color: var(--color-text-primary);
}
```

---

### 8.2 Form Inputs

```css
.input {
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: 400;
  color: var(--color-text-primary);

  background: var(--color-bg-surface);
  border: 1.5px solid var(--color-border-medium);
  border-radius: var(--radius-sm);

  padding: 10px 14px;
  width: 100%;
  outline: none;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-input-focus);
}
.input:disabled { opacity: 0.5; cursor: not-allowed; background: var(--color-bg-secondary); }
```

---

### 8.3 Labels

```css
.field-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.10em;
  color: var(--color-text-muted);
  margin-bottom: 6px;
  display: block;
}

.eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.section-label {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border-light);
  padding-bottom: 8px;
  margin-bottom: 20px;
}
```

---

### 8.4 Card

```css
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-sm);    /* 4px */
  padding: 24px;
  box-shadow: var(--shadow-card);
}
```

---

### 8.5 Modal

```css
.modal-backdrop {
  position: fixed; inset: 0;
  background: var(--color-bg-overlay);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  z-index: var(--z-modal);
}

.modal {
  background: var(--color-bg-base);     /* #faf7f2 */
  border: none;
  border-radius: var(--radius-sm);
  padding: 32px;
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-modal);
  position: relative;

  transform: translateY(12px);
  opacity: 0;
  transition:
    transform var(--duration-slow) var(--ease-standard),
    opacity   var(--duration-base) var(--ease-out);
}
.modal.open { transform: translateY(0); opacity: 1; }
```

---

### 8.6 Badge

```css
.badge {
  font-family: var(--font-body);
  font-size: var(--text-xs);    /* 11px */
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-radius: var(--radius-sm);  /* 4px */
  padding: 3px 10px;
  display: inline-flex;
  align-items: center;
}

.badge-success  { background: var(--color-success-bg); color: var(--color-success); }
.badge-warning  { background: var(--color-warning-bg); color: var(--color-warning); }
.badge-error    { background: var(--color-error-bg); color: var(--color-error); }
.badge-info     { background: var(--color-info-bg); color: var(--color-info); }
.badge-neutral  { background: var(--color-bg-secondary); color: var(--color-text-muted); }
```

---

### 8.7 Table

```css
.table       { width: 100%; border-collapse: collapse; font-size: var(--text-md); font-family: var(--font-body); }
.table thead { }
.table th {
  color: var(--color-primary);       /* Burgundy text on header */
  padding: 10px 16px;
  text-align: left;
  font-size: var(--text-2xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-bottom: 2px solid var(--color-primary);
  font-weight: 700;
}
.table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-secondary);
}
.table tr:last-child td { border-bottom: none; }
.table tr:hover td { background: var(--color-bg-secondary); }
```

---

## 9. Layout & Grid System

### 9.1 Container Widths

Same as system standard — `380px` through `1280px`.

### 9.2 Standard Layouts

```css
.layout-sidebar {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: var(--space-16);
}

.layout-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
}

.layout-stack {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
}
```

---

## 10. Animation & Transition Tokens

### 10.1 Easing Curves

| Token | Value | When to Use |
|-------|-------|-------------|
| `--ease-standard` | `cubic-bezier(0.16, 1, 0.3, 1)` | Modal entry |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | State changes |

### 10.2 Duration Scale

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 50ms | Press, active states |
| `--duration-fast` | 100ms | Hover color changes |
| `--duration-base` | 200ms | Standard interactive |
| `--duration-slow` | 350ms | Modal entry, panel |

---

## 11. Z-Index System

| Token | Value | Layer |
|-------|-------|-------|
| `--z-dropdown` | 100 | Dropdown menus |
| `--z-sticky` | 200 | Fixed headers |
| `--z-overlay` | 300 | Backdrop |
| `--z-modal` | 400 | Modals |
| `--z-toast` | 500 | Notifications |
| `--z-tooltip` | 600 | Tooltips |

---

## 12. Breakpoints

```css
@media (min-width: 480px)  { /* sm+ */ }
@media (min-width: 768px)  { /* md+ */ }
@media (min-width: 1024px) { /* lg+ */ }
@media (min-width: 1280px) { /* xl+ */ }
```

---

## 13. Icon System

- **Size scale:** 14px, 16px, 18px, 20px, 24px
- **Default size:** 16px inline, 20px standalone
- **Stroke weight:** 1.5px
- **Library:** Lucide Icons

```css
.icon {
  width: 16px; height: 16px;
  stroke: currentColor; stroke-width: 1.5;
  fill: none; flex-shrink: 0;
}
```

---

## 14. State Definitions

### 14.1 Input States

| State | Border | Background | Shadow |
|-------|--------|------------|--------|
| Default | `#e8e0d5` | `#ffffff` | none |
| Hover | `#c8b8a8` | `#ffffff` | none |
| Focus | `#7b2d3b` | `#ffffff` | `0 0 0 3px rgba(123,45,59,0.10)` |
| Disabled | `#f0e8dc` | `#f4ede3` | none |
| Error | `#9b2335` | `#f8d7da` | none |
| Success | `#2d6a4f` | `#d4edda` | none |

### 14.2 Button States

| State | Primary | Secondary |
|-------|---------|-----------|
| Default | `#7b2d3b` bg, white text | transparent, burgundy border |
| Hover | `#5e2330` bg | `#f4ede3` bg |
| Active | `#4a1a28` bg | `rgba(123,45,59,0.12)` bg |
| Disabled | opacity 0.4 | opacity 0.4 |

### 14.3 Link States

```css
a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--color-border-medium);
}
a:hover { text-decoration-color: var(--color-primary); }
```

---

## 15. Dark Mode — Token Overrides & Guidelines

### 15.1 Philosophy

The Editorial dark mode is **warm-dark**, not cold-dark. The goal is "aged parchment read by candlelight" — very dark warm-brown backgrounds, cream-inverted text, and a slightly-brightened burgundy that can still hold its authority on the dark surface.

**Never** use pure black (`#000000`) or cold greys. All dark surfaces are warm-dark brown family.

---

### 15.2 Implementation Strategy

Dark mode is toggled by adding the `dark` class to `<html>`. CSS custom properties are overridden inside `.dark { }` in `index.css`. All Tailwind colour tokens (`editorial-*`) are defined as `var(--...)` references, so they automatically pick up dark values without per-element `dark:` prefixes.

```
Light mode: :root { --color-bg-base: #faf7f2; }
Dark mode:  .dark  { --color-bg-base: #16130f; }

Tailwind:   bg-editorial-base → background: var(--color-bg-base) → auto-switches
```

The `useTheme` hook in `src/hooks/useTheme.ts` manages three modes:
- **`system`** — follows `prefers-color-scheme` OS/browser setting (default)
- **`light`** — forces light regardless of system
- **`dark`** — forces dark regardless of system

The selected mode is persisted in `localStorage` under the key `internalx-theme`.

---

### 15.3 Dark Mode Token Sheet

Paste the `.dark { }` block into `@layer base` in your `index.css` (or equivalent global CSS).

```css
.dark {
  /* ─── BACKGROUNDS ────────────────────────────────────────────── */
  --color-bg-base:          #16130f;   /* Deep warm dark — editorial night */
  --color-bg-surface:       #1e1a15;   /* Cards, panels */
  --color-bg-elevated:      #1e1a15;
  --color-bg-secondary:     #2a2520;   /* Hover, inset, secondary surfaces */
  --color-bg-sunken:        #110e0b;
  --color-bg-overlay:       rgba(16, 13, 10, 0.92); /* Modal backdrop */

  /* ─── PRIMARY (BURGUNDY) — brightened for dark backgrounds ───── */
  --color-primary:          #c4677a;   /* Readable burgundy on dark */
  --color-primary-hover:    #d47e91;
  --color-primary-active:   #a84f62;
  --color-primary-light:    #3d1e26;

  /* ─── TEXT ───────────────────────────────────────────────────── */
  --color-text-primary:     #f0ebe2;   /* Warm near-white (cream inverted) */
  --color-text-secondary:   #c8beb4;   /* Warm medium */
  --color-text-tertiary:    #8c7b6e;
  --color-text-muted:       #7a6a60;
  --color-text-disabled:    #4a3e38;
  --color-text-inverse:     #16130f;   /* Dark text on burgundy bg */

  /* ─── BORDERS ────────────────────────────────────────────────── */
  --color-border-hairline:  #221e1a;
  --color-border-light:     #2e2924;
  --color-border-medium:    #2e2924;
  --color-border-strong:    #c4677a;

  /* ─── INTERACTIVE ────────────────────────────────────────────── */
  --color-btn-primary-bg:        #7b2d3b;
  --color-btn-primary-text:      #f0ebe2;
  --color-btn-primary-hover:     #9b3d4f;
  --color-btn-secondary-bg:      transparent;
  --color-btn-secondary-text:    #c4677a;
  --color-btn-secondary-border:  #c4677a;
  --color-btn-secondary-hover:   #2a1a1e;
  --color-btn-ghost-bg:          transparent;
  --color-btn-ghost-text:        #7a6a60;
  --color-btn-ghost-border:      #2e2924;
  --color-btn-ghost-hover:       #2a2520;

  /* ─── SEMANTIC ───────────────────────────────────────────────── */
  --color-success:          #4a9e7a;
  --color-success-bg:       #0d2b1e;
  --color-warning:          #d4944a;
  --color-warning-bg:       #2b1e0a;
  --color-error:            #c4455a;
  --color-error-bg:         #2b0d12;
  --color-info:             #4a7ab5;
  --color-info-bg:          #0d1a2b;

  /* ─── SHADOWS ────────────────────────────────────────────────── */
  --shadow-card:            0 1px 2px rgba(0,0,0,0.24), 0 4px 18px rgba(0,0,0,0.28);
  --shadow-modal:           0 8px 40px rgba(0,0,0,0.50), 0 2px 8px rgba(0,0,0,0.28);
  --shadow-input-focus:     0 0 0 3px rgba(196,103,122,0.20);
  --shadow-button-primary:  0 2px 10px rgba(123,45,59,0.45), 0 1px 2px rgba(123,45,59,0.28);
}
```

---

### 15.4 Dark Mode Color Palette Reference

| Token | Light Hex | Dark Hex | Dark Purpose |
|-------|-----------|----------|-------------|
| `--color-bg-base` | `#faf7f2` | `#16130f` | Deep warm dark page background |
| `--color-bg-surface` | `#fffefb` | `#1e1a15` | Cards, modals, panels |
| `--color-bg-secondary` | `#f4ede3` | `#2a2520` | Hover states, secondary surfaces |
| `--color-primary` | `#7b2d3b` | `#c4677a` | Brightened burgundy (AA on dark) |
| `--color-text-primary` | `#2c1810` | `#f0ebe2` | Warm near-white for headings |
| `--color-text-secondary` | `#5e4a3e` | `#c8beb4` | Warm medium for body copy |
| `--color-text-muted` | `#8c7b6e` | `#7a6a60` | Labels, captions |
| `--color-border-light` | `#e8e0d5` | `#2e2924` | Card edges, dividers |
| `--color-success` | `#2d6a4f` | `#4a9e7a` | Brightened for dark bg |
| `--color-error` | `#9b2335` | `#c4455a` | Brightened for dark bg |

---

### 15.5 Contrast Reference (Dark Mode)

| Pairing | Contrast | WCAG |
|---------|----------|------|
| `#f0ebe2` on `#16130f` | ~16:1 | AAA ✓ |
| `#c8beb4` on `#16130f` | ~9:1 | AAA ✓ |
| `#c4677a` on `#16130f` | ~5.2:1 | AA ✓ |
| `#7a6a60` on `#16130f` | ~4.1:1 | AA ✓ |
| `#f0ebe2` on `#7b2d3b` | ~5.1:1 | AA ✓ |

---

### 15.6 Tailwind Configuration

Enable class-based dark mode in `tailwind.config.js`:

```js
export default {
  darkMode: 'class',  // Add 'dark' class to <html> to activate
  // ...
}
```

This works seamlessly with CSS-variable–mapped `editorial-*` colours — no `dark:` prefix needed on individual elements.

---

### 15.7 Dark Mode Anti-Patterns

- ❌ **Do not** use pure black `#000000` or cold grey backgrounds — always warm dark brown family
- ❌ **Do not** use the same burgundy `#7b2d3b` as a text colour on dark surfaces — it fails contrast; use `#c4677a` instead
- ❌ **Do not** add `dark:` prefixes to elements that use `editorial-*` tokens — the CSS variable swap handles this automatically
- ❌ **Do not** apply cold blue or desaturated greys as text — always keep the warm brown character of the system
- ❌ **Do not** invert to pure white on dark backgrounds — use `#f0ebe2` (warm near-white / cream inverted)

---

*End of Design System — Editorial v1.0 (with Dark Mode — v1.1)*
