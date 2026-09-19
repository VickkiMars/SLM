import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function WordBreakdown({ words = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!words || words.length === 0) return null;

  return (
    <div className="mt-4 border border-[#EAEAEA] rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 bg-[#F0EEEA]/60 hover:bg-[#F0EEEA] flex items-center justify-between transition cursor-pointer"
      >
        <span className="font-serif font-extrabold text-xs text-[#111111] uppercase tracking-wider">
          Word &amp; Character Breakdown ({words.length})
        </span>
        <ChevronDown className={`w-4 h-4 text-[#666666] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F0EEEA] border-b border-[#EAEAEA] text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">
                <th className="px-4 py-2.5">Source Unit</th>
                <th className="px-4 py-2.5">Translation</th>
                <th className="px-4 py-2.5">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, idx) => (
                <tr key={idx} className="border-b border-[#F3F4F6] hover:bg-[#E8EFFF]/40 transition">
                  <td className="px-4 py-2.5 text-xs font-sans font-semibold text-[#111111]">{w.source_word || '—'}</td>
                  <td className="px-4 py-2.5 text-xs font-sans font-medium text-[#111111]">{w.translated_word || '—'}</td>
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold text-[#1A56C4]">{w.pronunciation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
