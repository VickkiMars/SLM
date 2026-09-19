import React, { useRef, useEffect } from 'react';
import { Clock, Search, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenHistory }) {
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
    <header className="fixed top-0 left-0 w-full h-16 bg-white/95 backdrop-blur-md flex items-center justify-between px-4 sm:px-8 z-50 transition-colors shadow-xs" role="banner">
      <div className="flex items-center gap-3">
        {/* Brand Logo & Identifier */}
        <a href="#reader" className="flex items-center gap-2.5 group rounded-xl p-1 transition outline-none">
          <div className="w-9 h-9 rounded-xl bg-[#1A56C4] flex items-center justify-center text-white font-serif font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-[#FFEEDB]" />
          </div>
          <span className="font-serif font-black text-xl tracking-tight text-[#111111] group-hover:text-[#1A56C4] transition-colors">SLM</span>
        </a>
      </div>

      {/* Global Filter & Command Search Input */}
      <div className="flex-1 max-w-md mx-4 lg:mx-8 hidden md:block relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#666666] absolute left-3.5 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Filter keywords in reading view..."
            className="w-full h-10 bg-[#F0EEEA] focus:bg-white focus:ring-2 focus:ring-[#1A56C4]/20 rounded-xl pl-10 pr-14 text-xs font-sans font-medium text-[#111111] transition-all outline-none placeholder:text-[#666666]"
          />
          <kbd className="absolute right-2.5 hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-[#666666] bg-white rounded-md pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Actions & Controls */}
      <div className="flex items-center gap-3">
        {/* History Action Button */}
        <button
          onClick={onOpenHistory}
          className="inline-flex items-center gap-1.5 px-4 py-2 h-10 rounded-xl bg-[#F0EEEA] text-[#111111] hover:text-[#1A56C4] hover:bg-[#E8EFFF] text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
          title="Open Reading History"
        >
          <Clock className="w-3.5 h-3.5 text-[#1A56C4]" />
          <span className="hidden sm:inline">History</span>
        </button>
      </div>
    </header>
  );
}
