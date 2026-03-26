/**
 * Mock JWT + bcrypt authentication utilities
 */

const TOKEN_KEY = 'tatabu_auth_token';
const USER_KEY = 'tatabu_auth_user';
const SECRET = 'tatabu_jwt_secret_2024';

// Mock bcrypt - simple hash using btoa + salt
export const hashPassword = (password) => {
  return btoa(`${password}::${SECRET}`);
};

export const verifyPassword = (password, hash) => {
  return btoa(`${password}::${SECRET}`) === hash;
};

// Mock JWT
export const createToken = (payload) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 86400000 * 7, // 7 days
  }));
  const signature = btoa(`${header}.${body}.${SECRET}`);
  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const decodeToken = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

// Storage helpers
export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const loadAuth = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const userStr = localStorage.getItem(USER_KEY);
  if (!token || !userStr) return null;
  const payload = verifyToken(token);
  if (!payload) {
    clearAuth();
    return null;
  }
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};
