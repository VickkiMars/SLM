const dbService = require('./dbService');
const crypto = require('crypto');

/**
 * Save a new reading session to SQLite (RLS Enforced)
 */
async function saveSession({
  user_id = 'default_user',
  title,
  source_text,
  original_language = 'Auto',
  target_language = 'English',
  full_translation = '',
  token_metadata = null,
  tags = [],
  is_bookmarked = false
}) {
  const uid = user_id || 'default_user';
  if (!source_text) throw new Error('source_text is required');

  const autoTitle = title || (source_text.trim().slice(0, 40) + (source_text.length > 40 ? '...' : ''));
  const word_count = source_text.trim().split(/\s+/).filter(Boolean).length;
  const character_count = source_text.length;
  const id = crypto.randomUUID();

  return dbService.saveSession(uid, {
    id,
    title: autoTitle,
    source_text,
    original_language,
    target_language,
    full_translation,
    token_metadata,
    word_count,
    character_count,
    tags,
    is_bookmarked
  });
}

/**
 * Get paginated & filtered reading sessions for a user from SQLite (RLS Enforced)
 */
async function getUserHistory(user_id, options = {}) {
  return dbService.getUserHistory(user_id, options);
}

/**
 * Get full session by ID from SQLite (RLS Enforced)
 */
async function getSessionById(user_id, session_id) {
  return dbService.getSessionById(user_id, session_id);
}

/**
 * Update session (title, tags, is_bookmarked) in SQLite (RLS Enforced)
 */
async function updateSession(user_id, session_id, updates) {
  return dbService.updateSession(user_id, session_id, updates);
}

/**
 * Delete a session from SQLite (RLS Enforced)
 */
async function deleteSession(user_id, session_id) {
  return dbService.deleteSession(user_id, session_id);
}

module.exports = {
  saveSession,
  getUserHistory,
  getSessionById,
  updateSession,
  deleteSession
};
