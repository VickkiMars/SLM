import React, { useRef, useEffect } from 'react';
import { Clock, Search, Menu, Key, User, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenHistory, onOpenAuth, onToggleSidebar, isSidebarOpen }) {
  const { user, token } = useAuth();
  const searchInputRef = useRef(null);

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 z-50 transition-colors shadow-xs" role="banner">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:text-slm-pine hover:bg-indigo-50/60 focus-visible:ring-2 focus-visible:ring-slm-pine focus-visible:outline-none transition active:scale-95"
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo & Identifier */}
        <a href="#reader" className="flex items-center gap-2.5 group focus-visible:ring-2 focus-visible:ring-slm-pine focus-visible:ring-offset-2 rounded-lg p-1 transition outline-none">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm ring-1 ring-indigo-950/10 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">SLM</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60">Reader</span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold block -mt-0.5">Sound & Language Mapper</span>
          </div>
        </a>
      </div>

      {/* Global Filter & Command Search Input */}
      <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Filter keywords in reading view..."
            className="w-full h-9 bg-slate-100/70 border border-slate-200/80 focus:bg-white focus:border-slm-pine focus:ring-2 focus:ring-slm-pine/20 rounded-lg pl-9 pr-14 text-xs font-medium text-slate-900 transition-all outline-none placeholder:text-slate-400"
          />
          <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">

        {/* History Action Button */}
        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-lg border border-slate-200/90 text-slate-700 hover:text-slm-pine hover:border-indigo-300 hover:bg-indigo-50/50 text-xs font-semibold tracking-wide transition active:scale-95 focus-visible:ring-2 focus-visible:ring-slm-pine focus-visible:outline-none"
          title="Open Reading History"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Auth / Account Action Button */}
        <button
          onClick={onOpenAuth}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 h-9 rounded-lg border text-xs font-semibold tracking-wide transition active:scale-95 focus-visible:ring-2 focus-visible:ring-slm-pine focus-visible:outline-none ${
            user
              ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 hover:bg-indigo-100/70'
              : token
              ? 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100/70'
              : 'bg-slm-pine border-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
          }`}
          title={user ? `Account (${user.email})` : token ? "Manual Token Configured" : "Sign In / Bearer Token"}
        >
          {user ? (
            <>
              <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center uppercase">
                {user.email?.[0] || 'U'}
              </div>
              <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.email?.split('@')[0]}</span>
            </>
          ) : token ? (
            <>
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Token Active</span>
              <span className="sm:hidden">Token</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>Account</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

