# Project: SLM Single-Page Web Frontend

## Architecture
- Single-page application in `/home/kami/Desktop/codebase/slm/frontend/index.html` (vanilla HTML/CSS/JS, no build step required).
- Communicates directly with backend running at `http://localhost:8000`.
- API endpoints:
  - `POST /api/text/translate` (JSON: `{original_language, target_language, content}`)
  - `POST /api/upload/translate` (FormData: `file`, `original_language`, `target_language`, `original_iso639-1_code`)
  - `GET /api/status/:job_id` (SSE EventSource stream with Bearer token)
  - `GET /api/user/getdetails` (User info)
- Authentication: Bearer token stored in `localStorage` and configured via unobtrusive drawer/top-bar UI.
- Visual Identity: "Language Cartographer's Tool"
  - Palette: Deep Obsidian (`#0F141C`), Parchment Gold (`#E6C875`), Indigo Ink (`#2B3A55`), Terracotta Copper (`#D96B43`), Crisp Ivory (`#F5F7FA`)
  - Fonts: Display (Fraunces), Body/Interface (Plus Jakarta Sans)
  - Signature element: Interactive Phonetic & Cartographic Coordinate Overlay / Waveform Bridge
  - Documented in CSS comment block.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Design & Visual Identity Architecture | Formulate frontend design plan, font pairings, cartographic layout, signature element, and CSS token/comment specifications | None | DONE |
| 2 | SPA Implementation | Build `index.html` with text translate, file upload, auth drawer, SSE polling, word-by-word result display, error states, and responsive styling (375px+) | M1 | DONE |
| 3 | E2E Testing, Review & Audit | Run verification tests against live/mock API flow, conduct independent code review, challenger stress testing, and forensic integrity audit | M2 | DONE |

## Code Layout
- `/home/kami/Desktop/codebase/slm/frontend/index.html` — Main SPA containing semantic markup, inline CSS design tokens/styles, and JavaScript application logic.
