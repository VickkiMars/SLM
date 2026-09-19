# Sprint 1: OpenAI Migration, Structured Outputs & SQLite RLS

**Sprint Goal:** Successfully migrate translation engine to OpenAI structured JSON generation, transition history storage to SQLite DB with application-level Row-Level Security (RLS), and ensure 100% backward compatibility with existing reading history and frontend components.

---

## Committed Backlog Items

| Story ID | Description | Priority | Assigned File(s) | Status |
|---|---|---|---|---|
| **STORY-101** | Install & configure dependencies (`better-sqlite3`, `openai`) | P0 | `package.json` | Planned |
| **STORY-102** | Structured Output Prompts for OpenAI | P0 | `data/prompt.txt`, `services/promptService.js` | Planned |
| **STORY-103** | OpenAI Translation Driver Implementation | P0 | `services/translationService.js` | Planned |
| **STORY-201** | SQLite DB Initialization & Schema | P0 | `services/dbService.js` | Planned |
| **STORY-202** | Automatic Data Migration from `history_store.json` | P0 | `services/dbService.js` | Planned |
| **STORY-203** | History Service Refactoring to SQLite | P0 | `services/historyService.js` | Planned |
| **STORY-301** | SQLite Row-Level Security (RLS) Enforcement Layer | P0 | `services/dbService.js` | Planned |

---

## Definition of Done (DoD)
1. Translation engine calls OpenAI API and returns structured JSON with `full_translation` and tokenized `words` list.
2. All translation and history operations read and write to SQLite DB (`data/slm.db`).
3. Existing records in `data/history_store.json` are automatically migrated to SQLite on startup.
4. All SQLite database operations enforce RLS by requiring and validating `user_id` on every query.
5. Server starts cleanly and passes API verification endpoints.
