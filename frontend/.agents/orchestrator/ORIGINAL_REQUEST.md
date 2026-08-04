# Original User Request

## 2026-08-04T14:15:37Z

Build a single-page web frontend for **SLM** — an AI-powered translation service that accepts typed text or uploaded files and returns a full translation plus a word-by-word breakdown with pronunciation. The page must work end-to-end against the existing Node.js backend running at `http://localhost:8000`, demonstrating the complete translate → poll → display result flow in a premium, distinctive visual identity.

Working directory: /home/kami/Desktop/codebase/slm/frontend
Integrity mode: development

---

## Design Brief (frontend-design skill)

The product's origin story: started in July 2026 as a Python FastAPI proof-of-concept wrapping the `fikra-pro-120b` model — an East African AI API (`fikraapi.co.ke`). The soul of SLM is **language as living material**: it doesn't just translate words, it maps pronunciation and meaning across tongues. The visual identity should feel like a language cartographer's tool — precise, cross-cultural, slightly scholarly, but alive.

Apply the **frontend-design** skill throughout:
- Ground every design decision in the subject — language, scripts, multilingual typography
- Open with a thesis hero that is characteristic of the product's world
- Pair typefaces deliberately (not defaults): a characterful display face + a complementary body
- Take **one real aesthetic risk** and be able to justify it
- Avoid the three AI design defaults: warm-cream/terracotta serif, near-black/acid-green, broadsheet hairline
- Write all UI copy from the end user's side of the screen — active voice, sentence case, no filler
- Errors state what happened and what to do next; never vague

---

## Requirements

### R1. Translation Interface
The page must provide a way to translate text by typing it in directly, with inputs for source and target language. After submitting, the page connects to `POST /api/text/translate` on the backend, receives a `job_id`, then polls `GET /api/status/:job_id` via Server-Sent Events until the job is complete. The result — `full_translation` and the `words` array (each with `source_word`, `translated_word`, `pronunciation`) — must be displayed clearly.

### R2. File Upload Translation
The page must also support uploading a file (image or plain text) for translation, sent to `POST /api/upload/translate`. Image files go through OCR on the backend before translation. The same SSE polling flow applies. The UI must make clear what file types are supported.

### R3. Result Display
The completed translation result must show: (a) the full translation in a prominent block, and (b) the word-by-word table with source word, translated word, and pronunciation for each entry. If the job fails (`status: "failed"`), display the `detail` error message with guidance on what to do next.

### R4. Authentication
All API requests require a Bearer token in the `Authorization` header. The page must include a way to supply this token (e.g., a settings drawer, input at the top, or stored in `localStorage`). The token field should not be in the main flow — it should be unobtrusive but accessible.

### R5. Visual Identity (frontend-design)
The visual design must be distinctive, opinionated, and specific to a multilingual AI translation tool. Every color, typeface, and layout decision must be traceable to a deliberate choice for *this* product. The design plan must be documented in a short comment block at the top of the main CSS file (or at the top of a `<style>` block if inline), listing: palette (hex values), typeface roles, layout concept, and the single signature element.
