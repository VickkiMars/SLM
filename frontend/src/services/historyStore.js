/**
 * historyStore.js
 * Client-side reading history backed by localStorage.
 * Replaces the server-side /api/history + better-sqlite3 stack entirely.
 *
 * Storage key: "slm_history"
 * Shape: { sessions: Session[] }
 *
 * Session shape:
 * {
 *   id: string (UUID),
 *   title: string,
 *   source_text: string,
 *   source_text_snippet: string,
 *   original_language: string,
 *   target_language: string,
 *   full_translation: string,
 *   token_metadata: object,   // { full_translation, words[] }
 *   word_count: number,
 *   character_count: number,
 *   tags: string[],
 *   is_bookmarked: boolean,
 *   created_at: string (ISO),
 *   updated_at: string (ISO),
 * }
 */

const STORAGE_KEY = 'slm_history';
const MAX_SESSIONS = 200; // cap to avoid blowing localStorage quota

// ── helpers ─────────────────────────────────────────────────────────────────

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessions: [] };
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.sessions) ? parsed : { sessions: [] };
  } catch {
    return { sessions: [] };
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    // localStorage quota exceeded — prune oldest 20 and retry
    if (e?.name === 'QuotaExceededError') {
      store.sessions = store.sessions.slice(0, store.sessions.length - 20);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
    }
  }
}

function buildSnippet(text, maxLen = 120) {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text;
}

// ── public API ───────────────────────────────────────────────────────────────

/**
 * Save a new reading session.
 * @param {object} data
 * @returns {object} the saved session
 */
export function saveSession({
  title,
  source_text = '',
  original_language = 'Auto',
  target_language = 'English',
  full_translation = '',
  token_metadata = null,
  tags = [],
  is_bookmarked = false,
}) {
  const store = readStore();
  const now = new Date().toISOString();
  const id = generateId();

  const autoTitle = title || (source_text.trim().slice(0, 40) + (source_text.length > 40 ? '...' : ''));
  const wordCount = source_text.trim().split(/\s+/).filter(Boolean).length;

  const session = {
    id,
    title: autoTitle,
    source_text,
    source_text_snippet: buildSnippet(source_text),
    original_language,
    target_language,
    full_translation,
    token_metadata: token_metadata ?? null,
    word_count: wordCount,
    character_count: source_text.length,
    tags: Array.isArray(tags) ? tags : [],
    is_bookmarked: Boolean(is_bookmarked),
    created_at: now,
    updated_at: now,
  };

  // Prepend newest first, enforce cap
  store.sessions = [session, ...store.sessions].slice(0, MAX_SESSIONS);
  writeStore(store);
  return session;
}

/**
 * Get all sessions, optionally filtered/searched.
 * @param {{ query?: string, language?: string, bookmarkedOnly?: boolean }} opts
 * @returns {object[]}
 */
export function getAllSessions({ query = '', language = '', bookmarkedOnly = false } = {}) {
  const { sessions } = readStore();

  return sessions.filter((s) => {
    if (bookmarkedOnly && !s.is_bookmarked) return false;
    if (language && language !== 'All' && s.original_language?.toLowerCase() !== language.toLowerCase()) return false;
    if (query) {
      const q = query.toLowerCase();
      const haystack = `${s.title} ${s.source_text} ${(s.tags || []).join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/**
 * Get a single session by ID.
 * @param {string} id
 * @returns {object|null}
 */
export function getSessionById(id) {
  const { sessions } = readStore();
  return sessions.find((s) => s.id === id) ?? null;
}

/**
 * Update a session's mutable fields (is_bookmarked, title, tags).
 * @param {string} id
 * @param {{ is_bookmarked?: boolean, title?: string, tags?: string[] }} updates
 * @returns {object|null} updated session or null if not found
 */
export function updateSession(id, updates) {
  const store = readStore();
  const idx = store.sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;

  store.sessions[idx] = {
    ...store.sessions[idx],
    ...('is_bookmarked' in updates ? { is_bookmarked: Boolean(updates.is_bookmarked) } : {}),
    ...('title' in updates ? { title: updates.title } : {}),
    ...('tags' in updates ? { tags: updates.tags } : {}),
    updated_at: new Date().toISOString(),
  };

  writeStore(store);
  return store.sessions[idx];
}

/**
 * Delete a session by ID.
 * @param {string} id
 * @returns {boolean} true if deleted
 */
export function deleteSession(id) {
  const store = readStore();
  const before = store.sessions.length;
  store.sessions = store.sessions.filter((s) => s.id !== id);
  writeStore(store);
  return store.sessions.length < before;
}

/**
 * Clear all history (used for testing / "clear all" feature).
 */
export function clearAllSessions() {
  writeStore({ sessions: [] });
}
