import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const TOKEN_KEY = 'tatabu_auth_token';
const USER_KEY = 'tatabu_auth_user';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password, expectedRole) => {
    try {
      const res = await authAPI.login(identifier, password, expectedRole);
      const { token: newToken, user: userData } = res.data;

      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (err) {
      const message = err.data?.message || err.message || 'login_failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authAPI.me();
      const fresh = res.data;
      localStorage.setItem(USER_KEY, JSON.stringify(fresh));
      setUser(fresh);
    } catch (err) {
      console.error('refreshUser failed:', err.message);
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
