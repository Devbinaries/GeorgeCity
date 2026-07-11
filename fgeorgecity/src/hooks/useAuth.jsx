import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isExpired } from 'react-jwt';

const AuthContext = createContext(null);

// ── Token helpers ──────────────────────────────────────────────────────────────

const TOKEN_KEY = '_auth_token';
const REFRESH_KEY = '_auth_refresh';
const USER_KEY = '_auth_user';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setAuthTokens(access, refresh) {
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── API helpers ────────────────────────────────────────────────────────────────

export async function fetchProfile() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/users/profile/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
}

export async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch('/api/token/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (response.ok) {
      const data = await response.json();
      setAuthTokens(data.access, refresh);
      return data.access;
    }
    return null;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return null;
  }
}

// ── AuthProvider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSavedUser);
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token is still valid
  useEffect(() => {
    async function verifyAuth() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // If the access token is expired, try refreshing before hitting the API
      if (isExpired(token)) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          clearAuth();
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
      }

      // Token is (now) valid — fetch the profile
      const profile = await fetchProfile();
      if (profile) {
        setUser(profile);
        saveUser(profile);
        setIsAuthenticated(true);
      } else {
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
      }

      setLoading(false);
    }

    verifyAuth();
  }, []);

  const login = useCallback((tokens, authState) => {
    setAuthTokens(tokens.access, tokens.refresh);
    setUser(authState);
    saveUser(authState);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    getAuthToken,
    getRefreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
