# Editorial — Construction Instructions & AI Prompting Guide
> Version 1.0 · Complete decision framework for building with the Editorial system

---

## Table of Contents

1. [Design Philosophy & Core Rules](#1-design-philosophy--core-rules)
2. [The Two-Font Law](#2-the-two-font-law)
3. [Color Application Rules](#3-color-application-rules)
4. [Border Radius Decision Framework](#4-border-radius-decision-framework)
5. [Background & Surface Rules](#5-background--surface-rules)
6. [Shadow & Elevation Rules](#6-shadow--elevation-rules)
7. [The Table Header Accent — When and How](#7-the-table-header-accent--when-and-how)
8. [Typography Application Rules](#8-typography-application-rules)
9. [Spacing Construction Rules](#9-spacing-construction-rules)
10. [Component Construction Guides](#10-component-construction-guides)
11. [Interactive States — Full Decision Guide](#11-interactive-states--full-decision-guide)
12. [Layout Construction Rules](#12-layout-construction-rules)
13. [Animation Rules](#13-animation-rules)
14. [What Never to Do — Anti-Pattern List](#14-what-never-to-do--anti-pattern-list)
15. [AI Prompting Instructions](#15-ai-prompting-instructions)
16. [New Project Checklist](#16-new-project-checklist)
17. [Component Pattern Library](#17-component-pattern-library)
18. [Responsive Construction Rules](#18-responsive-construction-rules)
19. [Accessibility Guidelines](#19-accessibility-guidelines)
20. [Common Scenarios — Decision Trees](#20-common-scenarios--decision-trees)
21. [Dark Mode — Construction Rules](#21-dark-mode--construction-rules)

---

## 1. Design Philosophy & Core Rules

### The Fundamental Premise

The Editorial system speaks the language of refined print publishing. Every decision is drawn from the craft of editorial design — the measured warmth of a cream page, the authority of a deep burgundy masthead, the elegant contrast between a flowing Garamond headline and the structured geometry of a modern sans body. This is a system that has read *The New Yorker*, studied *Le Monde*, and respects the discipline it takes to make information feel like something worth reading.

This is not warmth for warmth's sake. The cream backgrounds, the burgundy primary, the lowercase-heavy headers — all of it signals that this product respects the reader's attention and has done the work to deserve it.

---

### The 10 Commandments of This System

**1. Cream over white for the page.**
Use `#faf7f2` for the page background. Pure white `#ffffff` belongs only to cards, inputs, and modal surfaces. The cream warmth of the base is the foundation of the editorial feel.

**2. Burgundy is the voice of the system.**
`#7b2d3b` appears on primary buttons, on focused input borders, on table header underlines, and in active nav items. It is a serious, literary color — not corporate blue, not playful teal. Do not dilute it with secondary accents.

**3. Cormorant Garamond for all display text.**
Every headline H1–H3 uses Cormorant Garamond. The weight-300 version for hero text, the italic for editorial subheads. This is non-negotiable — Syne headlines break the editorial contract.

**4. Syne for all UI and body.**
Syne provides the structured geometric counterweight to the flowing serif. It is used for body copy, button labels (uppercase), field labels (uppercase), nav items, and all interactive text.

**5. Border-radius is 4px everywhere.**
Every button, input, badge, card, modal, and dropdown uses `border-radius: 4px`. Not 2px, not 8px — always 4px. This is the universal container radius for this system.

**6. Uppercase for all actionable UI text.**
Button labels, field labels, eyebrow headings, section labels, badge text — all uppercase. This creates structural contrast between the flowing prose (mixed case) and the interactive structure (caps).

**7. Table headers use burgundy underline, not dark fill.**
The Editorial system does not invert table headers to a dark background (that belongs to Sharp). Instead, table headers have `color: #7b2d3b` (burgundy text) and `border-bottom: 2px solid #7b2d3b`. This is the editorial accent in data contexts.

**8. Focus rings use a subtle burgundy glow.**
`box-shadow: 0 0 0 3px rgba(123, 45, 59, 0.10)` on focus, plus `border-color: #7b2d3b`. The soft glow is warmer and more appropriate than a hard outline.

**9. Shadows are warm brown, not black.**
All shadows use `rgba(44, 24, 16, opacity)` — the same warm brown family as the text. Never `rgba(0,0,0,...)`.

**10. Letter-spacing is generous on all uppercase text.**
Button labels: `0.08em`. Field labels: `0.10em`. Eyebrow/section labels: `0.18em`. The wide tracking at small uppercase sizes is essential to readability and editorial feel.

---

## 2. The Two-Font Law

This system uses exactly two fonts. Every piece of text belongs to one category.

### Category 1: Cormorant Garamond — Display and Titles

**Assignment question: Is this a headline, page title, section heading, or editorial pull quote?**

If yes → Cormorant Garamond.

- Page title: YES → Cormorant, weight 300
- Section H1: YES → Cormorant, weight 600
- Card headline: YES → Cormorant, weight 300–400
- Editorial italic subhead: YES → Cormorant, 400 italic
- Pull quote: YES → Cormorant italic
- H1–H3: YES → Cormorant
- H4 and below: NO → use Syne bold instead

---

### Category 2: Syne — Everything Else

**Assignment question: Is this body text, a button, a label, a badge, navigation, a description, or any UI element?**

If yes → Syne.

- Body paragraph: YES → Syne, weight 400
- Button label: YES → Syne, weight 600, uppercase
- Field label: YES → Syne, weight 700, uppercase
- Nav item: YES → Syne, weight 700, uppercase
- Badge text: YES → Syne, weight 700, uppercase
- Section eyebrow: YES → Syne, weight 700, uppercase
- Input placeholder: YES → Syne, weight 400
- Error messages: YES → Syne, weight 400
- H4–H6: YES → Syne, weight 600–700

---

### Font Decision Flowchart

```
Is it a headline H1–H3, hero title, or editorial pull quote? ──YES──► Cormorant Garamond
        │ NO
        ▼
Is it any other text (body, label, button, badge, nav, UI)? ──YES──► Syne
        │ NO
        ▼
Default to Syne
```

---

## 3. Color Application Rules

### 3.1 Background Selection Rules

| Surface | Color | Why |
|---------|-------|-----|
| Page body | `#faf7f2` | Cream editorial warmth |
| Cards / modals | `#ffffff` | Clean surface, contrast from page |
| Inputs | `#ffffff` | Clear affordance |
| Secondary surfaces | `#f4ede3` | Hover states, table row hover, code bg |
| Disabled inputs | `#f4ede3` | Signal non-editability |
| Modal backdrop | `rgba(250, 247, 242, 0.90)` | Warm overlay matching page tone |

---

### 3.2 Burgundy Usage Rules

`#7b2d3b` is the editorial prestige color. Use it in exactly these places:

1. **Primary button background** — the most important CTA action
2. **Focused input border** — `border-color: #7b2d3b` on focus
3. **Focus glow ring** — `box-shadow: 0 0 0 3px rgba(123,45,59,0.10)`
4. **Table header text and underline** — `color: #7b2d3b, border-bottom: 2px solid #7b2d3b`
5. **Secondary button border and text** — outline style

**Allowed sparingly:**
- Active nav item indicator
- Active tab underline
- Link color (primary anchor)
- Selected card border

**Never:**
- Burgundy backgrounds on full sections
- Burgundy on body copy (only for interactive elements and headings)
- Multiple burgundy sections per viewport

---

### 3.3 Text Color Assignment

| Priority | Color | Examples |
|----------|-------|---------| 
| Highest | `#2c1810` | All serif headings, modal titles, key values |
| High | `#5e4a3e` | Body copy, descriptions, secondary info |
| Medium | `#8c7b6e` | Labels, eyebrows, captions, meta text |
| Low | `#8c7b6e` | Timestamps, counters (same as tertiary) |
| Disabled | `#c4b4a4` | Non-interactive elements |
| On dark bg | `#ffffff` | Primary button text |

---

### 3.4 Semantic Color Rules

Apply semantic colors as a trio: colored border + tinted background + colored text. The Editorial semantic colors are intentionally muted and warm — not the harsh saturated reds/greens of clinical systems.

---

## 4. Border Radius Decision Framework

This system has a single radius value for all interactive and container elements.

**`border-radius: 4px` everywhere.**

```
Is this an interactive element (button, input, select, badge)?
→ border-radius: 4px (--radius-sm)

Is this a container (card, modal, panel, dropdown)?
→ border-radius: 4px (--radius-sm)

Is this a status pill (Active, Published, Pending)?
→ border-radius: 4px (--radius-sm) — pills are allowed but 4px badges are preferred

Is this a horizontal rule or divider?
→ border-radius: 0px

Is this a table cell?
→ border-radius: 0px (container gets 4px)
```

### Quick Reference Table

| Element | Radius |
|---------|--------|
| Button (all sizes) | 4px |
| Text input | 4px |
| Textarea | 4px |
| Select | 4px |
| Badge / chip | 4px |
| Card | 4px |
| Modal | 4px |
| Tooltip | 4px |
| Dropdown panel | 4px (bottom corners only: `0 0 4px 4px`) |
| Table container | 4px |
| Table cell | 0px |
| Horizontal rule | 0px |
| Image crop | 4px–6px |

---

## 5. Background & Surface Rules

### 5.1 The Layering Model

```
Layer 4: Modals, Tooltips    → #ffffff + warm shadow 8px 24px
Layer 3: Dropdowns           → #ffffff + shadow sm
Layer 2: Cards, Panels       → #ffffff + border 1px #e8e0d5
Layer 1: Page Background     → #faf7f2
```

Elevation is communicated by shadow depth, not by lightening/darkening the background.

---

### 5.2 The Cream/White Rule

- Page: `#faf7f2` (cream)
- Cards, modals, inputs: `#ffffff` (pure white)
- Secondary/hover surfaces: `#f4ede3` (deeper cream)

Never use pure white for the page background in this system. The cream-to-white contrast between page and card is what creates the editorial layering effect.

---

### 5.3 Backdrop

Modal overlays use: `background: rgba(250, 247, 242, 0.90)` + `backdrop-filter: blur(4px)`. The warm cream tint on the overlay respects the page's warmth rather than darkening it.

---

## 6. Shadow & Elevation Rules

### 6.1 Warm Shadow Rule

```css
rgba(44, 24, 16, opacity)
```

This is the only shadow color family. It matches the deep brown of the primary text and creates warmth. Never use `rgba(0,0,0,...)`.

---

### 6.2 Elevation Pairing

| Element | Shadow |
|---------|--------|
| Flat card | `0 1px 3px rgba(44,24,16,0.08)` |
| Dropdown | `0 8px 24px rgba(44,24,16,0.10)` |
| Modal | `0 8px 24px rgba(44,24,16,0.10)` |
| Input focus ring | `0 0 0 3px rgba(123,45,59,0.10)` |

---

### 6.3 No Hard-Edge Shadows

The Editorial system uses only soft Gaussian shadows. There are no hard-edge offset shadows (those belong to Sharp). All depth is communicated through opacity-based soft blur.

---

## 7. The Table Header Accent — When and How

The defining detail of the Editorial system's data presentation is the burgundy table header.

### How to Implement

```css
.table thead {
  /* No background fill — headers are same color as surface */
}
.table th {
  color: var(--color-primary);           /* #7b2d3b — burgundy text */
  border-bottom: 2px solid var(--color-primary);  /* Thick burgundy underline */
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 10px 16px;
}
```

The table headers carry the burgundy accent in a data context. The 2px border-bottom acts as a column label separator, borrowing from the editorial rule-line tradition.

---

## 8. Typography Application Rules

### 8.1 The Eyebrow → Title Pattern

The most common pattern:

```
THE EDITORIAL              ← Syne, 10px, uppercase, tracking 0.20em, color #8c7b6e
         ↕ 12px
Design                     ← Cormorant Garamond, 60px, weight 300
System                     ← Cormorant Garamond, same, italic variant
```

The eyebrow is always Syne uppercase muted. The title is always Cormorant. The contrast between the structured caps and the flowing serif is the personality of this system.

---

### 8.2 Italic Serif Subheads

H2–H3 subheads often appear in italic Cormorant to create editorial rhythm:

```css
h3 {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-weight: 400;
  font-size: 28px;
  color: var(--color-text-secondary);
}
```

Italic in this system is reserved for serif display text only. Never apply italic to Syne body copy.

---

### 8.3 Uppercase Tracking Requirements

| Context | Weight | Letter Spacing |
|---------|--------|----------------|
| Nav items | 700 | `0.10em` |
| Button labels | 600 | `0.08em` |
| Field labels | 700 | `0.10em` |
| Section eyebrows | 700 | `0.18em` |
| Badges | 700 | `0.06em` |

All uppercase text must have tracking. Never leave uppercase Syne at `letter-spacing: 0`.

---

### 8.4 Section Label Pattern

```css
.section-label {
  font-family: 'Syne', sans-serif;
  font-size: 10px;
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

## 9. Spacing Construction Rules

### 9.1 The Padding Budget

| Component | Padding |
|-----------|---------|
| Badge | 3px vertical, 10px horizontal |
| Input | 10px vertical, 14px horizontal |
| Button small | 8px vertical, 16px horizontal |
| Button base | 10px vertical, 22px horizontal |
| Card | 24px all sides |
| Modal | 32px all sides |
| Table cell | 12px vertical, 16px horizontal |

---

### 9.2 Vertical Rhythm in Forms

```
[Field Label — Syne, uppercase]
         ↕ 6px
[Input]
         ↕ 5px
[Helper / Error text]
         ↕ 20px
[Next Field]
```

---

### 9.3 Eyebrow → Title → Rule → Body Sequence

```
[Eyebrow — Syne, 10px, uppercase, muted]
    ↕ 12px
[Title — Cormorant, large, weight 300]
    ↕ 12px
[Horizontal rule — 1px, #e8e0d5]
    ↕ 10px
[Description — Syne, body]
```

---

### 9.4 Button Group

Two buttons: `gap: 12px`. Cancel `flex:1`, Submit `flex:2`.

---

## 10. Component Construction Guides

### 10.1 How to Build a Modal — Step by Step

**Step 1: Backdrop**
`rgba(250, 247, 242, 0.90)` + `blur(4px)`

**Step 2: Container**
- Background: `#ffffff`
- Border: none
- Border-radius: `4px`
- Padding: `32px`
- Max-width: `480px`
- Box-shadow: `0 8px 24px rgba(44,24,16,0.10)`

**Step 3: Header row**
- Left: Syne eyebrow text (10px, uppercase, tracking 0.18em, muted)
- Right: close × button (no background)

**Step 4: Title**
- Cormorant Garamond, `1.5rem`, weight 300
- Color: `#2c1810`
- Margin-bottom: `12px`

**Step 5: Horizontal rule**
- `border-top: 1px solid #e8e0d5`
- Margin: `0 0 10px`

**Step 6: Description**
- Syne, `15px`, weight 400
- Color: `#5e4a3e`
- Line-height: `1.7`

**Step 7: Field label**
- Syne, `11px`, uppercase, tracking `0.10em`
- Color: `#8c7b6e`
- Margin-bottom: `6px`

**Step 8: Input/Textarea**
- `border: 1.5px solid #e8e0d5`, `border-radius: 4px`
- Focus: `border-color: #7b2d3b` + soft glow `0 0 0 3px rgba(123,45,59,0.10)`

**Step 9: Buttons**
- Cancel: ghost style (transparent bg, `#e8e0d5` border, `#8c7b6e` text)
- Submit: burgundy bg, white text, uppercase, Syne 600
- Gap: `12px`

---

### 10.2 How to Build a Data Table — Step by Step

**Step 1: Table**
- `border-collapse: collapse`
- Font-family: Syne

**Step 2: Header row**
- No background color
- Column text: `color: #7b2d3b` (burgundy)
- `border-bottom: 2px solid #7b2d3b`
- Font: Syne, 10px, uppercase, tracking 0.12em, weight 700

**Step 3: Body rows**
- Cell text: Syne, 14px, `#5e4a3e`
- Row divider: `1px solid #e8e0d5`
- Padding: `12px 16px`

**Step 4: Row hover**
- Background: `#f4ede3`
- Transition: `100ms`

---

## 11. Interactive States — Full Decision Guide

### 11.1 Hover States

| Element | What Changes | Duration |
|---------|-------------|---------|
| Primary button | `#7b2d3b` → `#5e2330` | 200ms |
| Secondary button | Background → `#f4ede3` | 200ms |
| Ghost button | Background → `#f4ede3`, color → `#2c1810` | 200ms |
| Table row | Background → `#f4ede3` | 150ms |
| Input | Border → `#c8b8a8` | 150ms |
| Dropdown item | Background → `#f4ede3` | 150ms |

---

### 11.2 Focus States

```css
input:focus, textarea:focus {
  border-color: #7b2d3b;
  box-shadow: 0 0 0 3px rgba(123, 45, 59, 0.10);
  outline: none;
}
```

---

### 11.3 Press States

```css
button:active { transform: scale(0.98); transition: transform 50ms; }
```

---

### 11.4 Disabled States

```css
.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
```
Inputs: add `background: #f4ede3`.

---

## 12. Layout Construction Rules

### 12.1 Page Structure

```
[Nav — cream bg, border-bottom 1px #e8e0d5, 56px]
[Content area]
   [Optional Sidebar — 260px]
   [Main — flex 1]
      [Page header: eyebrow + serif title + rule]
      [Section labels + content]
```

---

### 12.2 Content Width

Body text: max `680px` line width. Data tables: full container. Modal: max `480px`.

---

## 13. Animation Rules

### 13.1 What Gets Animated

| Element | Animation |
|---------|-----------|
| Modal | translateY(12px → 0) + fade |
| Dropdown | fade in + subtle scale(0.98 → 1) |
| Button hover | bg transition 200ms |
| Input focus | border + shadow 200ms |

### 13.2 Performance Rule

Only animate: `transform`, `opacity`, `background-color`, `border-color`, `box-shadow`.

---

## 14. What Never to Do — Anti-Pattern List

### Typography Anti-Patterns
- ❌ Syne for H1–H3 headlines (Cormorant only)
- ❌ Non-italic Cormorant for H3 editorial subheads (italic is the editorial signal)
- ❌ Lowercase Syne button labels (always uppercase)
- ❌ Wide tracking on serif headlines (tight or normal only)
- ❌ Missing uppercase tracking on Syne labels (always add letter-spacing)

### Color Anti-Patterns
- ❌ Pure white `#ffffff` for the page background
- ❌ Burgundy on body copy text (not a text color, only for interactive elements)
- ❌ Using black `#000000` for anything (always use warm `#2c1810`)
- ❌ Black shadows (`rgba(0,0,0,...)`)
- ❌ Adding a second accent color alongside burgundy

### Shape Anti-Patterns
- ❌ 0px border-radius on buttons or inputs (this is not the Sharp system)
- ❌ 8px or higher border-radius on any element
- ❌ Pill-shaped buttons (`border-radius: 9999px`)
- ❌ Mixed radius values on the same component

### Shadow Anti-Patterns
- ❌ Hard-edge offset shadows (that's the Sharp system)
- ❌ Black shadow colors
- ❌ No shadow on floating elements (dropdowns, modals)

### Table Anti-Patterns
- ❌ Dark-fill inverted table headers (that's Sharp)
- ❌ Missing burgundy underline on table headers
- ❌ Non-uppercase column labels
- ❌ Regular-weight column labels (must be 700)

### Spacing Anti-Patterns
- ❌ Missing letter-spacing on uppercase Syne
- ❌ No gap between label and input (minimum 6px)
- ❌ Button group gap below 12px

---

## 15. AI Prompting Instructions

### 15.1 System Context Block

```
You are building using the Editorial design system. Key rules:
- TWO fonts: Cormorant Garamond (H1–H3 only, weight 300 normal or 400 italic) + Syne (everything else: body, buttons, labels, nav)
- border-radius: 4px on ALL interactive and container elements
- Page bg: #faf7f2 (cream); surface/cards/modals: #ffffff; secondary/hover: #f4ede3
- Primary accent: #7b2d3b (deep burgundy) — buttons, focus borders, table header text
- Shadows: soft warm rgba(44, 24, 16, ...) — NEVER rgba(0,0,0,...)
- Focus: border-color #7b2d3b + box-shadow 0 0 0 3px rgba(123,45,59,0.10)
- All button labels and field labels: UPPERCASE, Syne weight 600–700, letter-spacing 0.08em–0.10em
- Table headers: color #7b2d3b + border-bottom 2px solid #7b2d3b, NO dark fill
- Never use black shadows, hard-edge shadows, or sans-serif headlines
```

---

### 15.2 Component Prompt Templates

**For a new form:**
```
Build a [form name] using the Editorial design system.
- Container: padding 32px, border-radius 4px, bg #faf7f2 or #ffffff, shadow 0 8px 24px rgba(44,24,16,0.10)
- Title: Cormorant Garamond, weight 300, 24px, color #2c1810
- Divider: 1px solid #e8e0d5
- Field labels: Syne, 11px, uppercase, tracking 0.10em, color #8c7b6e
- Inputs: white bg, 1.5px border #e8e0d5, border-radius 4px; focus: border #7b2d3b + glow
- Buttons: Cancel (ghost: transparent, border #e8e0d5, text #8c7b6e) + Submit (bg #7b2d3b, text #fff, uppercase Syne 600)
```

**For a data table:**
```
Build a data table using the Editorial design system.
- Table: border-collapse collapse, Syne font
- Column headers: Syne, 10px, uppercase, tracking 0.12em, weight 700, color #7b2d3b, border-bottom 2px solid #7b2d3b
- NO dark background on header (headers are same bg as surface)
- Row cells: Syne 14px, color #5e4a3e, padding 12px 16px
- Row divider: 1px solid #e8e0d5
- Hover: #f4ede3
```

---

### 15.3 Debugging Prompts

**If headlines are not serif:**
```
Change all H1–H3 to font-family: 'Cormorant Garamond', serif; weight 300 or 400; line-height 1.0–1.2.
Syne should only be used for body, labels, buttons, and UI elements.
```

**If table headers are dark-filled:**
```
Remove the dark background from table headers.
Apply: color #7b2d3b (burgundy) + border-bottom 2px solid #7b2d3b.
The header cells should have the same background as the surface.
```

**If shadows are cold/grey:**
```
Change all shadow rgba values from (0,0,0,...) to rgba(44, 24, 16, ...) — warm brown family.
```

**If button labels are not uppercase:**
```
Add text-transform: uppercase and letter-spacing: 0.08em to all button labels.
Font: Syne, weight 600.
```

---

## 16. New Project Checklist

### Setup Phase
- [ ] Google Fonts: Cormorant Garamond + Syne imported
- [ ] Body background: `#faf7f2`
- [ ] Body font: Syne, weight 400
- [ ] Body color: `#5e4a3e`
- [ ] H1–H3: Cormorant Garamond
- [ ] All `border-radius` defaults to `4px`
- [ ] Base input: `1.5px solid #e8e0d5`, `border-radius: 4px`
- [ ] Base button: uppercase Syne, `border-radius: 4px`

### Component Phase
- [ ] Cormorant for all display headings only
- [ ] Syne for all body, labels, buttons, nav
- [ ] 4px radius on everything interactive and structural
- [ ] Table headers: burgundy text + 2px underline (not dark fill)
- [ ] Shadows use `rgba(44, 24, 16, ...)`
- [ ] Focus: burgundy border + soft glow ring
- [ ] Uppercase + letter-spacing on all Syne labels and buttons

### Review Phase
- [ ] No pure white page background
- [ ] No black or dark-fill table headers
- [ ] No hard-edge shadows
- [ ] All button labels uppercase with tracking
- [ ] Serif (Cormorant) only on H1–H3
- [ ] Burgundy used correctly (not on body copy)

---

## 17. Component Pattern Library

### Pattern 1: Page Header
```
[Syne eyebrow — 10px, uppercase, tracking 0.20em, muted]
         ↕ 12px
[Cormorant title — large, weight 300]
[Cormorant subtitle — weight 300, italic variation]
─────────────────────────  ← 1px border-bottom #e8e0d5
         ↕ 40px
[First section content]
```

### Pattern 2: Content Section
```
[Section label — Syne, uppercase, border-bottom 1px #e8e0d5]
         ↕ 20px
[Surface card or content]
         ↕ 48px
[Next section]
```

### Pattern 3: Editorial Badge Row
```
<span class="badge badge-success">Published</span>
<span class="badge badge-warning">Draft</span>
<span class="badge badge-error">Archived</span>
<span class="badge badge-info">Review</span>
```
Syne, 11px, uppercase, 4px radius.

### Pattern 4: Navigation
```
[Nav — bg #faf7f2, border-bottom 1px #e8e0d5, 56px]
[Logo — Cormorant or Syne brand mark]
[Nav items — Syne, 11px, uppercase, tracking 0.12em, weight 700]
[Active — color #7b2d3b + underline or dot]
```

### Pattern 5: Pull Quote
```
[Cormorant Garamond, italic, 24–28px, weight 400]
[Color: #5e4a3e or #2c1810]
[Optional: 2px left border in #7b2d3b]
```

---

## 18. Responsive Construction Rules

### 18.1 Breakpoint Behavior

**Below 480px:**
- Modal padding: 32px → 20px
- Card padding: 24px → 16px
- Cormorant hero title: reduce 2 sizes
- Nav: hamburger menu

**480px–767px:**
- Modal max-width: fills with 16px margin
- 2-column → 1-column
- Button group: stacked

**768px+:**
- Full system as designed

---

### 18.2 Typography Scaling

| Element | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| Cormorant Hero | 60px | 48px | 36px |
| Cormorant H1 | 48px | 36px | 28px |
| Cormorant H2 | 40px | 32px | 26px |
| Cormorant H3 | 28px | 24px | 22px |
| Syne body | 15px | 15px | 16px |

---

## 19. Accessibility Guidelines

### 19.1 Color Contrast

| Pairing | Contrast | WCAG |
|---------|----------|----- |
| `#2c1810` on `#faf7f2` | 15.2:1 | AAA ✓ |
| `#5e4a3e` on `#faf7f2` | 7.4:1 | AAA ✓ |
| `#7b2d3b` on `#faf7f2` | 5.1:1 | AA ✓ |
| `#8c7b6e` on `#faf7f2` | 4.2:1 | AA ✓ |
| `#ffffff` on `#7b2d3b` | 5.1:1 | AA ✓ |
| `#c4b4a4` on `#faf7f2` | 2.0:1 | ✗ Disabled only |

---

### 19.2 Focus Management

- All interactive: `:focus-visible` with `outline: 2px solid #7b2d3b; outline-offset: 2px`
- Modal: trap focus within, return on close

---

### 19.3 ARIA

```html
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Publish article</h2>
</div>

<label for="title-input">Article Title</label>
<input id="title-input" aria-describedby="title-hint">
<div id="title-hint">Maximum 80 characters</div>
```

---

## 20. Common Scenarios — Decision Trees

### Scenario: "Should this be Cormorant or Syne?"

```
Is this a page title, section heading (H1–H3), or pull quote? ──YES──► Cormorant Garamond
        │ NO
        ▼
Syne — always
```

### Scenario: "Should this be italic?"

```
Is this a Cormorant H2–H3 subhead? ──YES──► Italic (editorial rhythm)
Is this a Cormorant pull quote? ──YES──► Italic
Is this body copy or UI text? ──YES──► Never italic (use weight instead)
```

### Scenario: "What background does this surface need?"

```
Page body? → #faf7f2
Card / modal / input? → #ffffff
Hover state / secondary / inset? → #f4ede3
Modal backdrop? → rgba(250, 247, 242, 0.90)
```

### Scenario: "How should this table header look?"

```
Sharp system? → Dark fill, white text, Space Mono
Editorial system? → Same bg as surface, BURGUNDY text + 2px solid #7b2d3b underline, Syne uppercase
```

---

---

## 21. Dark Mode — Construction Rules

### 21.1 The Dark Mode Principle

Dark mode in the Editorial system is **warm-dark**, never cold-dark. Think of it as reading a premium magazine under warm lamplight, not staring at a monitor in a dark room. The editorial personality — warmth, refinement, literary authority — must be preserved in both modes.

**The single rule: replace cream with warm dark, keep burgundy (brightened).**

---

### 21.2 How It Works

Dark mode is activated by adding the `dark` class to `<html>`. All colours are CSS custom properties, so the `.dark { }` override block in `index.css` automatically re-maps every `editorial-*` Tailwind token. **No `dark:` prefix is needed on individual components.**

```html
<!-- Light mode (default) -->
<html>...</html>

<!-- Dark mode (class added by useTheme hook) -->
<html class="dark">...</html>
```

The `useTheme()` hook (`src/hooks/useTheme.ts`) manages three modes:

| Mode | Behaviour |
|------|-----------|
| `'system'` | Follows OS `prefers-color-scheme` — default |
| `'light'` | Forces light regardless of system |
| `'dark'` | Forces dark regardless of system |

Persisted in `localStorage` under key `internalx-theme`.

---

### 21.3 Dark Mode Background Rules

| Surface | Light | Dark | Rule |
|---------|-------|------|------|
| Page background | `#faf7f2` | `#16130f` | Warm-dark cream inversion |
| Cards / panels | `#fffefb` | `#1e1a15` | Slightly lighter than page |
| Secondary / hover | `#f4ede3` | `#2a2520` | Hover wash, inset areas |
| Modal backdrop | `rgba(250,247,242,0.90)` | `rgba(16,13,10,0.92)` | Warm dark overlay |

---

### 21.4 Dark Mode Typography Rules

- Primary text: `#f0ebe2` — warm near-white (never pure white)
- Body copy: `#c8beb4` — warm medium
- Muted / labels: `#7a6a60` — same family, slightly dimmer
- Disabled: `#4a3e38`

Cormorant Garamond and Syne remain unchanged — the editorial serif/sans pairing works in both modes.

---

### 21.5 Dark Mode Colour Rules

**Burgundy shifts lighter in dark mode** to maintain contrast:

| Token | Light | Dark |
|-------|-------|------|
| `--color-primary` | `#7b2d3b` | `#c4677a` |
| `--color-primary-hover` | `#5e2330` | `#d47e91` |

Do not use `#7b2d3b` as a text colour on dark backgrounds — it fails contrast. Use `#c4677a` instead.

**Semantic colours shift brighter** (same saturation family, +30% lightness):

| Semantic | Light | Dark |
|----------|-------|------|
| Success | `#2d6a4f` | `#4a9e7a` |
| Warning | `#c77c2c` | `#d4944a` |
| Error | `#9b2335` | `#c4455a` |
| Info | `#2c4a7b` | `#4a7ab5` |

---

### 21.6 Implementing the Theme Toggle

Use the `useTheme()` hook and a Sun/Moon icon button:

```tsx
import useTheme from '@/hooks/useTheme'
import { Moon, Sun } from 'lucide-react'

const { isDark, cycleTheme, themeMode } = useTheme()

<button onClick={cycleTheme} aria-label={`Appearance: ${themeMode}`}>
  {isDark ? <Moon size={15} /> : <Sun size={15} />}
</button>
```

The hook applies the `dark` class to `document.documentElement` automatically and listens to system preference changes when in `'system'` mode.

---

### 21.7 New Project Dark Mode Checklist

- [ ] `darkMode: 'class'` in `tailwind.config.js`
- [ ] `.dark { }` token block in `@layer base` in global CSS
- [ ] `useTheme()` hook wired to a toggle button
- [ ] All colours use `editorial-*` tokens (never hardcoded hex)
- [ ] Tab active state uses `bg-editorial-surface` (not `bg-white`)
- [ ] No cold greys or pure black anywhere in dark surfaces

---

### 21.8 Dark Mode Anti-Patterns

| Anti-Pattern | Correction |
|-------------|-----------|
| `bg-black` or `bg-gray-*` for dark surfaces | Use `bg-editorial-base` / CSS vars |
| `text-white` on dark bg | Use `text-editorial-text-primary` → `#f0ebe2` |
| `#7b2d3b` as dark-mode text colour | Use `#c4677a` — brightened burgundy |
| Hardcoding `bg-white` for cards | Use `bg-editorial-surface` |
| Adding `dark:` prefixes to all elements | Not needed — CSS var swap handles it |
| Cold blue-grey scrollbars or borders | Keep warm brown family: `#2e2924` etc. |

---

*End of Instructions — Editorial v1.1 (with Dark Mode)*
*Design System Document: theme-02-editorial-design-system.md*
*Instructions Document: theme-02-editorial-instructions.md*
