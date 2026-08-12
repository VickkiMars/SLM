const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'history_store.json');

// Ensure data directory and store file exist
function ensureStoreExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ sessions: [] }, null, 2), 'utf8');
  }
}

function loadStore() {
  ensureStoreExists();
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[historyService] Error reading history store, resetting:', err.message);
    return { sessions: [] };
  }
}

function saveStore(data) {
  ensureStoreExists();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Save a new reading session
 */
async function saveSession({
  user_id,
  title,
  source_text,
  original_language = 'Auto',
  target_language = 'English',
  full_translation = '',
  token_metadata = null,
  tags = [],
  is_bookmarked = false
}) {
  if (!user_id) throw new Error('user_id is required to save reading session');
  if (!source_text) throw new Error('source_text is required');

  const store = loadStore();

  // Auto-generate title if omitted
  const autoTitle = title || (source_text.trim().slice(0, 40) + (source_text.length > 40 ? '...' : ''));

  // Calculate counts
  const word_count = source_text.trim().split(/\s+/).filter(Boolean).length;
  const character_count = source_text.length;

  const newSession = {
    id: crypto.randomUUID(),
    user_id,
    title: autoTitle,
    source_text,
    original_language,
    target_language,
    full_translation,
    token_metadata: token_metadata || {},
    word_count,
    character_count,
    tags: Array.isArray(tags) ? tags : [],
    is_bookmarked: Boolean(is_bookmarked),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  store.sessions.unshift(newSession); // newest first
  saveStore(store);
  return newSession;
}

/**
 * Get paginated & filtered reading sessions for a user
 */
async function getUserHistory(user_id, { page = 1, limit = 20, query = '', language = '', tag = '', bookmarkedOnly = false } = {}) {
  const store = loadStore();
  let userSessions = store.sessions.filter(s => s.user_id === user_id);

  // Search filter
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    userSessions = userSessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.source_text.toLowerCase().includes(q) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Language filter
  if (language && language !== 'All') {
    userSessions = userSessions.filter(s => s.original_language.toLowerCase() === language.toLowerCase());
  }

  // Tag filter
  if (tag && tag !== 'All') {
    userSessions = userSessions.filter(s => s.tags && s.tags.includes(tag));
  }

  // Bookmarked filter
  if (bookmarkedOnly) {
    userSessions = userSessions.filter(s => s.is_bookmarked);
  }

  const total = userSessions.length;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 20);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = userSessions.slice(startIndex, startIndex + limitNum);

  // Return lightweight summaries for list view (exclude large token_metadata)
  const summaries = paginated.map(s => ({
    id: s.id,
    user_id: s.user_id,
    title: s.title,
    source_text_snippet: s.source_text.slice(0, 120) + (s.source_text.length > 120 ? '...' : ''),
    original_language: s.original_language,
    target_language: s.target_language,
    word_count: s.word_count,
    character_count: s.character_count,
    tags: s.tags,
    is_bookmarked: s.is_bookmarked,
    created_at: s.created_at,
    updated_at: s.updated_at
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
 * Get full session by ID (including complete token_metadata)
 */
async function getSessionById(user_id, session_id) {
  const store = loadStore();
  const session = store.sessions.find(s => s.id === session_id && s.user_id === user_id);
  if (!session) return null;
  return session;
}

/**
 * Update session (title, tags, is_bookmarked)
 */
async function updateSession(user_id, session_id, updates) {
  const store = loadStore();
  const index = store.sessions.findIndex(s => s.id === session_id && s.user_id === user_id);
  if (index === -1) return null;

  const existing = store.sessions[index];
  if (updates.title !== undefined) existing.title = updates.title;
  if (updates.tags !== undefined && Array.isArray(updates.tags)) existing.tags = updates.tags;
  if (updates.is_bookmarked !== undefined) existing.is_bookmarked = Boolean(updates.is_bookmarked);

  existing.updated_at = new Date().toISOString();
  store.sessions[index] = existing;
  saveStore(store);

  return existing;
}

/**
 * Delete a session
 */
async function deleteSession(user_id, session_id) {
  const store = loadStore();
  const initialCount = store.sessions.length;
  store.sessions = store.sessions.filter(s => !(s.id === session_id && s.user_id === user_id));
  const removed = store.sessions.length < initialCount;
  if (removed) {
    saveStore(store);
  }
  return removed;
}

module.exports = {
  saveSession,
  getUserHistory,
  getSessionById,
  updateSession,
  deleteSession
};
