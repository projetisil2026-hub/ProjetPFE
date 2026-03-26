import { createContext, useContext, useState, useEffect } from 'react';
import { createToken, verifyPassword, saveAuth, loadAuth, clearAuth } from '../utils/auth';
import { storage, KEYS } from '../utils/storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = loadAuth();
    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
    }
    setLoading(false);
  }, []);

  const login = (email, password, expectedRole) => {
    const users = storage.getAll(KEYS.USERS);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!found) return { success: false, error: 'user_not_found' };
    if (!verifyPassword(password, found.password)) return { success: false, error: 'invalid_password' };
    if (expectedRole && found.role !== expectedRole) return { success: false, error: 'role_mismatch' };

    const { password: _, ...safeUser } = found;
    const newToken = createToken({ userId: found.id, role: found.role });

    saveAuth(newToken, safeUser);
    setUser(safeUser);
    setToken(newToken);

    return { success: true, user: safeUser };
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setToken(null);
  };

  const refreshUser = () => {
    if (!user) return;
    const fresh = storage.findOne(KEYS.USERS, u => u.id === user.id);
    if (fresh) {
      const { password: _, ...safeUser } = fresh;
      setUser(safeUser);
      saveAuth(token, safeUser);
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
