import React from 'react';
import { BookOpen, Grid, BarChart2, Settings } from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-[#111111]/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Navigation Rail / Drawer */}
      <nav
        className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-[#EAEAEA] flex flex-col py-6 z-40 transition-transform duration-200 ease-in-out ${
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
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-[#1A56C4] bg-[#E8EFFF] border border-[#1A56C4]/30 font-bold font-serif transition"
          >
            <BookOpen className="w-5 h-5 flex-shrink-0 text-[#1A56C4]" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase font-serif font-extrabold">Reader</span>
          </a>

          {/* Nav Item 2: Catalog */}
          <a
            href="#catalog"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-[#666666] hover:text-[#1A56C4] hover:bg-[#F0EEEA] font-medium font-serif transition"
          >
            <Grid className="w-5 h-5 flex-shrink-0 text-[#666666] group-hover:text-[#1A56C4]" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase font-serif font-extrabold">Catalog</span>
          </a>

          {/* Nav Item 3: Stats */}
          <a
            href="#stats"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-[#666666] hover:text-[#1A56C4] hover:bg-[#F0EEEA] font-medium font-serif transition"
          >
            <BarChart2 className="w-5 h-5 flex-shrink-0 text-[#666666] group-hover:text-[#1A56C4]" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase font-serif font-extrabold">Stats</span>
          </a>

          {/* Nav Item 4: Settings */}
          <a
            href="#settings"
            onClick={onClose}
            className="group flex items-center md:flex-col gap-3 md:gap-1 w-full px-3 py-2.5 md:py-2 rounded-xl text-[#666666] hover:text-[#1A56C4] hover:bg-[#F0EEEA] font-medium font-serif transition"
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-[#666666] group-hover:text-[#1A56C4]" />
            <span className="text-xs md:text-[10px] tracking-wider uppercase font-serif font-extrabold">Settings</span>
          </a>
        </div>
      </nav>
    </>
  );
}
