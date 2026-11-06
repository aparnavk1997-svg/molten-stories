import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Client-side gate only: this keeps casual visitors out but is NOT real security.
// Override at build time with VITE_ADMIN_PASSCODE.
const PASSCODE = import.meta.env.VITE_ADMIN_PASSCODE || 'molten-admin';
const AUTH_KEY = 'molten-stories-admin';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1');

  const signIn = useCallback((code) => {
    if (code !== PASSCODE) return false;
    sessionStorage.setItem(AUTH_KEY, '1');
    setIsAdmin(true);
    return true;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(AUTH_KEY);
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({ isAdmin, signIn, signOut }), [isAdmin, signIn, signOut]);
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
