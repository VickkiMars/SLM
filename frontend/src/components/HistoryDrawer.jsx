import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchHistory, fetchSessionById, updateSession, deleteSession } from '../services/apiService';
import { Clock, Search, X, Star, Trash2, ArrowUpRight } from 'lucide-react';

export default function HistoryDrawer({ isOpen, onClose, onSelectSession, showToast }) {
  const { token } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!token) {
      setSessions([]);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchHistory({
        query: searchQuery,
        language: langFilter,
        bookmarked: bookmarkedOnly
      }, token);

      setSessions(res.sessions || []);
    } catch (err) {
      setErrorMsg(err.detail || err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, langFilter, bookmarkedOnly]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, loadHistory]);

  if (!isOpen) return null;

  const handleResume = async (sessionId) => {
    try {
      showToast('Loading reading session...');
      const session = await fetchSessionById(sessionId, token);
      if (session) {
        onSelectSession(session);
        onClose();
        showToast('Session loaded ✓');
      }
    } catch (err) {
      showToast('Failed to load session');
    }
  };

  const handleToggleBookmark = async (e, s) => {
    e.stopPropagation();
    try {
      await updateSession(s.id, { is_bookmarked: !s.is_bookmarked }, token);
      loadHistory();
      showToast(s.is_bookmarked ? 'Bookmark removed' : 'Session bookmarked ★');
    } catch (err) {
      showToast('Update failed');
    }
  };

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reading session?')) return;
    try {
      await deleteSession(sessionId, token);
      loadHistory();
      showToast('Session deleted');
    } catch (err) {
      showToast('Delete failed');
    }
  };

  return (
    <div
      className="drawer-overlay flex items-end sm:items-start justify-center sm:justify-end p-0 sm:p-4 z-[200]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="drawer-container w-full max-w-md flex flex-col gap-4 rounded-t-3xl sm:rounded-3xl max-h-[88vh] sm:max-h-[calc(100vh-84px)] overflow-y-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E8EFFF] text-[#1A56C4] flex items-center justify-center border border-[#1A56C4]/30">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-serif font-extrabold text-base text-[#111111] tracking-tight">Reading History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#666666] hover:text-[#111111] hover:bg-[#F0EEEA] transition border border-[#CCCCCC]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions, text, tags..."
              className="varsity-input w-full pl-9 pr-3 py-2 text-xs font-sans text-[#111111] outline-none focus:border-[#1A56C4] transition"
            />
            <Search className="w-3.5 h-3.5 text-[#666666] absolute left-3 top-3 pointer-events-none" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="flex-1 rounded-xl border border-[#CCCCCC] bg-white px-3 py-2 text-xs font-sans font-medium text-[#111111] outline-none focus:border-[#1A56C4]"
            >
              <option value="All">All Languages</option>
              <option value="French">French</option>
              <option value="Spanish">Spanish</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
              <option value="German">German</option>
              <option value="Arabic">Arabic</option>
              <option value="Swahili">Swahili</option>
            </select>

            <button
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-serif font-extrabold uppercase tracking-wider transition flex items-center gap-1.5 ${
                bookmarkedOnly
                  ? 'border-[#1A56C4] bg-[#E8EFFF] text-[#00194B]'
                  : 'border-[#CCCCCC] text-[#666666] hover:border-[#1A56C4] hover:text-[#1A56C4] bg-white'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current text-[#B84D00]" />
              <span>Saved</span>
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex flex-col gap-2.5 min-h-[160px]">
          {!token ? (
            <p className="text-center py-8 text-slm-inkMuted text-xs leading-relaxed">
              Please save your Bearer token or log in first to view reading history.
            </p>
          ) : loading ? (
            <div className="flex items-center justify-center py-8 text-slm-inkMuted gap-2">
              <div className="spinner-ring" />
              <span className="text-xs font-medium">Loading history...</span>
            </div>
          ) : errorMsg ? (
            <p className="text-center py-8 text-red-600 text-xs leading-relaxed">{errorMsg}</p>
          ) : sessions.length === 0 ? (
            <p className="text-center py-8 text-slm-inkMuted text-xs leading-relaxed">
              No reading sessions match your filters.<br />Translate text or upload a document to build history!
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleResume(s.id)}
                className="group p-3 rounded-xl border-2 border-slm-border bg-slm-paper hover:border-slm-pine transition flex flex-col gap-2 cursor-pointer relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-serif font-bold text-xs text-slm-ink line-clamp-1 group-hover:text-slm-pine transition">
                    {s.title}
                  </h4>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => handleToggleBookmark(e, s)}
                      className={`p-1 rounded transition ${
                        s.is_bookmarked ? 'text-[#B84D00]' : 'text-[#666666] hover:text-[#B84D00]'
                      }`}
                      title={s.is_bookmarked ? 'Remove bookmark' : 'Bookmark session'}
                    >
                      <Star className={`w-3.5 h-3.5 ${s.is_bookmarked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      className="p-1 rounded text-slm-inkMuted hover:text-red-600 transition"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slm-inkMuted line-clamp-2 leading-relaxed">
                  {s.source_text_snippet}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slm-border/60 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slm-pine/10 text-slm-pine font-semibold">
                      {s.original_language}
                    </span>
                    <span className="text-slm-inkMuted">{s.word_count} words</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slm-inkMuted text-[9px]">
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slm-pine text-white text-[9px] font-bold uppercase tracking-wider group-hover:bg-slm-ink transition flex items-center gap-0.5">
                      <span>Resume</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
