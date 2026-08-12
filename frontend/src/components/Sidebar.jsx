import React from 'react';
import { BookOpen, Grid, BarChart2, Settings, X } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation Rail / Drawer */}
      <nav
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-slate-200 flex flex-col py-6 z-40 transition-transform duration-200 ease-in-out ${
          isOpen
            ? 'translate-x-0 w-64 shadow-xl'
            : '-translate-x-full md:translate-x-0 w-20 hidden md:flex'
        }`}
        aria-label="Main Navigation"
      >
        <div className="flex flex-col gap-2 w-full px-3 flex-1">
          {/* Nav Item 1: Reader (Active) */}
          <a
            href="#reader"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-slm-pine bg-indigo-50/80 font-semibold transition"
          >
            <BookOpen className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase">Reader</span>
          </a>

          {/* Nav Item 2: Catalog */}
          <a
            href="#catalog"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-slate-600 hover:text-slm-pine hover:bg-slate-100/70 font-medium transition"
          >
            <Grid className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase">Catalog</span>
          </a>

          {/* Nav Item 3: Stats */}
          <a
            href="#stats"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-slate-600 hover:text-slm-pine hover:bg-slate-100/70 font-medium transition"
          >
            <BarChart2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase">Stats</span>
          </a>

          {/* Nav Item 4: Settings */}
          <a
            href="#settings"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-slate-600 hover:text-slm-pine hover:bg-slate-100/70 font-medium transition"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase">Settings</span>
          </a>
        </div>
      </nav>
    </>
  );
}

