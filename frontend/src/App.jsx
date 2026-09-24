import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TranslationForm from './components/TranslationForm';
import ReaderView from './components/ReaderView';
import HistoryDrawer from './components/HistoryDrawer';
import Toast from './components/Toast';
import { translateText, translateFile, subscribeJobStatus } from './services/apiService';
import { saveSession } from './services/historyStore';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeResult, setActiveResult] = useState(() => {
    try {
      const saved = localStorage.getItem('slm_active_result');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Persist activeResult to localStorage so it survives page refreshes
  useEffect(() => {
    try {
      if (activeResult) {
        localStorage.setItem('slm_active_result', JSON.stringify(activeResult));
      } else {
        localStorage.removeItem('slm_active_result');
      }
    } catch (e) {}
  }, [activeResult]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? '' : current));
    }, 2800);
  };

  // Auto-archive a completed translation blob to localStorage history
  const archiveResult = (blob, sourcePayload) => {
    try {
      let output = blob.output;
      if (typeof output === 'string') {
        try { output = JSON.parse(output); } catch {}
      }
      const full_translation = output?.full_translation || '';
      const words = Array.isArray(output?.words) ? output.words : [];

      saveSession({
        source_text: sourcePayload?.content || '',
        original_language: sourcePayload?.original_language || 'Auto',
        target_language: sourcePayload?.target_language || 'English',
        full_translation,
        token_metadata: { full_translation, words },
        tags: [sourcePayload?.original_language || 'Reading'].filter(Boolean),
      });
    } catch (e) {
      console.warn('[App] History archive failed:', e.message);
    }
  };

  const handleStartJob = (jobId, sourcePayload) => {
    setIsProcessing(true);
    setError(null);

    subscribeJobStatus(jobId, {
      onUpdate: (blob) => {
        if (blob && blob.output) {
          setIsProcessing(false);
          setActiveResult(blob);
        }
      },
      onComplete: (blob) => {
        setIsProcessing(false);
        setActiveResult(blob);
        archiveResult(blob, sourcePayload);
      },
      onError: (err) => {
        setIsProcessing(false);
        setError(err);
      }
    });
  };

  const handleSubmitText = async (payload) => {
    setIsProcessing(true);
    setError(null);
    setActiveResult(null);

    try {
      const data = await translateText(payload);
      if (data.result && (data.result.status === 'complete' || data.result.status === 'failed')) {
        setIsProcessing(false);
        if (data.result.status === 'failed') {
          setError({ detail: data.result.detail || 'Translation failed.' });
        } else {
          setActiveResult(data.result);
          archiveResult(data.result, payload);
        }
      } else if (data.job_id) {
        handleStartJob(data.job_id, payload);
      }
    } catch (err) {
      setIsProcessing(false);
      setError(err);
    }
  };

  const handleSubmitFile = async (file, srcLang, tgtLang, customVocab) => {
    setIsProcessing(true);
    setError(null);
    setActiveResult(null);

    const payload = {
      content: `[File: ${file.name}]`,
      original_language: srcLang,
      target_language: tgtLang,
    };

    try {
      const data = await translateFile(file, srcLang, tgtLang, customVocab);
      if (data.result && (data.result.status === 'complete' || data.result.status === 'failed')) {
        setIsProcessing(false);
        if (data.result.status === 'failed') {
          setError({ detail: data.result.detail || 'Translation failed.' });
        } else {
          setActiveResult(data.result);
          archiveResult(data.result, payload);
        }
      } else if (data.job_id) {
        handleStartJob(data.job_id, payload);
      }
    } catch (err) {
      setIsProcessing(false);
      setError(err);
    }
  };

  const handleSelectSession = (session) => {
    setError(null);
    setIsProcessing(false);
    setActiveResult({
      user_id: session.user_id,
      output: session.token_metadata || {
        full_translation: session.full_translation,
        words: []
      },
      status: 'complete'
    });
  };

  return (
    <div className="bg-[#F6F4F0] text-[#111111] min-h-screen flex flex-col font-sans">
      {/* Ambient Radial Grid Background */}
      <div className="bg-radial-grid" aria-hidden="true" />

      {/* Global Header */}
      <Navbar onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* Main Workspace Area */}
      {(() => {
        const isReadingMode = Boolean(activeResult || isProcessing || error);
        return (
          <main className={`mt-16 flex-1 w-full mx-auto relative z-10 flex flex-col items-center ${
            isReadingMode ? 'px-2 sm:px-4 md:px-6 py-6 max-w-none' : 'px-4 sm:px-8 lg:px-12 py-10 max-w-5xl'
          }`}>

            {/* Hero Banner */}
            {!isReadingMode && (
              <div className="mb-10 max-w-3xl w-full text-left">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight">
                  <span className="text-[#1A56C4]">Read any foreign text. </span>
                  <span className="font-serif italic font-black text-[#E8640A]">Understand every word.</span>
                </h1>

                <p className="mt-3 text-[#666666] text-sm sm:text-base leading-relaxed font-sans font-normal">
                  Paste foreign text or upload a document. Every character cluster gets mapped — hover or click any word for instant meanings and pronunciations.
                </p>
              </div>
            )}

            {/* Layout Panels Container */}
            <div className="w-full flex flex-col items-center gap-8">
              {isReadingMode ? (
                <ReaderView
                  result={activeResult}
                  isProcessing={isProcessing}
                  error={error}
                  showToast={showToast}
                  onBack={() => {
                    setActiveResult(null);
                    setError(null);
                  }}
                />
              ) : (
                <TranslationForm
                  onSubmitText={handleSubmitText}
                  onSubmitFile={handleSubmitFile}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </main>
        );
      })()}

      {/* Reading History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        showToast={showToast}
      />

      {/* Toast Notification Container */}
      <Toast message={toastMsg} />
    </div>
  );
}
