---
name: SLM Design System
description: A Zen-like immersive reader for language learners, focusing on typography, contrast, and calm.
colors:
  primary: "#163c2e"
  accent: "#b25e43"
  neutral-bg: "#fbfaf7"
  neutral-card: "#ffffff"
  ink: "#1a1c1b"
  ink-muted: "#5a5e5c"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0.01em"
  label:
    fontFamily: "Plus Jakarta Sans, Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "12px"
  lg: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-card}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.neutral-card}"
    rounded: "{rounded.full}"
    padding: "10px 24px"
---

# Design System: SLM Immersive Reader

## 1. Overview

**Creative North Star: "The Reader's Sanctuary"**

The SLM visual identity is built around the feeling of a quiet, premium reading room. It rejects the hyper-stimulated, neon-heavy, gamified conventions of modern language learning tools and the cold blueprint feel of standard Material 3 developer interfaces. Spacing is generous, typography is elegant and editorial, and focus is preserved by maintaining a single, highly refined warm alabaster paper theme.

The core layout centers on the foreign language text, using high contrast serif fonts for the reading passages and a crisp, modern geometric sans-serif for controls, statistics, and annotations.

**Key Characteristics:**
*   Single, unified warm paper theme (no distracting theme toggling).
*   Restrained natural colors (deep pine green, terracotta, and soft stone alabaster).
*   High-contrast, high-legibility typographic pairing (Serif display/prose + Sans-serif interface).
*   State transitions that feel organic and tactile (soft micro-fades and translations).
*   Spacious layouts with clear visual breathing room.

## 2. Colors

A highly controlled palette inspired by natural elements: deep forest flora, warm earth clay, and soft minerals.

### Primary
- **Pine Canopy** (#163c2e / oklch(28% 0.04 155)): The core brand color, used for primary actions, navigation indicators, and key active states.

### Accent
- **Terracotta Clay** (#b25e43 / oklch(53% 0.14 42)): Used sparingly for highlighted errors, specialized actions, and interactive annotations.

### Neutral
- **Warm Alabaster** (#fbfaf7 / oklch(98% 0.005 75)): The default background. Extremely soft on the eyes, avoiding pure white glare.
- **Pure White** (#ffffff / oklch(100% 0 0)): Used for cards, panels, and dropdown menus.
- **Ink** (#1a1c1b / oklch(12% 0.002 155)): Standard text color. High contrast for maximum readability.
- **Ink Muted** (#5a5e5c / oklch(45% 0.002 155)): Subdued text for descriptions, labels, and secondary details.

**The Ten Percent Rule.** The Terracotta accent must represent no more than 10% of any screen surface. It should act strictly as a point-of-focus highlights.

## 3. Typography

**Display Font:** Playfair Display (fallback: Georgia, serif)
**Body Font:** Plus Jakarta Sans (fallback: Inter, system-ui, sans-serif)

**Character:** A literary contrast between an elegant, historical serif for reading passages and headers, and an ultra-modern, crisp sans-serif for functional controls and tools.

### Hierarchy
- **Display** (Bold, 32px, line-height 1.2): Used for page titles and main section headings.
- **Headline** (Medium, 20px to 28px, line-height 1.3): Used for panel titles and sub-headings.
- **Body / Reading Passage** (Regular, 17px, line-height 1.8, max line-length 70ch): The core reading viewport text. Highly spaced to facilitate focus.
- **Label** (SemiBold, 12px, letter-spacing 0.05em, uppercase): Used for eyebrows, metadata tags, button labels, and small subtitles.

## 4. Elevation

The system is flat by default, emphasizing structural borders and clean layouts rather than artificial depth. Surfaces are differentiated by background color shifts.

**The Flat-By-Default Rule.** Shadows are prohibited at rest. Fine borders (1px) in neutral shades are used for containers. Soft, diffuse shadows appear exclusively to indicate interactivity (e.g. popover tooltips, active dropdowns).

## 5. Components

### Buttons
- **Shape:** Fully rounded/pill (9999px) or medium curved (12px).
- **Primary:** Pine Canopy background with Alabaster text, horizontal padding of 24px.
- **Secondary:** Outlined with a 1px border of Pine Canopy, transitioning to a soft Pine Green background tint on hover.
- **Hover / Focus:** Interactive buttons scale down slightly on active click (`active:scale-[0.98]`) and transition background color smoothly over 200ms.

### Cards / Containers
- **Corner Style:** Rounded (12px or 20px).
- **Background:** White.
- **Border:** 1px solid border of soft gray (`#e5e7eb`). No shadows.

### Annotation Popover
- **Style:** Rendered as a floating card with a 1px border, 12px rounded corners, and a soft, blurred backdrop shadow.
- **Interaction:** Smoothly scales and fades into position above the clicked token. Dismissed by clicking outside or pressing ESC.

## 6. Do's and Don'ts

### Do:
- **Do** wrap reading passages in a container that enforces a maximum width of 70ch to prevent eye fatigue.
- **Do** ensure vocabulary annotations maintain a minimum contrast ratio of 4.5:1 against the card background.
- **Do** use `text-wrap: balance` for display headings to avoid awkward single-word orphans.

### Don't:
- **Don't** use neon yellows, greens, or high-intensity purples for vocabulary statuses.
- **Don't** use thick colored borders (greater than 1px) to accent active cards.
- **Don't** apply any hover scale/transform transitions on images or reading passages.
- **Don't** use standard sans-serif font families for the primary reading text when in "Reader" mode.
