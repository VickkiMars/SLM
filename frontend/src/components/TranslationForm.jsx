import React, { useState, useEffect, useRef } from 'react';
import { Type, Upload, ArrowRight, Trash2, FileText, AlertCircle, X, BookOpen } from 'lucide-react';
import markGospelData from '../data/markGospel.json';

export default function TranslationForm({ onSubmitText, onSubmitFile, isProcessing }) {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('slm_active_tab') || 'text');
  const [textContent, setTextContent] = useState(() => localStorage.getItem('slm_text_content') || '');
  const [showCustomVocab, setShowCustomVocab] = useState(() => localStorage.getItem('slm_show_custom_vocab') === 'true');
  const [customVocab, setCustomVocab] = useState(() => localStorage.getItem('slm_custom_vocab') || '');
  const [selectedMarkChapter, setSelectedMarkChapter] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Sync session state to localStorage
  useEffect(() => {
    localStorage.setItem('slm_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('slm_text_content', textContent);
  }, [textContent]);

  useEffect(() => {
    localStorage.setItem('slm_show_custom_vocab', showCustomVocab ? 'true' : 'false');
  }, [showCustomVocab]);

  useEffect(() => {
    localStorage.setItem('slm_custom_vocab', customVocab);
  }, [customVocab]);

  const handleSelectMarkChapter = (chNum) => {
    setSelectedMarkChapter(chNum);
    if (!chNum) return;
    const found = markGospelData.find((item) => String(item.chapter) === String(chNum));
    if (found) {
      setTextContent(found.text);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textContent.trim()) return;
    onSubmitText({
      content: textContent.trim(),
      original_language: undefined, // auto-detect
      target_language: 'English',
      custom_vocab: showCustomVocab && customVocab.trim() ? customVocab.trim() : undefined
    });
  };

  const handleFileSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSubmitFile(
      selectedFile,
      'Auto',
      'English',
      showCustomVocab && customVocab.trim() ? customVocab.trim() : undefined
    );
  };

  const validateAndSetFile = (file) => {
    setFileError(null);
    if (!file) return;
    if (file.type.startsWith('image/')) {
      setFileError('Image OCR is disabled. Please upload a plain text (.txt) document.');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      {/* Main Input Card */}
      <section className="w-full bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-xs flex flex-col gap-5">
        {/* Card Header & Input Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEAEA] gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-extrabold font-serif tracking-tight flex items-center gap-2 text-[#111111]">
              <Type className="w-4 h-4 text-[#1A56C4]" />
              <span>Input Content</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Gospel of Mark Quick Access Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFEEDB] border border-[#B84D00]/30 text-xs text-[#2E0E00] font-sans font-medium">
              <BookOpen className="w-3.5 h-3.5 text-[#B84D00] shrink-0" />
              <span className="font-bold text-[11px] hidden xs:inline font-serif">馬可福音</span>
              <select
                value={selectedMarkChapter}
                onChange={(e) => handleSelectMarkChapter(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#2E0E00] outline-none cursor-pointer"
                aria-label="Select Gospel of Mark chapter"
              >
                <option value="">Gospel of Mark...</option>
                {markGospelData.map((ch) => (
                  <option key={ch.chapter} value={ch.chapter}>
                    Ch. {ch.chapter} (第{ch.chapter}章)
                  </option>
                ))}
              </select>
            </div>

            {/* Input mode segmented tabs */}
            <div className="m3-segmented-container">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`m3-segmented-item ${activeTab === 'text' ? 'active' : ''}`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('file')}
                className={`m3-segmented-item ${activeTab === 'file' ? 'active' : ''}`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>File</span>
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'text' ? (
          <form onSubmit={handleTextSubmit} className="flex flex-col gap-4">
            <div className="relative">
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={5}
                placeholder="Paste your foreign text here or select Gospel of Mark above..."
                className="varsity-input w-full p-4 text-sm font-sans text-[#111111] placeholder:text-[#666666]/60 outline-none resize-y min-h-[140px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#666666] font-sans font-medium flex items-center gap-1.5">
                  <span>{textContent.length} characters</span>
                </span>
                {textContent && (
                  <button
                    type="button"
                    onClick={() => setTextContent('')}
                    className="inline-flex items-center gap-1 text-[11px] text-[#666666] hover:text-red-600 transition font-sans font-medium"
                    title="Clear text"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isProcessing || !textContent.trim()}
                className="varsity-btn-primary disabled:opacity-50 text-xs font-serif font-extrabold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-2xs flex items-center gap-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
              >
                {isProcessing ? (
                  <>
                    <div className="spinner-ring border-white border-t-transparent w-4 h-4" />
                    <span>Mapping &amp; Tokenizing...</span>
                  </>
                ) : (
                  <>
                    <span>Start Reading Session</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleFileSubmit} className="flex flex-col gap-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".txt,.text"
              className="hidden"
            />

            {/* Inline File Error Banner */}
            {fileError && (
              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{fileError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFileError(null)}
                  className="p-1 hover:text-red-900 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragOver ? 'border-[#1A56C4] bg-[#E8EFFF]' : 'border-[#CCCCCC] bg-[#F6F4F0] hover:border-[#1A56C4]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#E8EFFF] text-[#1A56C4] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              {selectedFile ? (
                <div>
                  <p className="font-semibold text-xs text-[#111111]">{selectedFile.name}</p>
                  <p className="text-[10px] text-[#666666]">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-xs text-[#111111]">Click or drop text document here</p>
                  <p className="text-[10px] text-[#666666] mt-0.5">Supports plain text (.txt)</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isProcessing || !selectedFile}
                className="varsity-btn-primary disabled:opacity-50 text-xs font-serif font-extrabold uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-2xs flex items-center gap-2 active:scale-95 focus-visible:ring-2 focus-visible:ring-[#1A56C4] focus-visible:outline-none"
              >
                {isProcessing ? (
                  <>
                    <div className="spinner-ring border-white border-t-transparent w-4 h-4" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <span>Start Reading Session</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
        {/* Edit Vocabulary Toggle Bar */}
        <div className="pt-2 border-t border-[#EAEAEA] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showCustomVocab}
                  onChange={(e) => setShowCustomVocab(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#CCCCCC] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#CCCCCC] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A56C4] shadow-inner"></div>
              </div>
              <span className="text-xs font-serif font-extrabold text-[#111111]">Edit vocabulary</span>
            </label>
            <span className="text-[10px] font-sans font-medium text-[#666666]">Optional custom word overrides</span>
          </div>

          {/* Expandable Custom Vocabulary Editor */}
          {showCustomVocab && (
            <div className="flex flex-col gap-2 p-4 bg-[#F0EEEA] rounded-2xl border border-[#CCCCCC] transition-all animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-serif font-extrabold uppercase tracking-wider text-[#666666]">
                  Custom Vocabulary List
                </label>
                <code className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#CCCCCC] text-[#1A56C4] font-medium">
                  word::meaning::pronunciation
                </code>
              </div>
              <p className="text-[11px] font-sans text-[#666666] leading-tight">
                Add custom definitions or pronunciations to override or complement automatic dictionary lookups (one entry per line):
              </p>
              <textarea
                value={customVocab}
                onChange={(e) => setCustomVocab(e.target.value)}
                rows={4}
                placeholder={"如果::if::rúguǒ\n愛::love::ài\n街头::street corner::jiētóu"}
                className="w-full rounded-xl border border-[#CCCCCC] bg-white p-3 text-xs font-mono text-[#111111] outline-none focus:border-[#1A56C4] transition resize-y"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

