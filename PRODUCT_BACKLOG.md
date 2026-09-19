# SLM Product Backlog

## Overview & Scope
Overhaul SLM (Sound & Language Mapper) translation engine from legacy Google Translate web scrapers/APIs to OpenAI structured data outputs, replace flat JSON file storage with SQLite database, and implement application-level Row-Level Security (RLS).

---

## Prioritized Epics & User Stories

### Epic 1: OpenAI Translation Engine & Structured Data Prompts
- **STORY-101 (P0 / Essential)**: Install & configure OpenAI SDK and environment variables (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL`).
- **STORY-102 (P0 / Essential)**: Define system prompt (`data/prompt.txt` & prompt builder) to enforce JSON structured outputs (`full_translation`, tokenized `words` with `source_word`, `translated_word`, `pronunciation`, and text layout flags).
- **STORY-103 (P0 / Essential)**: Refactor `services/translationService.js` to route translation requests to OpenAI with structured output parsing, custom vocabulary overrides, and chunking support for long texts.

### Epic 2: SQLite Database Engine & Data Migration
- **STORY-201 (P0 / Essential)**: Install SQLite database client (`better-sqlite3` or `node:sqlite`) and create database initialization script for `users` and `reading_sessions` tables.
- **STORY-202 (P0 / Essential)**: Implement `services/dbService.js` to manage SQLite connection, schema creation, indexes, and automated JSON-to-SQLite data migration from `data/history_store.json`.
- **STORY-203 (P0 / Essential)**: Refactor `services/historyService.js` to execute all session reads/writes against the SQLite database.

### Epic 3: Row-Level Security (RLS) in SQLite
- **STORY-301 (P0 / Essential)**: Implement Application-Level RLS wrapper in `services/dbService.js` enforcing mandatory `user_id` parametrization on all SQL queries.
- **STORY-302 (P1 / High)**: Add SQLite schema triggers on `reading_sessions` to prevent unauthorized cross-tenant updates or `user_id` mutation.
- **STORY-303 (P1 / High)**: Verify guest mode and authenticated user session isolation under RLS rules.

### Epic 4: Recommendations & Next Steps
- **STORY-401 (P2 / Medium)**: Implement caching layer for frequent word translations to minimize OpenAI API usage and costs.
- **STORY-402 (P2 / Medium)**: Add streaming translation response support for immediate UI feedback.
