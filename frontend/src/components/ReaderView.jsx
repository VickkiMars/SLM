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
      className="w-full flex flex-col gap-6 relative px-1 sm:px-3 md:px-6 py-2 sm:py-4"
    >
      {/* Header with Back Button */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CCCCCC] bg-white hover:bg-[#F0EEEA] text-[#111111] text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 shadow-2xs focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
              title="Return to input form"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#1A56C4]" />
              <span>Back</span>
            </button>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[#111111]">
            <BookOpen className="w-4 h-4 text-[#1A56C4]" />
            <h3 className="font-serif font-extrabold text-base tracking-tight">Interactive Reading View</h3>
            {result?.progress && result.status !== 'complete' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFEEDB] text-[#2E0E00] border border-[#B84D00]/30 text-[10px] font-serif font-extrabold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B84D00] animate-ping" />
                <span>Batch {result.progress.current_batch} of {result.progress.total_batches}...</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#CCCCCC] text-[#111111] hover:border-[#1A56C4] hover:text-[#1A56C4] hover:bg-[#E8EFFF]/40 text-xs font-serif font-extrabold uppercase tracking-wider transition active:scale-95 bg-white focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#B84D00]" /> : <Copy className="w-3.5 h-3.5 text-[#1A56C4]" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      {/* Interactive Hero Character Token Map */}
      {words.length > 0 && (
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-end">
            <span className="text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">Tap or click any segment to inspect</span>
          </div>

          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className="w-full py-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans text-[#111111] leading-relaxed sm:leading-loose tracking-tight select-none border-b border-[#EAEAEA] pb-8"
          >
            {words.map((w, idx) => {
              if (w.is_newline || w.source_word === '\n') {
                return <br key={idx} />;
              }

              if (w.is_space) {
                return <span key={idx} className="whitespace-pre">{w.source_word}</span>;
              }

              if (w.is_punct) {
                return <span key={idx} className="text-[#111111] select-text">{w.source_word}</span>;
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
                  className={`token inline cursor-pointer outline-none transition-all ${
                    isSelected
                      ? 'underline decoration-[3.5px] underline-offset-8 decoration-[#1A56C4] text-[#1A56C4] font-extrabold'
                      : 'text-[#111111] hover:underline hover:decoration-2 hover:underline-offset-8 hover:decoration-[#1A56C4]/60'
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
      <div className="flex flex-col gap-2 w-full">
        <span className="text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">
          Complete English Translation
        </span>
        <div className="w-full py-3 text-base sm:text-lg md:text-xl font-sans text-[#333333] leading-relaxed font-normal border-b border-[#EAEAEA] pb-6">
          {fullText}
        </div>
      </div>

      {/* Compact Floating Tooltip Popover */}
      {activeToken && (
        <div
          style={{ left: `${popoverPos.left}px`, top: `${popoverPos.top}px` }}
          className="fixed z-[250] bg-[#0B192C] text-white rounded-2xl py-2.5 px-3.5 shadow-2xl flex flex-col items-center justify-center gap-1 text-center min-w-[130px] max-w-[190px] border border-white/15 animate-fadeIn pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-serif font-black text-sm text-white leading-tight">
            {activeToken.source_word}
          </div>
          {activeToken.pronunciation && (
            <div className="font-mono text-xs text-[#93C5FD] font-semibold leading-tight">
              {activeToken.pronunciation}
            </div>
          )}
          {activeToken.translated_word && activeToken.translated_word.toLowerCase() !== activeToken.pronunciation?.toLowerCase() && (
            <div className="font-serif font-extrabold text-xs text-[#FFEEDB] leading-snug">
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

