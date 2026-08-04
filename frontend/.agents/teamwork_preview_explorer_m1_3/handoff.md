# Handoff Report — HTML Structural Wireframe & DOM Layout Strategy

**Author:** Explorer 3 (HTML Layout & UI Component Architecture Specialist)  
**Working Directory:** `/home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_3`  
**Target File:** `/home/kami/Desktop/codebase/slm/frontend/index.html`  
**Handoff Type:** Hard (Task Complete)  

---

## 1. Observation

- **Project Metadata**: Inspected `/home/kami/Desktop/codebase/slm/frontend/PROJECT.md` (lines 1-27) and `/home/kami/Desktop/codebase/slm/frontend/.agents/orchestrator/ORIGINAL_REQUEST.md` (lines 1-43).
- **Backend API Endpoints**:
  - `POST /api/text/translate` (JSON: `original_language`, `target_language`, `content`)
  - `POST /api/upload/translate` (FormData: `file`, `original_language`, `target_language`, `original_iso639-1_code`)
  - `GET /api/status/:job_id` (SSE EventSource stream)
  - `GET /api/user/getdetails`
  - Authorization: `Authorization: Bearer <token>` header required.
- **UI Component Requirements**:
  - Thesis Hero / Header section with "SLM — Sound & Language Mapper" branding, coordinate overlay flourish, and unobtrusive token settings button/drawer.
  - Tabbed Mode Switcher ("Type Text" vs "Upload File").
  - Language selector controls (Source, Target, Swap button, ISO code option).
  - Active-voice sentence case labels and button copy (`Translate Text`, `Translate File`, `Copy Translation`).
  - SSE Live Job Progress Indicator visualizing 4 distinct job states (`connecting`, `processing`, `completed`, `failed`).
  - Dual Result View (Prominent full translation block with copy-to-clipboard action, and word-by-word phonetic mapping table/cards showing `source_word`, `translated_word`, and `pronunciation`).
  - Error View banner/drawer presenting error `detail` and actionable next-step guidance.
  - Responsive layout (mobile-first down to 375px+).

---

## 2. Logic Chain

1. **Observation**: Backend requires `Authorization: Bearer <token>` for all endpoints, but requirements specify token input must remain unobtrusive.
   **Deduction**: Designed a dedicated modal drawer (`#token-drawer`) with header status indicator button (`#token-settings-trigger`) in the main header bar.

2. **Observation**: Backend exposes two translation pathways (`POST /api/text/translate` and `POST /api/upload/translate`), each with distinct payload fields (`content` vs `file` + optional `original_iso639-1_code`).
   **Deduction**: Implemented an ARIA-compliant tab switcher (`#tab-text-mode`, `#tab-file-mode`) sharing a common language selector bar, allowing seamless toggle between text area input and drag-and-drop file upload.

3. **Observation**: Job status updates stream asynchronously via Server-Sent Events (`GET /api/status/:job_id`) with 4 lifecycle states.
   **Deduction**: Designed `#job-progress-card` with an animated cartographic waveform bridge, progress bar fill, and status badge reflecting `connecting`, `processing`, `completed`, and `failed`.

4. **Observation**: Completed result includes `full_translation` text and a structured `words` array containing `source_word`, `translated_word`, and `pronunciation`.
   **Deduction**: Structured `#result-view` with a prominent blockquote card for full translation and a hybrid table/card grid (`.word-mapping-table` on desktop/tablet, `.word-card-grid` on mobile) for word-level phonetic breakdowns.

5. **Observation**: Mobile view requires smooth UX down to 375px viewport width.
   **Deduction**: Formulated CSS media query breakpoints converting grid layouts to single-column flex stacks, rotating the language swap arrow, and displaying cards instead of wide tables on touch screens.

---

## 3. Caveats

- **CSS & Design Tokens**: This analysis establishes the HTML structure and DOM selectors. Design token hex values (`#0F141C`, `#E6C875`, etc.) and font pairings (`Fraunces` / `Plus Jakarta Sans`) match `PROJECT.md`, but full CSS stylesheet rules are detailed in Explorer 1's analysis.
- **Backend Mocking**: API integration logic (EventSource, fetch calls, localStorage handling) will be authored in JavaScript during Milestone 2 based on Explorer 2's API client analysis.

---

## 4. Conclusion

The complete HTML structural wireframe and DOM element layout strategy for `index.html` has been formulated and documented in `/home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_3/analysis.md`. The design fulfills all prompt requirements, adheres to the "Language Cartographer's Tool" theme, incorporates accessibility semantics (ARIA roles and live regions), and provides responsive single-page architecture down to 375px.

---

## 5. Verification Method

To verify the HTML layout strategy:
1. Inspect `/home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_3/analysis.md` for section completeness (Header, Drawer, Mode Tabs, Forms, Progress, Result, Error, Responsive rules).
2. Validate DOM ID consistency against backend payload fields:
   - `#text-content-input` → `content`
   - `#file-input` → `file`
   - `#source-lang-select` → `original_language`
   - `#target-lang-select` → `target_language`
   - `#iso-code-input` → `original_iso639-1_code`
   - `#api-token-input` → `localStorage.getItem('slm_bearer_token')`
3. Verify that all 8 prompt sub-requirements are addressed in `analysis.md`.
