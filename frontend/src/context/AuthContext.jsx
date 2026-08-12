import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('slm_bearer_token') || '');

  useEffect(() => {
    if (!supabase) return;

    // Check active Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        const jwt = session.access_token;
        setToken(jwt);
        localStorage.setItem('slm_bearer_token', jwt);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user);
        const jwt = session.access_token;
        setToken(jwt);
        localStorage.setItem('slm_bearer_token', jwt);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase client credentials are not configured in environment variables.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signup = async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase client credentials are not configured in environment variables.');
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setToken('');
    localStorage.removeItem('slm_bearer_token');
  };

  const setManualToken = (newToken) => {
    const trimmed = newToken.trim();
    setToken(trimmed);
    if (trimmed) {
      localStorage.setItem('slm_bearer_token', trimmed);
    } else {
      localStorage.removeItem('slm_bearer_token');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthConfigured: Boolean(supabase),
      login,
      signup,
      logout,
      setManualToken
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
