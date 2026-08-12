import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import WordBreakdown from './WordBreakdown';

const LOADING_STEPS = [
  "Mapping meaning & phonetics across scripts...",
  "Tokenizing character units & vocabulary...",
  "Synthesizing phonetic map & translations..."
];

export default function ReaderView({ result, isProcessing, error, showToast, onBack }) {
  const [activeToken, setActiveToken] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ left: 0, top: 0, below: false });
  const [copied, setCopied] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const readerRef = useRef(null);

  // Rotate loading message every 2.5s for Doherty Threshold feedback
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
      <section className="w-full max-w-2xl bg-white rounded-3xl border-2 border-slm-pine/60 shadow-block p-8 flex flex-col items-center justify-center gap-3 text-center">
        <div className="spinner-ring" />
        <p className="font-serif font-bold text-sm text-slm-pine animate-pulse transition-all duration-300">
          {LOADING_STEPS[loadingStepIdx]}
        </p>
        <p className="text-xs text-slm-inkMuted">This usually takes 3–10 seconds.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full max-w-2xl bg-white rounded-3xl border-2 border-red-300 shadow-block p-6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-red-700">Translation Error</h4>
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
        {error.hint && <p className="text-[11px] text-slm-inkMuted italic">{error.hint}</p>}
      </section>
    );
  }

  if (!result) return null;

  // Parse result payload safely across live streams and history restoration
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

    // Tapping the same element again removes the tooltip!
    if (activeToken === word) {
      setActiveToken(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    let popoverWidth = 150;
    let popoverHeight = 58;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    let top = rect.top - popoverHeight - 8;
    let below = false;

    // Viewport boundary check
    if (left < 12) left = 12;
    if (left + popoverWidth > viewportWidth - 12) {
      left = viewportWidth - popoverWidth - 12;
    }

    if (top < 10) {
      top = rect.bottom + 8;
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
      className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 shadow-block p-6 sm:p-7 flex flex-col gap-6 relative"
    >
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:outline-none"
              title="Return to input form"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Back to Input</span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-slate-900">
            <BookOpen className="w-4 h-4 text-slm-pine" />
            <h3 className="font-serif font-bold text-base">Interactive Reading View</h3>
            {result?.progress && result.status !== 'complete' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <span>Translating batch {result.progress.current_batch} of {result.progress.total_batches}...</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-slm-pine hover:text-slm-pine text-[11px] font-semibold transition active:scale-95 bg-white focus-visible:ring-2 focus-visible:ring-slm-pine focus-visible:outline-none"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-slm-orange" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Full Text' : 'Copy Text'}</span>
        </button>
      </div>

      {/* Interactive Hero Character Token Map */}
      {words.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end">
            <span className="text-[10px] text-slate-500 font-medium">Tap any word to inspect</span>
          </div>

          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="p-5 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200/80 text-base sm:text-lg font-sans text-slate-900 leading-relaxed tracking-normal select-none"
          >
            {words.map((w, idx) => {
              if (w.is_newline || w.source_word === '\n') {
                return <br key={idx} />;
              }

              if (w.is_space) {
                return <span key={idx} className="whitespace-pre">{w.source_word}</span>;
              }

              if (w.is_punct) {
                return <span key={idx} className="text-slate-900 select-text">{w.source_word}</span>;
              }

              const isSelected = activeToken === w;
              return (
                <span
                  key={idx}
                  tabIndex={0}
                  role="button"
                  aria-label={`Inspect token ${w.source_word}`}
                  onClick={(e) => handleTokenClick(e, w)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleTokenClick(e, w)}
                  className={`token inline cursor-pointer outline-none ${
                    isSelected
                      ? 'bg-amber-100 text-amber-950 font-medium rounded-xs px-0.5'
                      : 'text-slate-900'
                  }`}
                  data-symbol={w.source_word || ''}
                  data-pron={w.pronunciation || ''}
                  data-meaning={w.translated_word || ''}
                >
                  {w.source_word || ''}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Supporting Full Translation Section */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Complete English Translation
        </span>
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm sm:text-base font-sans text-slate-800 leading-relaxed font-normal">
          {fullText}
        </div>
      </div>

      {/* Compact Floating Tooltip Popover */}
      {activeToken && (
        <div
          style={{ left: `${popoverPos.left}px`, top: `${popoverPos.top}px` }}
          className="fixed z-[250] bg-slate-900 text-white rounded-xl py-2 px-3 shadow-xl flex flex-col items-center justify-center gap-0.5 text-center min-w-[125px] max-w-[185px] border border-slate-700/80 animate-fadeIn pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-serif font-semibold text-sm text-white leading-tight">
            {activeToken.source_word}
          </div>
          {activeToken.pronunciation && (
            <div className="font-mono text-[11px] text-indigo-300 font-medium leading-tight">
              {activeToken.pronunciation}
            </div>
          )}
          {activeToken.translated_word && activeToken.translated_word.toLowerCase() !== activeToken.pronunciation?.toLowerCase() && (
            <div className="font-medium text-[11px] text-amber-400 leading-snug">
              {activeToken.translated_word}
            </div>
          )}
        </div>
      )}

      {/* Word Breakdown Component */}
      <WordBreakdown words={words} />
    </section>
  );
}

