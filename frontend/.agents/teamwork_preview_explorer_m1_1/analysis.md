# Visual Identity & Design System Plan: SLM Single-Page Frontend

**Author**: Explorer 1 (`teamwork_preview_explorer_m1_1`)  
**Target Project**: SLM Single-Page Web Frontend (`/home/kami/Desktop/codebase/slm/frontend`)  
**Date**: 2026-08-04  
**Milestone**: M1 — Visual Identity & Design System Architecture  

---

## 1. Vision & Core Theme: "Language Cartographer's Tool"

### 1.1 Origin & Soul
SLM originated as a high-precision East African translation project wrapping the `fikra-pro-120b` AI model (via `fikraapi.co.ke`). The core thesis of SLM is **language as living spatial material**. Translation is not merely swapping string $A$ for string $B$; it is navigating from one linguistic region to another across phonetic topography, cultural nuances, and script structures.

### 1.2 Aesthetic Direction
The interface acts as a **language cartographer's navigational instrument**:
- **Precise**: Clean geometric grid alignment, micro-metadata, coordinate reticles, crisp status indicators.
- **Cross-Cultural**: Built for bi-directional text flow, phonetic IPA (International Phonetic Alphabet) clarity, and rich script rendering.
- **Scholarly yet Alive**: Deep abyssal slate background reminiscent of star charts and maritime navigation charts, illuminated by brass compass accents, topographic cyan highlights, and live animated script waveforms.

---

## 2. Color Palette Architecture & Hex Specifications

### 2.1 Palette Definition

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| `--bg-abyss` | `#0E1520` | Primary app background (Deep abyssal ink/slate) |
| `--surface-base` | `#182232` | Lower map layer / main container panels |
| `--surface-card` | `#222E42` | Raised cards, input textareas, active dropzones |
| `--surface-hover` | `#2D3C54` | Interactive element hover states |
| `--border-grid` | `#2E3F57` | Cartographic gridlines, subtle panel borders |
| `--text-primary` | `#EEF4F8` | Crisp papyrus white for main translations & headers |
| `--text-secondary` | `#94A3B8` | Map legend text, lat/lng metadata, labels |
| `--text-muted` | `#64748B` | Subtle hints, placeholder text, inactive tabs |
| `--accent-brass` | `#E5C07B` | Compass brass / gold for primary CTAs & focal points |
| `--accent-brass-hover` | `#F0D293` | Primary CTA hover state |
| `--topo-cyan` | `#38BDF8` | Topographic cyan for phonetic highlights & active focus |
| `--script-amber` | `#F59E0B` | Pronunciation badge highlights & language tags |
| `--status-emerald` | `#10B981` | Meridian green for successful job completion & SSE active |
| `--status-crimson` | `#EF4444` | Rubric red for error states & failed jobs |
| `--surface-crimson` | `#3B181E` | Error notification background tint |

### 2.2 Audit Against AI Design Defaults
The palette explicitly avoids the three common AI design defaults:
1. **NOT Warm-Cream (#F4F1EA) + High-Contrast Serif + Terracotta**: SLM avoids soft beige editorial tropes in favor of a dark, instrument-grade cartographic interface (`#0E1520`).
2. **NOT Near-Black + Acid-Green/Vermilion**: Avoids the cyberpunk terminal dark-mode cliche. Uses rich slate-navy with muted compass brass (`#E5C07B`) and topographic cyan (`#38BDF8`).
3. **NOT Broadsheet Hairline Newspaper**: Avoids zero-radius dense black-and-white grid lines. Uses soft modern rounded corners (`6px` / `10px`) with subtle glowing grid overlays (`#2E3F57`).

---

## 3. Typography & Google Font Pairings

### 3.1 Font Selection

1. **Display Face: `Fraunces`** (Google Font - Variable Optical Size)
   - **Characteristics**: Soft, expressive, scholar-grade serif with optical size adjustments (`opsz` 9..144), variable weights (900/700/600).
   - **Role**: Hero title, main header, thesis banner, key brand headings. Conveys historical scholarly weight without feeling archaic.

2. **Body & Interface Face: `Plus Jakarta Sans`** (Google Font)
   - **Characteristics**: Clean, geometric sans-serif with high legibility across small sizes, broad Unicode/script support, and clean tabular numbers.
   - **Role**: Input textareas, translation result text, labels, buttons, forms, and general UI controls.

3. **Utility & Phonetic/Monospace Face: `JetBrains Mono`** (Google Font)
   - **Characteristics**: High-precision monospace font with clear IPA phonetic character rendering, numeric alignment, and code/job ID display.
   - **Role**: Pronunciation IPA strings, lat/lng coordinates, `job_id` display, token count counters, API status logs.

### 3.2 Font Loading & Integration
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 4. Signature Visual Element: "Phonetic Coordinate Grid & Script Waveform Bridge"

### 4.1 Concept
The signature visual element of SLM is an **interactive phonetic coordinate grid & constellation line overlay**. 

### 4.2 How It Works in UI
1. **Cartographic Header Grid**: The top hero section features a subtle, animated SVG grid representing longitudinal and latitudinal lines of world language spaces.
2. **Interactive Word-to-Phonetic Constellation**: When a user inspects the word-by-word translation breakdown:
   - Hovering over a `source_word` in the table highlights its corresponding `translated_word` and `pronunciation` badge in topographic cyan (`#38BDF8`).
   - A dynamic SVG bezier curve ("script wave") visually anchors the source word to its target phonetic breakdown, reinforcing the concept of bridging two linguistic points on the map.
3. **Live Coordinates HUD**: A small, unobtrusive cartographic HUD in the header displays active metrics (e.g., `LAT: 0.00° / LNG: 0.00° | ENGINE: fikra-pro-120b | SSE: CONNECTED`).

---

## 5. One Real Aesthetic Risk & Justification

### 5.1 The Risk
**High-density instrument UI with visible metadata coordinates and cartographic gridlines, rather than a minimal, empty-space SaaS text boxes.**

### 5.2 Justification
Standard translation tools (Google Translate, DeepL, Bing Translator) treat translation as an empty box-in, box-out utility, hiding all internal richness. 

SLM takes the calculated aesthetic risk of presenting translation as a **scientific and cultural expedition**. By including cartographic grid overlays, word-level phonetic coordinates, engine metadata (`fikra-pro-120b`), and structured word breakdown tables directly alongside the primary translation, SLM gives users the sense of operating a powerful linguistic observatory. This creates a memorable, premium brand presence that aligns directly with SLM's story of mapping human speech.

---

## 6. UI Copy & Tone Guidelines

- **Voice**: Active voice, concise, sentence case, user-centric, scholarly yet accessible.
- **Action Buttons**:
  - `Translate text` (not "Submit")
  - `Upload document` (not "Send file")
  - `Configure key` (not "Save settings")
  - `Copy breakdown` (not "Export")
- **Error Messages**:
  - *Generic error default avoided!*
  - Example (API Error): `"Authentication failed. Check your API token in the settings drawer and try again."`
  - Example (OCR Failure): `"Unable to read text from image. Ensure the image is clear and under 10MB, then re-upload."`

---

## 7. Draft CSS Design Plan Comment Block

The exact CSS comment block to be placed at the very top of the main CSS / `<style>` block in `index.html`:

```css
/*
==============================================================================
 DESIGN SYSTEM PLAN & VISUAL IDENTITY: SLM LANGUAGE CARTOGRAPHER'S TOOL
==============================================================================
 Core Concept: Language as living material — a navigational instrument for 
 mapping meaning, script, and phonetics across human tongues.

 1. PALETTE SYSTEM (Hex Specifications):
    - Deep Abyss Ink (Primary BG):    #0E1520
    - Cartographer Slate (Surface 1): #182232
    - Instrument Card (Surface 2):   #222E42
    - Hover State:                   #2D3C54
    - Gridline / Border:             #2E3F57
    - Crisp Papyrus (Text Primary):   #EEF4F8
    - Lat/Lng Slate (Text Secondary):#94A3B8
    - Compass Brass (Accent Primary): #E5C07B  (Hover: #F0D293)
    - Topographic Cyan (Highlight):  #38BDF8
    - Script Amber (Phonetic Badge): #F59E0B
    - Meridian Emerald (Success):    #10B981
    - Rubric Crimson (Error/Failed):  #EF4444  (Surface: #3B181E)

 2. TYPOGRAPHY PAIRING:
    - Display Face: 'Fraunces', serif (Variable Optical Size 9..144)
    - Body / Interface Face: 'Plus Jakarta Sans', sans-serif
    - Phonetic / Monospace Face: 'JetBrains Mono', monospace

 3. LAYOUT & STRUCTURE:
    - Instrument panel layout with top navigation HUD (Auth token status, 
      Engine indicator: fikra-pro-120b, Lat/Lng coordinates).
    - Dual input tabs: Text Input vs File Upload (OCR).
    - Result display: Prominent full translation block + interactive word-by-word
      pronunciation breakdown matrix.

 4. SIGNATURE VISUAL ELEMENT:
    - Interactive Phonetic Coordinate Grid & Script Waveform Bridge.
    - SVG topographic contour lines connecting source text, IPA pronunciation,
      and target translation on word hover/selection.

 5. AESTHETIC RISK:
    - High-density cartographic instrument layout with visible metadata reticles
      over minimalist empty whitespace. Justified: Transforms translation from a
      generic box-in/box-out utility into a scholarly exploration tool.
==============================================================================
*/
```

---

## 8. Summary of Findings & Next Steps

1. **Visual Identity**: Established complete "Language Cartographer's Tool" architecture.
2. **Color System**: Fully specified hex tokens avoiding default AI templates.
3. **Typography**: Configured `Fraunces` + `Plus Jakarta Sans` + `JetBrains Mono`.
4. **Signature Element & Risk**: Fully conceptualized and justified.
5. **Handoff Ready**: Implementer 1 can use `analysis.md` directly to construct `index.html` CSS tokens, layout structure, and components in Milestone 2.
