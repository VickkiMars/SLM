const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'slm.db');
const JSON_STORE_PATH = path.join(DATA_DIR, 'history_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite Database with WAL (Write-Ahead Logging) mode for optimal performance
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize Database Schema and RLS Triggers
 */
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
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
      token_metadata TEXT,
      word_count INTEGER DEFAULT 0,
      character_count INTEGER DEFAULT 0,
      tags TEXT,
      is_bookmarked INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON reading_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON reading_sessions(user_id, created_at DESC);

    -- RLS Immutability Trigger: Prevent unauthorized user_id modification
    CREATE TRIGGER IF NOT EXISTS enforce_session_user_id_immutability
    BEFORE UPDATE OF user_id ON reading_sessions
    FOR EACH ROW
    WHEN OLD.user_id IS NOT NEW.user_id
    BEGIN
      SELECT RAISE(ABORT, 'RLS Violation: Changing session user_id ownership is strictly forbidden');
    END;
  `);

  // Auto-migrate legacy JSON store if present
  migrateFromJsonStore();
}

/**
 * Automatic Migration from data/history_store.json to SQLite DB
 */
function migrateFromJsonStore() {
  if (!fs.existsSync(JSON_STORE_PATH)) return;

  try {
    const raw = fs.readFileSync(JSON_STORE_PATH, 'utf8');
    const store = JSON.parse(raw);

    if (!store || !Array.isArray(store.sessions) || store.sessions.length === 0) {
      return;
    }

    console.log(`[dbService] Found legacy JSON history store with ${store.sessions.length} sessions. Starting migration to SQLite...`);

    const insertUserStmt = db.prepare(`
      INSERT INTO users (id, email, name, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    const insertSessionStmt = db.prepare(`
      INSERT INTO reading_sessions (
        id, user_id, title, source_text, original_language, target_language,
        full_translation, token_metadata, word_count, character_count, tags,
        is_bookmarked, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    const migrateTx = db.transaction((sessions) => {
      let migratedCount = 0;
      for (const s of sessions) {
        if (!s.id || !s.user_id) continue;

        // Ensure user record exists
        insertUserStmt.run(
          s.user_id,
          s.user_id === 'default_guest_user' ? 'guest@slm.app' : null,
          s.user_id === 'default_guest_user' ? 'Guest User' : 'User',
          s.created_at || new Date().toISOString()
        );

        const tokenMetaStr = typeof s.token_metadata === 'object' ? JSON.stringify(s.token_metadata) : (s.token_metadata || '{}');
        const tagsStr = Array.isArray(s.tags) ? JSON.stringify(s.tags) : '[]';

        const result = insertSessionStmt.run(
          s.id,
          s.user_id,
          s.title || 'Untitled',
          s.source_text || '',
          s.original_language || 'Auto',
          s.target_language || 'English',
          s.full_translation || '',
          tokenMetaStr,
          s.word_count || 0,
          s.character_count || (s.source_text ? s.source_text.length : 0),
          tagsStr,
          s.is_bookmarked ? 1 : 0,
          s.created_at || new Date().toISOString(),
          s.updated_at || new Date().toISOString()
        );

        if (result.changes > 0) migratedCount++;
      }
      return migratedCount;
    });

    const totalMigrated = migrateTx(store.sessions);
    console.log(`[dbService] Successfully migrated ${totalMigrated} sessions to SQLite DB.`);
  } catch (err) {
    console.error('[dbService] Error during JSON store migration:', err.message);
  }
}

/**
 * Enforce Application-Level Row Level Security (RLS)
 */
function extractUserId(securityContext) {
  const userId = typeof securityContext === 'object' ? securityContext?.user_id : securityContext;
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    throw new Error('RLS Access Denied: Valid user_id security context is required for database access.');
  }
  return userId.trim();
}

/**
 * Upsert User Record
 */
function upsertUser(user_id, email = null, name = null) {
  if (!user_id) return;
  const stmt = db.prepare(`
    INSERT INTO users (id, email, name, created_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, users.email),
      name = COALESCE(EXCLUDED.name, users.name)
  `);
  stmt.run(user_id, email, name, new Date().toISOString());
}

/**
 * Save Reading Session (RLS Enforced)
 */
function saveSession(securityContext, sessionData) {
  const userId = extractUserId(securityContext);
  upsertUser(userId);

  const {
    id,
    title,
    source_text,
    original_language = 'Auto',
    target_language = 'English',
    full_translation = '',
    token_metadata = null,
    word_count = 0,
    character_count = 0,
    tags = [],
    is_bookmarked = false,
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString()
  } = sessionData;

  const stmt = db.prepare(`
    INSERT INTO reading_sessions (
      id, user_id, title, source_text, original_language, target_language,
      full_translation, token_metadata, word_count, character_count, tags,
      is_bookmarked, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tokenMetaStr = typeof token_metadata === 'object' ? JSON.stringify(token_metadata) : (token_metadata || '{}');
  const tagsStr = Array.isArray(tags) ? JSON.stringify(tags) : '[]';

  stmt.run(
    id,
    userId,
    title,
    source_text,
    original_language,
    target_language,
    full_translation,
    tokenMetaStr,
    word_count,
    character_count,
    tagsStr,
    is_bookmarked ? 1 : 0,
    created_at,
    updated_at
  );

  return getSessionById(userId, id);
}

/**
 * Get User History (RLS Enforced: HARD-SCOPED WHERE user_id = ?)
 */
function getUserHistory(securityContext, { page = 1, limit = 20, query = '', language = '', tag = '', bookmarkedOnly = false } = {}) {
  const userId = extractUserId(securityContext);

  let whereClauses = ['user_id = ?'];
  let params = [userId];

  if (query && query.trim()) {
    whereClauses.push('(LOWER(title) LIKE ? OR LOWER(source_text) LIKE ? OR LOWER(tags) LIKE ?)');
    const q = `%${query.trim().toLowerCase()}%`;
    params.push(q, q, q);
  }

  if (language && language !== 'All') {
    whereClauses.push('LOWER(original_language) = LOWER(?)');
    params.push(language);
  }

  if (tag && tag !== 'All') {
    whereClauses.push('tags LIKE ?');
    params.push(`%"${tag}"%`);
  }

  if (bookmarkedOnly) {
    whereClauses.push('is_bookmarked = 1');
  }

  const whereSql = whereClauses.join(' AND ');

  // Total count
  const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM reading_sessions WHERE ${whereSql}`);
  const { total } = countStmt.get(...params);

  // Pagination
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const offset = (pageNum - 1) * limitNum;

  const listStmt = db.prepare(`
    SELECT id, user_id, title, source_text, original_language, target_language,
           word_count, character_count, tags, is_bookmarked, created_at, updated_at
    FROM reading_sessions
    WHERE ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const rows = listStmt.all(...params, limitNum, offset);

  const summaries = rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    title: r.title,
    source_text_snippet: r.source_text.slice(0, 120) + (r.source_text.length > 120 ? '...' : ''),
    original_language: r.original_language,
    target_language: r.target_language,
    word_count: r.word_count,
    character_count: r.character_count,
    tags: JSON.parse(r.tags || '[]'),
    is_bookmarked: Boolean(r.is_bookmarked),
    created_at: r.created_at,
    updated_at: r.updated_at
  }));

  return {
    sessions: summaries,
    total,
    page: pageNum,
    limit: limitNum,
    total_pages: Math.ceil(total / limitNum)
  };
}

/**
 * Get Session By ID (RLS Enforced: HARD-SCOPED WHERE id = ? AND user_id = ?)
 */
function getSessionById(securityContext, session_id) {
  const userId = extractUserId(securityContext);
  const stmt = db.prepare(`SELECT * FROM reading_sessions WHERE id = ? AND user_id = ?`);
  const row = stmt.get(session_id, userId);
  if (!row) return null;

  return {
    ...row,
    token_metadata: JSON.parse(row.token_metadata || '{}'),
    tags: JSON.parse(row.tags || '[]'),
    is_bookmarked: Boolean(row.is_bookmarked)
  };
}

/**
 * Update Session (RLS Enforced: HARD-SCOPED WHERE id = ? AND user_id = ?)
 */
function updateSession(securityContext, session_id, updates) {
  const userId = extractUserId(securityContext);
  const existing = getSessionById(userId, session_id);
  if (!existing) return null;

  const newTitle = updates.title !== undefined ? updates.title : existing.title;
  const newTags = updates.tags !== undefined ? JSON.stringify(updates.tags) : JSON.stringify(existing.tags);
  const newBookmarked = updates.is_bookmarked !== undefined ? (updates.is_bookmarked ? 1 : 0) : (existing.is_bookmarked ? 1 : 0);
  const updatedAt = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE reading_sessions
    SET title = ?, tags = ?, is_bookmarked = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(newTitle, newTags, newBookmarked, updatedAt, session_id, userId);
  return getSessionById(userId, session_id);
}

/**
 * Delete Session (RLS Enforced: HARD-SCOPED WHERE id = ? AND user_id = ?)
 */
function deleteSession(securityContext, session_id) {
  const userId = extractUserId(securityContext);
  const stmt = db.prepare(`DELETE FROM reading_sessions WHERE id = ? AND user_id = ?`);
  const result = stmt.run(session_id, userId);
  return result.changes > 0;
}

// Run schema initialization
initDatabase();

module.exports = {
  db,
  saveSession,
  getUserHistory,
  getSessionById,
  updateSession,
  deleteSession,
  upsertUser
};
