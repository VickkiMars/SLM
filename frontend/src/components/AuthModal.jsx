import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Key, LogIn, UserPlus, X, LogOut, CheckCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, showToast }) {
  const { user, token, isAuthConfigured, login, signup, logout, setManualToken } = useAuth();
  const [activeTab, setActiveTab] = useState('token'); // 'login' | 'signup' | 'token'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tokenInput, setTokenInput] = useState(token);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully ✓');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await signup(email, password);
      showToast('Signup successful! Check email for confirmation.');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualToken = (e) => {
    e.preventDefault();
    setManualToken(tokenInput);
    showToast(tokenInput ? 'Bearer token saved ✓' : 'Bearer token cleared');
    onClose();
  };

  return (
    <div
      className="drawer-overlay flex items-start justify-end p-3 z-[200]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="drawer-container w-full max-w-sm flex flex-col gap-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slm-border">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-slm-pine" />
            <h3 className="font-serif font-bold text-base text-slm-ink">Authentication Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slm-inkMuted hover:text-slm-ink hover:bg-slm-paper transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slm-paper p-1 border border-slm-border">
          {isAuthConfigured && (
            <>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'login' ? 'bg-white text-slm-pine shadow-sm' : 'text-slm-inkMuted hover:text-slm-ink'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('signup'); setErrorMsg(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  activeTab === 'signup' ? 'bg-white text-slm-pine shadow-sm' : 'text-slm-inkMuted hover:text-slm-ink'
                }`}
              >
                Sign Up
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => { setActiveTab('token'); setErrorMsg(''); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'token' ? 'bg-white text-slm-pine shadow-sm' : 'text-slm-inkMuted hover:text-slm-ink'
            }`}
          >
            Bearer Token
          </button>
        </div>

        {/* Status Indicator */}
        {user ? (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between text-xs text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-semibold truncate">{user.email}</span>
            </div>
            <button
              onClick={() => { logout(); showToast('Logged out'); }}
              className="p-1 text-green-700 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : token ? (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold">Manual Bearer Token Active</span>
          </div>
        ) : null}

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-tight">
            {errorMsg}
          </div>
        )}

        {/* Forms */}
        {activeTab === 'login' && isAuthConfigured && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-xl border-2 border-slm-border bg-slm-paper px-3 py-2 text-xs font-sans text-slm-ink outline-none focus:border-slm-pine transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-slm-border bg-slm-paper px-3 py-2 text-xs font-sans text-slm-ink outline-none focus:border-slm-pine transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 bg-slm-pine hover:bg-slm-clay text-white text-xs font-semibold rounded-full transition active:scale-95 flex items-center justify-center gap-1.5 mt-1"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'Logging in...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {activeTab === 'signup' && isAuthConfigured && (
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-xl border-2 border-slm-border bg-slm-paper px-3 py-2 text-xs font-sans text-slm-ink outline-none focus:border-slm-pine transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-2 border-slm-border bg-slm-paper px-3 py-2 text-xs font-sans text-slm-ink outline-none focus:border-slm-pine transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-10 bg-slm-pine hover:bg-slm-clay text-white text-xs font-semibold rounded-full transition active:scale-95 flex items-center justify-center gap-1.5 mt-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>
        )}

        {activeTab === 'token' && (
          <form onSubmit={handleSaveManualToken} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slm-inkMuted">Supabase JWT / Bearer Token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full rounded-xl border-2 border-slm-border bg-slm-paper px-3 py-2 text-xs font-mono text-slm-ink outline-none focus:border-slm-pine transition"
              />
              <p className="text-[10px] text-slm-inkMuted leading-tight mt-0.5">
                Paste your Supabase JWT Bearer token directly for backend authorization.
              </p>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                className="flex-1 h-10 bg-slm-pine hover:bg-slm-clay text-white text-xs font-semibold rounded-full transition active:scale-95"
              >
                Save Token
              </button>
              {tokenInput && (
                <button
                  type="button"
                  onClick={() => { setTokenInput(''); setManualToken(''); showToast('Token cleared'); }}
                  className="px-4 h-10 border-2 border-slm-border text-slm-inkMuted hover:border-red-500 hover:text-red-600 text-xs font-semibold rounded-full transition active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
