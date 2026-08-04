# HTML Layout & UI Component Architecture Analysis

**Project:** SLM Single-Page Web Frontend  
**Author:** Explorer 3 (HTML Layout & UI Component Architecture Specialist)  
**Date:** 2026-08-04  
**Target File:** `/home/kami/Desktop/codebase/slm/frontend/index.html`  
**Visual Identity:** Language Cartographer's Tool  

---

## 1. Executive Summary

This report establishes the complete HTML5 structural wireframe, DOM element hierarchy, semantic accessibility strategy, and responsive layout architecture for the **SLM Single-Page Web Frontend**. 

The UI design embodies the "Language Cartographer's Tool" concept—blending East African linguistic precision (`fikra-pro-120b` engine) with scholarly, map-like visual clarity. The layout is crafted mobile-first (down to 375px) without relying on external heavy frontend frameworks, using zero-build clean vanilla HTML5 tags, CSS custom properties, and ARIA-compliant DOM elements.

---

## 2. Global DOM Hierarchy Tree

```text
<!DOCTYPE html> <html lang="en">
├── <head>
│   ├── <meta> (charset, viewport, description)
│   ├── <title> SLM — Sound & Language Mapper
│   ├── <link> (Google Fonts: Fraunces & Plus Jakarta Sans)
│   └── <style> (Design tokens, component styles, media queries)
└── <body>
    ├── <header class="app-header">
    │   ├── <div class="header-inner">
    │   │   ├── <div class="brand-block"> (Logo + Latitude/Longitude flourish)
    │   │   └── <button id="token-settings-trigger"> (API Key status & drawer toggle)
    ├── <aside id="token-drawer" class="drawer" aria-hidden="true">
    │   ├── <div class="drawer-overlay">
    │   └── <div class="drawer-content"> (Token input, save/clear, backend status)
    ├── <main class="app-main">
    │   ├── <section class="hero-section">
    │   │   ├── <div class="carto-badge"> East Africa // Fikra-Pro 120B
    │   │   ├── <h1 class="hero-title"> Map Meaning & Phonetics Across Tongues
    │   │   └── <p class="hero-subtitle"> ...
    │   └── <div class="carto-card">
    │       ├── <div role="tablist" class="mode-tabs">
    │       │   ├── <button id="tab-text-mode" role="tab" aria-selected="true">
    │       │   └── <button id="tab-file-mode" role="tab" aria-selected="false">
    │       ├── <div class="language-bar">
    │       │   ├── <div class="lang-select-group"> (Source select)
    │       │   ├── <button id="swap-lang-btn"> (Swap languages)
    │       │   ├── <div class="lang-select-group"> (Target select)
    │       │   └── <div class="iso-group"> (ISO 639-1 code input)
    │       ├── <div class="tab-panels">
    │       │   ├── <form id="text-translate-form" role="tabpanel"> (Text area)
    │       │   └── <form id="file-translate-form" role="tabpanel" hidden> (Dropzone)
    │       ├── <div id="job-progress-card" class="progress-card" hidden> (SSE state)
    │       ├── <div id="error-banner" class="alert-banner" hidden role="alert"> (Error detail)
    │       └── <section id="result-view" class="result-section" hidden>
    │           ├── <div class="full-translation-block"> (Blockquote + Copy button)
    │           └── <div class="word-analysis-block"> (Word-by-word table & cards)
    └── <footer class="app-footer">
        └── <div class="footer-inner"> (Attribution + System info + Keyboard shortcut tip)
```

---

## 3. UI Component Specifications & Structural Wireframe

### 3.1 Header & Thesis Hero Section

The header combines brand identity with real-time operational context (latitude/longitude coordinates of East Africa, referencing the origin story of `fikra-pro-120b`).

```html
<header class="app-header">
  <div class="header-inner">
    <div class="brand-block">
      <div class="brand-logo" aria-hidden="true">
        <svg class="carto-compass-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">SLM</span>
        <span class="brand-tagline">Sound & Language Mapper</span>
      </div>
    </div>

    <!-- Cartographic Coordinate Flourish -->
    <div class="carto-coords" aria-hidden="true">
      <span class="coord-dot"></span> LAT 0.0213° S • LON 37.9062° E
    </div>

    <!-- Unobtrusive Token Settings Trigger -->
    <button id="token-settings-trigger" 
            class="btn-token-settings" 
            aria-expanded="false" 
            aria-controls="token-drawer" 
            title="Configure API Authorization Token">
      <span class="token-status-indicator" id="token-status-dot" data-status="missing" aria-hidden="true"></span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 2l-2 2m-1.5 1.5l-3 3m-6.5 6.5l-3 3-4 1 1-4 3-3m5.5-5.5l-3 3"/>
      </svg>
      <span class="token-btn-text">API Key Token</span>
    </button>
  </div>
</header>

<section class="hero-section">
  <div class="hero-badge">
    <span class="badge-icon">🌐</span> East African AI Engine • Fikra-Pro 120B
  </div>
  <h1 class="hero-title">Map Meaning & Phonetics Across Tongues</h1>
  <p class="hero-subtitle">
    Translate written passages or scanned documents into precise cross-cultural text with word-level phonetic breakdowns and pronunciation mapping.
  </p>
</section>
```

---

### 3.2 Unobtrusive API Authorization Token Drawer

Requirements dictate that authentication token management must be unobtrusive, residing outside the primary translation flow while remaining easily accessible.

```html
<aside id="token-drawer" class="drawer-modal" aria-hidden="true" role="dialog" aria-labelledby="drawer-title">
  <div class="drawer-backdrop" id="drawer-backdrop" tabindex="-1"></div>
  <div class="drawer-panel" role="document">
    <div class="drawer-header">
      <div class="drawer-title-group">
        <h2 id="drawer-title" class="drawer-title">API Authorization</h2>
        <span class="drawer-subtitle">Configure Bearer token for backend access</span>
      </div>
      <button id="close-drawer-btn" class="btn-close" aria-label="Close API authorization panel">✕</button>
    </div>

    <div class="drawer-body">
      <p class="drawer-instruction">
        All requests to <code>http://localhost:8000/api</code> require a valid Bearer token. Enter your key below; it will be stored securely in your browser's <code>localStorage</code>.
      </p>

      <div class="form-group">
        <label for="api-token-input" class="form-label">Bearer Token</label>
        <div class="input-with-action">
          <input type="password" 
                 id="api-token-input" 
                 class="form-input" 
                 placeholder="Paste your token here (e.g. slm_live_...)" 
                 autocomplete="off" 
                 spellcheck="false">
          <button type="button" id="toggle-token-vis" class="btn-icon-subtle" aria-label="Toggle token visibility">
            👁️
          </button>
        </div>
        <span class="form-hint">Token is transmitted in the <code>Authorization: Bearer</code> header.</span>
      </div>

      <div id="token-status-msg" class="token-status-msg" role="status" aria-live="polite">
        <!-- Dynamic message: "Token configured" / "No token set" -->
      </div>
    </div>

    <div class="drawer-footer">
      <button type="button" id="save-token-btn" class="btn-primary">Save Token</button>
      <button type="button" id="clear-token-btn" class="btn-secondary">Clear Token</button>
    </div>
  </div>
</aside>
```

---

### 3.3 Mode Switcher & Language Selector Controls

The workspace card contains tab buttons for switching modes ("Type Text" vs "Upload File") and unified language controls.

```html
<div class="carto-card workspace-card">
  <!-- Mode Switcher Tabs -->
  <div role="tablist" class="mode-tabs" aria-label="Translation Input Mode">
    <button id="tab-text-mode" 
            class="tab-btn active" 
            role="tab" 
            aria-selected="true" 
            aria-controls="panel-text-mode"
            tabindex="0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
      Type Text
    </button>
    
    <button id="tab-file-mode" 
            class="tab-btn" 
            role="tab" 
            aria-selected="false" 
            aria-controls="panel-file-mode"
            tabindex="-1">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      Upload File
    </button>
  </div>

  <!-- Language Selection Bar -->
  <div class="language-bar">
    <div class="lang-select-group">
      <label for="source-lang-select" class="form-label-sm">Source Language</label>
      <select id="source-lang-select" class="form-select" required>
        <option value="auto">Auto Detect</option>
        <option value="English" selected>English</option>
        <option value="Swahili">Swahili (Kiswahili)</option>
        <option value="Amharic">Amharic (አማርኛ)</option>
        <option value="Oromo">Oromo (Afaan Oromoo)</option>
        <option value="Somali">Somali (Af-Soomaali)</option>
        <option value="Luganda">Luganda</option>
        <option value="Kinyarwanda">Kinyarwanda</option>
        <option value="French">French (Français)</option>
        <option value="Arabic">Arabic (العربية)</option>
      </select>
    </div>

    <button type="button" id="swap-lang-btn" class="btn-swap-lang" aria-label="Swap source and target languages" title="Swap languages">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="17 1 21 5 17 9"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <polyline points="7 23 3 19 7 15"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    </button>

    <div class="lang-select-group">
      <label for="target-lang-select" class="form-label-sm">Target Language</label>
      <select id="target-lang-select" class="form-select" required>
        <option value="Swahili" selected>Swahili (Kiswahili)</option>
        <option value="English">English</option>
        <option value="Amharic">Amharic (አማርኛ)</option>
        <option value="Oromo">Oromo (Afaan Oromoo)</option>
        <option value="Somali">Somali (Af-Soomaali)</option>
        <option value="Luganda">Luganda</option>
        <option value="Kinyarwanda">Kinyarwanda</option>
        <option value="French">French (Français)</option>
        <option value="Arabic">Arabic (العربية)</option>
      </select>
    </div>

    <!-- ISO Code Option (For File Upload / Text API payload compatibility) -->
    <div class="iso-code-group">
      <label for="iso-code-input" class="form-label-sm">ISO 639-1 Code <span class="optional-tag">(Optional)</span></label>
      <input type="text" 
             id="iso-code-input" 
             class="form-input-sm" 
             placeholder="e.g. en, sw, am" 
             maxlength="5" 
             autocomplete="off">
    </div>
  </div>
```

---

### 3.4 Active-Voice Form Panels & File Drag-and-Drop Area

```html
  <div class="tab-panels">
    <!-- PANEL 1: Type Text Form -->
    <form id="text-translate-form" class="tab-panel active" role="tabpanel" aria-labelledby="tab-text-mode">
      <div class="form-group">
        <div class="label-row">
          <label for="text-content-input" class="form-label">Source Text</label>
          <span id="char-counter" class="char-counter">0 characters</span>
        </div>
        <textarea id="text-content-input" 
                  class="form-textarea" 
                  rows="6" 
                  placeholder="Enter text to translate and generate word-by-word phonetic analysis..." 
                  required></textarea>
      </div>

      <div class="form-actions">
        <div class="action-hint">
          <kbd>Shift</kbd> + <kbd>Enter</kbd> to translate
        </div>
        <button type="submit" id="submit-text-btn" class="btn-accent-primary">
          <span>Translate Text</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </form>

    <!-- PANEL 2: Upload File Form -->
    <form id="file-translate-form" class="tab-panel" role="tabpanel" aria-labelledby="tab-file-mode" hidden>
      <div class="form-group">
        <label class="form-label">Upload Document or Image</label>
        
        <!-- Drag and Drop Target Box -->
        <div id="drop-zone" class="drop-zone" tabindex="0" role="button" aria-label="Upload file drop area. Click or drag file here.">
          <input type="file" 
                 id="file-input" 
                 class="file-input-hidden" 
                 accept="image/png,image/jpeg,image/webp,image/jpg,text/plain,.txt,.md,.csv" 
                 tabindex="-1">
          
          <div class="drop-zone-content" id="drop-zone-prompt">
            <div class="drop-icon-wrapper" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p class="drop-primary-text">Drag and drop file here, or <span class="browse-link">browse computer</span></p>
            <p class="drop-secondary-text">Supported: PNG, JPG, WEBP (OCR scanned) or TXT, MD, CSV (Plain text). Maximum size: 10MB.</p>
          </div>

          <!-- File Selection Preview State -->
          <div id="file-preview-card" class="file-preview-card" hidden>
            <div class="file-info-block">
              <span class="file-icon" id="file-type-icon">📄</span>
              <div class="file-meta">
                <span id="file-name-display" class="file-name">document.png</span>
                <span id="file-size-display" class="file-size">1.2 MB</span>
              </div>
            </div>
            <button type="button" id="remove-file-btn" class="btn-remove-file" aria-label="Remove selected file">
              ✕
            </button>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" id="submit-file-btn" class="btn-accent-primary" disabled>
          <span>Translate File</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
    </form>
  </div>
```

---

### 3.5 Live SSE Job Progress Indicator

The backend returns a `job_id` and streams SSE updates via `/api/status/:job_id`. The progress UI visualizes four explicit states: `connecting`, `processing`, `completed`, and `failed`.

```html
<div id="job-progress-card" class="progress-card" hidden role="region" aria-live="polite" aria-label="Translation Job Progress">
  <div class="progress-header">
    <div class="progress-title-block">
      <span id="progress-spinner" class="spinner" aria-hidden="true"></span>
      <h3 id="progress-heading" class="progress-heading">Processing Translation...</h3>
    </div>
    <div id="job-status-badge" class="badge-status" data-status="processing">
      <span class="badge-dot"></span>
      <span id="job-status-text">Processing</span>
    </div>
  </div>

  <div class="progress-body">
    <!-- Animated Cartographic Waveform Bridge -->
    <div class="carto-waveform-bridge" aria-hidden="true">
      <div class="waveform-bar bar-1"></div>
      <div class="waveform-bar bar-2"></div>
      <div class="waveform-bar bar-3"></div>
      <div class="waveform-bar bar-4"></div>
      <div class="waveform-bar bar-5"></div>
      <div class="waveform-bar bar-6"></div>
    </div>

    <div class="progress-track">
      <div id="progress-bar-fill" class="progress-fill" style="width: 35%;"></div>
    </div>

    <div class="progress-meta-row">
      <span class="job-id-display">Job Reference: <code id="current-job-id">--</code></span>
      <span id="progress-message" class="progress-message">Establishing EventSource connection...</span>
    </div>
  </div>
</div>
```

---

### 3.6 Result View: Prominent Full Translation & Word-by-Word Table/Card List

Upon job completion (`status: "completed"`), the application unveils the dual-part result presentation.

```html
<section id="result-view" class="result-section" hidden role="region" aria-label="Translation Results">
  <div class="result-header">
    <div class="result-title-group">
      <h2 class="result-title">Translation Result</h2>
      <span class="result-meta-pill">
        <span id="res-source-lang-name">English</span>
        <span class="arrow-sep">→</span>
        <span id="res-target-lang-name">Swahili</span>
      </span>
    </div>

    <button id="copy-translation-btn" class="btn-copy" aria-label="Copy full translation to clipboard">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
      <span id="copy-btn-text">Copy Translation</span>
    </button>
  </div>

  <!-- Prominent Full Translation Box -->
  <div class="full-translation-card">
    <blockquote id="full-translation-text" class="full-translation-content">
      <!-- Dynamic full_translation text content inserted here -->
    </blockquote>
  </div>

  <!-- Word-by-Word Phonetic Mapping Section -->
  <div class="word-breakdown-section">
    <div class="breakdown-header">
      <h3 class="breakdown-title">
        Phonetic & Word-by-Word Breakdown
      </h3>
      <span id="word-count-badge" class="badge-count">0 Words</span>
    </div>

    <!-- Desktop / Tablet Table View (semantic <table>) -->
    <div class="table-responsive-wrapper">
      <table class="word-mapping-table" aria-label="Word-by-word translation and pronunciation table">
        <thead>
          <tr>
            <th scope="col">Source Word</th>
            <th scope="col">Translated Word</th>
            <th scope="col">Pronunciation / Phonetics</th>
          </tr>
        </thead>
        <tbody id="word-table-body">
          <!-- Dynamic <tr> rows inserted via JS -->
          <!-- Sample Row Structure:
          <tr>
            <td class="cell-source"><strong class="word-src">Jambo</strong></td>
            <td class="cell-translated"><span class="word-tgt">Hello</span></td>
            <td class="cell-pronunciation"><span class="phonetic-tag">[DJAHM-boh]</span></td>
          </tr>
          -->
        </tbody>
      </table>
    </div>

    <!-- Mobile Responsive Card View (visible @media max-width: 640px) -->
    <div id="word-card-grid" class="word-card-grid" aria-label="Word-by-word list cards">
      <!-- Dynamic card items inserted via JS for touch devices -->
    </div>
  </div>
</section>
```

---

### 3.7 Error View & Guidance Banner

If an API request fails, network drops, token is invalid, or job status reports `"failed"`, this alert banner presents the error `detail` alongside immediate actionable next steps.

```html
<div id="error-banner" class="alert-banner alert-error" hidden role="alert" aria-live="assertive">
  <div class="alert-icon-wrapper" aria-hidden="true">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  </div>

  <div class="alert-content">
    <div class="alert-header">
      <h4 id="error-title" class="alert-title">Translation Failed</h4>
      <button id="dismiss-error-btn" class="btn-dismiss-alert" aria-label="Dismiss error notification">✕</button>
    </div>

    <p id="error-detail-text" class="alert-detail">
      <!-- Dynamic error detail string from API or SSE payload -->
    </p>

    <div class="alert-guidance">
      <span class="guidance-label">Recommended Action:</span>
      <ul id="error-guidance-list" class="guidance-list">
        <li>Open the <strong>API Key Token</strong> settings drawer at top right and confirm your Bearer token.</li>
        <li>Ensure backend service is accessible at <code>http://localhost:8000</code>.</li>
        <li>If uploading an image, ensure text is legible and file size is under 10MB.</li>
      </ul>
    </div>
  </div>
</div>
```

---

### 3.8 Cartographic Footer Section

```html
<footer class="app-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <span class="footer-title">SLM Language Cartography Engine</span>
      <span class="footer-copy">© 2026 SLM Project. East African AI Proof-of-Concept.</span>
    </div>

    <div class="footer-system-info">
      <span class="info-pill">Backend: <code>http://localhost:8000</code></span>
      <span class="info-pill">Model: <code>Fikra-Pro 120B</code></span>
    </div>

    <div class="footer-hint">
      Press <kbd>Shift</kbd> + <kbd>Enter</kbd> to execute translation
    </div>
  </div>
</footer>
```

---

## 4. DOM State Management & Event Attributes Matrix

To maintain pure vanilla JS architecture without heavy external state libraries, the single-page application relies on explicit HTML attributes (`data-*`, `hidden`, `aria-*`) for state reflections.

| UI Component | Trigger Event | Target Element(s) | DOM Attribute Modification |
|---|---|---|---|
| **Token Drawer** | Click `#token-settings-trigger` | `#token-drawer`, `#token-backdrop` | Toggle `aria-hidden="false/true"`, set focus to `#api-token-input` |
| **Token Indicator** | LocalStorage token change | `#token-status-dot` | Set `data-status="configured"` vs `data-status="missing"` |
| **Tab Switcher** | Click `#tab-text-mode` / `#tab-file-mode` | `.tab-btn`, `.tab-panel` | Toggle `aria-selected`, toggle `hidden` on panels, shift focus |
| **Language Swap** | Click `#swap-lang-btn` | `#source-lang-select`, `#target-lang-select` | Swap option `value` attributes |
| **File Drag Over** | Drag over `#drop-zone` | `#drop-zone` | Add `.drag-over` CSS class |
| **File Selection** | File drop or input change | `#drop-zone-prompt`, `#file-preview-card`, `#submit-file-btn` | Hide `#drop-zone-prompt`, reveal `#file-preview-card`, set `#submit-file-btn.disabled = false` |
| **Job Progress** | SSE stream initiated | `#job-progress-card`, `#result-view`, `#error-banner` | Show `#job-progress-card` (`hidden=false`), hide `#result-view` & `#error-banner` |
| **Job Progress Update**| SSE message payload | `#progress-bar-fill`, `#job-status-text`, `#job-status-badge` | Update `width: X%`, set `data-status="connecting/processing/completed/failed"` |
| **Job Completed** | SSE `status: "completed"` | `#job-progress-card`, `#result-view` | Hide `#job-progress-card`, reveal `#result-view` |
| **Job Failed** | SSE `status: "failed"` / HTTP Error | `#job-progress-card`, `#error-banner` | Hide `#job-progress-card`, reveal `#error-banner` |
| **Copy Translation** | Click `#copy-translation-btn` | `#copy-btn-text` | Temporarily set text to "Copied!" for 2000ms |

---

## 5. Responsive Breakpoint Layout Strategy

The CSS layout uses a fluid, mobile-first design system supporting resolutions from 375px mobile screens up to 1440px desktop displays.

```css
/* Responsive Breakpoint Matrix */

/* 1. Mobile Default (375px - 639px) */
/* Single-column stacked layout, touch-friendly min height targets (44px) */
.header-inner {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}
.carto-coords {
  display: none; /* Hide coordinate flourish on narrow mobile to save header space */
}
.language-bar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.btn-swap-lang {
  align-self: center;
  transform: rotate(90deg); /* Vertical arrow swap on mobile stack */
}
.word-mapping-table {
  display: none; /* Hide traditional table on mobile */
}
.word-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

/* 2. Tablet / Small Laptop (640px - 1023px) */
@media (min-width: 640px) {
  .header-inner {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .carto-coords {
    display: inline-flex;
  }
  .language-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 1rem;
  }
  .btn-swap-lang {
    transform: rotate(0deg);
  }
  .iso-code-group {
    grid-column: span 3;
  }
  .word-mapping-table {
    display: table;
    width: 100%;
  }
  .word-card-grid {
    display: none;
  }
}

/* 3. Desktop / Large Screens (1024px+) */
@media (min-width: 1024px) {
  .app-main {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
  }
  .language-bar {
    grid-template-columns: 1fr auto 1fr 180px;
  }
  .iso-code-group {
    grid-column: span 1;
  }
  .drawer-panel {
    width: 440px;
  }
}
```

---

## 6. Accessibility (a11y) & Semantic Specifications

1. **Semantic Structure**: Proper usage of HTML5 `<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`, `<h1>`-`<h4>`, `<blockquote`, and `<table>`.
2. **Keyboard Navigation**:
   - Tab switching uses `role="tablist"`, `role="tab"`, and `aria-selected` attributes with arrow key navigation support.
   - Drawer trap focus when opened; `Escape` key closes the drawer.
   - Text area supports `Shift + Enter` keyboard submission.
3. **Screen Reader Announcements**:
   - `aria-live="polite"` on `#job-progress-card` and `#token-status-msg`.
   - `aria-live="assertive"` and `role="alert"` on `#error-banner`.
   - Explicit `<label>` links (`for="..."`) for all inputs, selects, and textareas.
4. **Color Contrast**: Parchment Gold (`#E6C875`) on Obsidian Ink (`#0F141C`) yields a high contrast ratio exceeding 7:1 (WCAG AAA compliant).

---

## 7. Next Steps for Implementation (M2 Synthesis)

When synthesizing `index.html` in Milestone 2:
- Embed Google Fonts (`Fraunces` and `Plus Jakarta Sans`) directly in `<head>`.
- Use CSS custom properties defined by Explorer 1 (`--color-obsidian`, `--color-gold`, `--color-indigo`, etc.).
- Bind JavaScript event listeners to the DOM selectors listed in Section 4 matching Explorer 2's backend client handlers.
