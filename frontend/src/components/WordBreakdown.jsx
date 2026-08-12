import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function WordBreakdown({ words = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!words || words.length === 0) return null;

  return (
    <div className="mt-4 border-2 border-slm-border rounded-2xl overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-4 py-3 bg-slm-paper/60 hover:bg-slm-paper flex items-center justify-between transition cursor-pointer"
      >
        <span className="font-serif font-bold text-xs text-slm-ink uppercase tracking-wider">
          Word &amp; Character Breakdown ({words.length})
        </span>
        <ChevronDown className={`w-4 h-4 text-slm-inkMuted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slm-paper border-b border-slm-border text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">
                <th className="px-4 py-2">Source Unit</th>
                <th className="px-4 py-2">Translation</th>
                <th className="px-4 py-2">Pronunciation</th>
              </tr>
            </thead>
            <tbody>
              {words.map((w, idx) => (
                <tr key={idx} className="border-b border-slm-border/60 hover:bg-slm-pine/5 transition">
                  <td className="px-4 py-2 text-xs font-medium text-slm-ink">{w.source_word || '—'}</td>
                  <td className="px-4 py-2 text-xs font-semibold text-slm-ink">{w.translated_word || '—'}</td>
                  <td className="px-4 py-2 text-xs font-mono text-slm-clay">{w.pronunciation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
