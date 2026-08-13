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
    <header className="fixed top-0 left-0 w-full h-18 bg-white/95 backdrop-blur-md border-b border-[#EAEAEA] flex items-center justify-between px-4 sm:px-6 z-50 transition-colors shadow-xs" role="banner">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-[#111111] hover:text-[#1A56C4] hover:bg-[#E8EFFF] focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none transition active:scale-95 border border-[#CCCCCC]"
          aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo & Identifier */}
        <a href="#reader" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:ring-offset-2 rounded-xl p-1 transition outline-none">
          <div className="w-9 h-9 rounded-xl bg-[#1A56C4] flex items-center justify-center text-white font-serif font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-[#FFEEDB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-black text-lg tracking-tight text-[#111111] group-hover:text-[#1A56C4] transition-colors">SLM</span>
              <span className="text-[10px] font-serif font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#E8EFFF] text-[#00194B] border border-[#1A56C4]/30">Reader</span>
            </div>
            <span className="text-[9px] font-serif font-extrabold uppercase tracking-widest text-[#666666] block -mt-0.5">Sound &amp; Language Mapper</span>
          </div>
        </a>
      </div>

      {/* Global Filter & Command Search Input */}
      <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#666666] absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Filter keywords in reading view..."
            className="w-full h-10 bg-[#F0EEEA] border border-[#CCCCCC] focus:bg-white focus:border-[#1A56C4] focus:ring-2 focus:ring-[#1A56C4]/20 rounded-xl pl-9 pr-14 text-xs font-sans font-medium text-[#111111] transition-all outline-none placeholder:text-[#666666]"
          />
          <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#666666] bg-white border border-[#CCCCCC] rounded-md shadow-2xs pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">

        {/* History Action Button */}
        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 px-4 py-2 h-10 rounded-xl border border-[#CCCCCC] bg-white text-[#111111] hover:border-[#1A56C4] hover:text-[#1A56C4] hover:bg-[#E8EFFF]/40 text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none shadow-2xs"
          title="Open Reading History"
        >
          <Clock className="w-3.5 h-3.5 text-[#1A56C4]" />
          <span className="hidden sm:inline">History</span>
        </button>

        {/* Auth / Account Action Button */}
        <button
          onClick={onOpenAuth}
          className={`inline-flex items-center gap-1.5 px-4 py-2 h-10 rounded-xl border text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none ${
            user
              ? 'bg-[#E8EFFF] border-[#1A56C4]/40 text-[#00194B] hover:bg-[#E8EFFF]/80'
              : token
              ? 'bg-[#FFEEDB] border-[#B84D00]/40 text-[#2E0E00] hover:bg-[#FFEEDB]/80'
              : 'bg-[#1A56C4] border-[#1545A2] text-white hover:bg-[#1545A2] shadow-2xs'
          }`}
          title={user ? `Account (${user.email})` : token ? "Manual Token Configured" : "Sign In / Bearer Token"}
        >
          {user ? (
            <>
              <div className="w-4 h-4 rounded-full bg-[#1A56C4] text-white text-[9px] font-serif font-extrabold flex items-center justify-center uppercase">
                {user.email?.[0] || 'U'}
              </div>
              <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.email?.split('@')[0]}</span>
            </>
          ) : token ? (
            <>
              <Key className="w-3.5 h-3.5 text-[#B84D00]" />
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

