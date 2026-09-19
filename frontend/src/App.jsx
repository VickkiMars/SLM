import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import TranslationForm from './components/TranslationForm';
import ReaderView from './components/ReaderView';
import HistoryDrawer from './components/HistoryDrawer';
import Toast from './components/Toast';
import { translateText, translateFile, subscribeJobStatus } from './services/apiService';

export default function App() {
  const { token } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // Persist activeResult to localStorage
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

  const handleStartJob = (jobId) => {
    setIsProcessing(true);
    setError(null);

    subscribeJobStatus(jobId, token, {
      onUpdate: (blob) => {
        if (blob && blob.output) {
          setIsProcessing(false);
          setActiveResult(blob);
        }
      },
      onComplete: (blob) => {
        setIsProcessing(false);
        setActiveResult(blob);
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
      const data = await translateText(payload, token);
      if (data.job_id) {
        handleStartJob(data.job_id);
      }
    } catch (err) {
      setIsProcessing(false);
      setError(err);
    }
  };

  const handleSubmitFile = async (file, srcLang, tgtLang) => {
    setIsProcessing(true);
    setError(null);
    setActiveResult(null);

    try {
      const data = await translateFile(file, srcLang, tgtLang, token);
      if (data.job_id) {
        handleStartJob(data.job_id);
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
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Side Navigation Rail / Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Workspace Area */}
      {(() => {
        const isReadingMode = Boolean(activeResult || isProcessing || error);
        return (
          <main className={`ml-0 md:ml-20 mt-16 flex-1 w-full md:w-[calc(100vw-80px)] mx-auto relative z-10 flex flex-col items-center ${
            isReadingMode ? 'px-2 sm:px-4 md:px-6 py-6 max-w-none' : 'px-6 sm:px-8 lg:px-12 py-10 max-w-6xl'
          }`}>
            
            {/* Hero Banner - hidden in active reading mode for edge-to-edge reading canvas */}
            {!isReadingMode && (
              <div className="mb-10 max-w-3xl w-full text-left">
                <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-md bg-[#E8EFFF] text-[#00194B] border border-[#1A56C4]/20 text-xs font-extrabold uppercase tracking-wider font-serif">
                  <span className="w-2 h-2 rounded-full bg-[#1A56C4]" />
                  <span>Sound &amp; Language Mapper</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-tight leading-tight text-[#111111]">
                  Read any foreign text. <span className="font-serif italic font-black text-[#B84D00]">Understand every word.</span>
                </h1>

                <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed font-sans font-normal">
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
                  onOpenAuth={() => setIsAuthOpen(true)}
                  token={token}
                />
              )}
            </div>
          </main>
        );
      })()}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
      />

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
