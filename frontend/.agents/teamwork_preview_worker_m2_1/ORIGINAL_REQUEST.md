## 2026-08-04T14:19:20Z

You are Worker 1 implementing the SLM Single-Page Web Frontend.
Working Directory: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_worker_m2_1
Target Output File: /home/kami/Desktop/codebase/slm/frontend/index.html

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Input Analysis Reports:
- Visual Identity Handoff: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_1/handoff.md
- Visual Identity Analysis: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_1/analysis.md
- API Integration Handoff: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_2/handoff.md
- API Integration Analysis: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_2/analysis.md
- UI Layout Handoff: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_3/handoff.md
- UI Layout Analysis: /home/kami/Desktop/codebase/slm/frontend/.agents/teamwork_preview_explorer_m1_3/analysis.md

Your Task:
Implement the complete single-page web app in /home/kami/Desktop/codebase/slm/frontend/index.html (vanilla HTML/CSS/JS in a single file, no build step required).

Specific Requirements:
1. CSS Design Plan Comment Block at the top of the <style> tag:
   Must list Palette (hex values), Typefaces (Fraunces, Plus Jakarta Sans, JetBrains Mono), Layout Concept ("Language Cartographer's Tool"), Signature Element (Phonetic Coordinate Grid & Script Waveform Bridge), and Aesthetic Risk (high-density cartographic instrument HUD over minimalist SaaS).
2. Google Fonts Integration:
   Include Google Fonts preloader for Fraunces, Plus Jakarta Sans, and JetBrains Mono.
3. Aesthetic & Styling:
   Implement CSS variables for the color palette (#0E1520, #182232, #222E42, #EEF4F8, #94A3B8, #E5C07B, #38BDF8, #EF4444, #10B981), dark abyssal atmosphere, cartographic reticles and grid lines, responsive layout down to 375px.
4. Semantic HTML Layout:
   - Header with title "SLM — Sound & Language Mapper", coordinates (`LAT 0.0213° S • LON 37.9062° E`), and `#token-settings-trigger` button.
   - Slide-out Auth Settings Drawer (`#token-drawer`) for token entry (stored in `localStorage` under `slm_bearer_token`).
   - Workspace mode tabs (`#tab-text-mode`, `#tab-file-mode`).
   - Shared language selection controls (`#source-lang-select`, `#target-lang-select`, `#swap-lang-btn`, `#iso-code-input`).
   - Inputs: Textarea (`#text-content-input`) with char count and drag-and-drop file dropzone (`#drop-zone` & `#file-input`) for text & image files.
   - UI Copy: Active voice, sentence case ("Translate Text", "Translate File", "Copy Translation", etc.).
   - Live Job Progress Card (`#job-progress-card`) with cartographic progress wave and status indicators (`connecting`, `processing`, `completed`, `failed`).
   - Result View (`#result-view`): prominent full translation block with Copy button, and word-by-word table/card grid displaying `words` array (`source_word`, `translated_word`, `pronunciation`).
   - Error Banner View (`#error-banner`) presenting backend `detail` error message and actionable guidance.
5. Robust Vanilla JavaScript:
   - Auth management: Reads/saves `slm_bearer_token` to `localStorage`.
   - `POST /api/text/translate` submission.
   - `POST /api/upload/translate` multipart upload.
   - Custom SSE reader via `fetch()` + `ReadableStream` + `TextDecoder` to target `http://localhost:8000/api/status/:job_id` with `Authorization: Bearer <token>` header, reading `data: ...` chunks.
   - Safe parsing of `output` field when status is "complete".
   - Handling HTTP 401/400 errors and worker "failed" statuses by rendering `error.detail` and remediation guidance.
