import React, { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{
      user: null,
      token: null,
      isAuthConfigured: false,
      login: async () => {},
      signup: async () => {},
      logout: async () => {},
      setManualToken: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return { user: null, token: null };
  }
  return context;
}
