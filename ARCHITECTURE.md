# SLM Overhaul Architecture & Design Specification

## Overview
This document specifies the architectural transition of SLM from Google Translate web client drivers and JSON file storage to OpenAI structured output generation and a high-performance SQLite database equipped with application-level Row-Level Security (RLS).

---

## 1. OpenAI Translation Engine & Structured Data Pipeline

### Key Architecture Components
1. **SDK & Client Configuration**: Standardized `openai` client instantiation supporting configurable `OPENAI_API_KEY`, `OPENAI_MODEL` (default: `gpt-4o-mini`), and custom base URLs if needed (`OPENAI_BASE_URL` / Fikra proxy).
2. **Structured Outputs & Schema Specification**:
   Translation responses adhere to the following strict JSON Schema:
   ```json
   {
     "type": "object",
     "properties": {
       "source_language": { "type": "string" },
       "target_language": { "type": "string" },
       "full_translation": { "type": "string" },
       "words": {
         "type": "array",
         "items": {
           "type": "object",
           "properties": {
             "source_word": { "type": "string" },
             "translated_word": { "type": "string" },
             "pronunciation": { "type": "string" },
             "is_space": { "type": "boolean" },
             "is_newline": { "type": "boolean" },
             "is_punct": { "type": "boolean" }
           },
           "required": ["source_word", "translated_word", "pronunciation"]
         }
       }
     },
     "required": ["full_translation", "words"]
   }
   ```
3. **Custom Vocabulary Integration**:
   User-provided custom vocabulary overrides (`word::meaning::pronunciation`) are injected into the system prompt and applied post-processing to guarantee exact term translations.

---

## 2. SQLite Database Engine

### Storage File & Schema
Database file: `data/slm.db` (managed via `better-sqlite3`).

#### Schema Definition:
```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reading_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_text TEXT NOT NULL,
  original_language TEXT NOT NULL DEFAULT 'Auto',
  target_language TEXT NOT NULL DEFAULT 'English',
  full_translation TEXT,
  token_metadata TEXT, -- JSON string of structured words & full_translation
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  tags TEXT, -- JSON array string
  is_bookmarked INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON reading_sessions(user_id, created_at DESC);
```

---

## 3. SQLite Application-Level Row-Level Security (RLS)

SQLite does not feature native PostgreSQL `CREATE POLICY` statements. RLS is enforced at two distinct security layers:

1. **Security-Context DAL (Data Access Layer)**:
   All database methods in `services/dbService.js` and `services/historyService.js` require an explicit `SecurityContext` (`{ user_id }`). SQL queries automatically bind and enforce `WHERE user_id = ?`.
2. **Immutability & Integrity Triggers**:
   SQLite triggers prevent unauthorized updates that attempt to change record ownership across tenants:
   ```sql
   CREATE TRIGGER IF NOT EXISTS enforce_session_user_id_immutability
   BEFORE UPDATE OF user_id ON reading_sessions
   FOR EACH ROW
   BEGIN
     SELECT RAISE(ABORT, 'RLS Violation: Changing user_id ownership is forbidden');
   END;
   ```
