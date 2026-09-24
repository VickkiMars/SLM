import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, BookOpen, ArrowLeft } from 'lucide-react';
import WordBreakdown from './WordBreakdown';

const LOADING_STEPS = [
  "Mapping transliterations & English meanings...",
  "Tokenizing character units & vocabulary...",
  "Synthesizing interlinear layout..."
];

export default function ReaderView({ result, isProcessing, error, showToast, onBack }) {
  const [activeToken, setActiveToken] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0, below: false });
  const [copied, setCopied] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const readerRef = useRef(null);

  // Rotate loading message every 2.5s for feedback
  useEffect(() => {
    if (!isProcessing) {
      setLoadingStepIdx(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isProcessing]);

  if (isProcessing) {
    return (
      <section className="w-full max-w-2xl bg-white rounded-3xl border-2 border-[#1A56C4]/30 shadow-block p-8 flex flex-col items-center justify-center gap-3 text-center">
        <div className="spinner-ring" />
        <p className="font-serif font-bold text-sm text-[#1A56C4] animate-pulse transition-all duration-300">
          {LOADING_STEPS[loadingStepIdx]}
        </p>
        <p className="text-xs text-[#666666]">This usually takes 3–8 seconds.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-2xl bg-white rounded-3xl border-2 border-red-300 shadow-block p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-red-700">Processing Error</h4>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Input</span>
            </button>
          )}
        </div>
        <p className="text-xs text-red-600 leading-relaxed">{error.detail || error.message || 'An unexpected error occurred.'}</p>
        {error.hint && <p className="text-[11px] text-[#666666] italic">{error.hint}</p>}
      </section>
    );
  }

  if (!result) return null;

  // Parse result payload safely
  let parsed = null;
  try {
    if (typeof result.output === 'string') {
      parsed = JSON.parse(result.output);
    } else if (typeof result.output === 'object' && result.output !== null) {
      parsed = result.output;
    }
  } catch {
    parsed = null;
  }

  const fullText = parsed?.full_translation || (typeof result.output === 'string' ? result.output : '') || '';
  const words = Array.isArray(parsed?.words) ? parsed.words : [];

  const handleCopy = () => {
    if (!fullText) return;
    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      showToast('Copied ✓');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTokenClick = (e, word) => {
    e.stopPropagation();

    // Clicking the same active word toggles popover off
    if (activeToken === word) {
      setActiveToken(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let popoverWidth = 160;
    let popoverHeight = 70;

    let left = rect.left + rect.width / 2;
    let top = rect.top - 12;
    let below = false;

    if (top < 100) {
      top = rect.bottom + 12;
      below = true;
    }

    setPopoverPos({ left, top, below });
    setActiveToken(word);
  };

  const isRtl = words.some(w => /[\u0600-\u06FF\u0590-\u05FF]/.test(w.source_word || ''));

  return (
    <section
      ref={readerRef}
      onClick={() => setActiveToken(null)}
      className="w-full flex flex-col gap-6 relative px-1 sm:px-3 md:px-6 py-2 sm:py-4"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CCCCCC] bg-white hover:bg-[#F0EEEA] text-[#111111] text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
              title="Return to input form"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1A56C4]" />
              <span>Back</span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[#111111]">
            <BookOpen className="w-4 h-4 text-[#1A56C4]" />
            <h3 className="font-serif font-extrabold text-base tracking-tight">Interlinear Reading View</h3>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CCCCCC] text-[#111111] hover:border-[#1A56C4] hover:text-[#1A56C4] hover:bg-[#E8EFFF]/40 text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 bg-white focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#E8640A]" /> : <Copy className="w-3.5 h-3.5 text-[#1A56C4]" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Interlinear Reading Board matching exact layout & positioning */}
      {words.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-serif font-bold uppercase tracking-wider text-[#E8640A]">
              Romanized Script &amp; Direct Glossing
            </span>
            <span className="text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">
              Click any token for callout popover
            </span>
          </div>

          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="w-full py-6 flex flex-wrap items-end gap-x-2 sm:gap-x-4 gap-y-6 select-none border-b border-[#EAEAEA] pb-10 min-h-[160px]"
          >
            {words.map((w, idx) => {
              if (w.is_newline || w.source_word === '\n') {
                return <div key={idx} className="basis-full h-0" />;
              }

              if (w.is_space) {
                return <span key={idx} className="w-3 sm:w-4 inline-block" />;
              }

              if (w.is_punct) {
                return (
                  <span
                    key={idx}
                    className="text-2xl sm:text-3xl font-serif text-[#111111] pb-1 px-0.5 select-text self-end"
                  >
                    {w.source_word}
                  </span>
                );
              }

              const isSelected = activeToken === w;
              const hasPron = Boolean(w.pronunciation);

              return (
                <div
                  key={idx}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect token ${w.source_word}`}
                  onClick={(e) => handleTokenClick(e, w)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTokenClick(e, w)}
                  className={`inline-flex flex-col items-center justify-end cursor-pointer outline-none transition-all duration-200 px-2.5 py-1.5 rounded-2xl group ${
                    isSelected
                      ? 'border-2 border-[#E8640A] bg-[#FFF8F2] shadow-sm transform -translate-y-1'
                      : 'border-2 border-transparent hover:border-[#1A56C4]/30 hover:bg-[#E8EFFF]/40 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Line: Romanized Script (Pinyin / Romaji / German / French) */}
                  <span className={`text-xs sm:text-sm font-sans font-bold tracking-tight mb-1 text-center transition-colors ${
                    isSelected ? 'text-[#E8640A]' : 'text-[#E8640A] group-hover:text-[#1A56C4]'
                  }`}>
                    {hasPron ? w.pronunciation : '\u00A0'}
                  </span>

                  {/* Bottom Line: Source Script Character / Word */}
                  <span className={`text-2xl sm:text-3xl md:text-4xl font-serif leading-none tracking-tight text-center transition-colors ${
                    isSelected ? 'text-[#E8640A] font-extrabold' : 'text-[#111111]'
                  }`}>
                    {w.source_word}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Callout Speech-Bubble Popover */}
      {activeToken && (
        <div
          style={{
            left: `${popoverPos.left}px`,
            top: `${popoverPos.top}px`,
            transform: popoverPos.below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
          }}
          className={`fixed z-[300] bg-white border-2 border-[#E8640A] rounded-2xl px-4 py-3 shadow-2xl flex flex-col items-center justify-center gap-0.5 text-center min-w-[140px] max-w-[220px] pointer-events-auto animate-fadeIn ${
            popoverPos.below
              ? 'after:content-[""] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-[#E8640A]'
              : 'after:content-[""] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-[#E8640A]'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Line: Romanized / Pronunciation */}
          <div className="font-sans font-extrabold text-sm text-[#E8640A] leading-tight">
            {activeToken.pronunciation || activeToken.source_word}
          </div>

          {/* Bottom Line: English Meaning in Italics */}
          {activeToken.translated_word && (
            <div className="font-serif italic text-sm text-[#333333] font-medium leading-snug mt-0.5">
              {activeToken.translated_word}
            </div>
          )}
        </div>
      )}

      {/* Full English Translation Section */}
      <div className="flex flex-col gap-2 w-full mt-2">
        <span className="text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">
          Complete English Meaning
        </span>
        <div className="w-full py-3 text-base sm:text-lg md:text-xl font-sans text-[#333333] leading-relaxed font-normal border-b border-[#EAEAEA] pb-6">
          {fullText}
        </div>
      </div>

      {/* Word Breakdown Table Component */}
      <WordBreakdown words={words} />
    </section>
  );
}
