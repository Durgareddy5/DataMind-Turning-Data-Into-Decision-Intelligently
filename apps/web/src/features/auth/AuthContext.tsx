import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "../../types/api.js";
import { getStoredToken, setStoredToken } from "../../services/api.js";
import { login as loginRequest } from "../../services/analyst.api.js";

const USER_STORAGE_KEY = "aida.user";

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getStoredToken() ? loadStoredUser() : null));

  const login = useCallback(async (username: string, password: string) => {
    const { token, user: loggedInUser } = await loginRequest(username, password);
    setStoredToken(token);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
    } catch {
      // Non-fatal — the in-memory state below still works for this session.
    }
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
