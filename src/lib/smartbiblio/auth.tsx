import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, setTokens, getAccessToken, getApiBase } from "./api";

export type Role = "reader" | "librarian" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: Role;
  qr_code?: string;
  is_active?: boolean;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getApiBase() || !getAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<{ user: AuthUser }>("/api/v1/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      setTokens(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<{ user: AuthUser; tokens: { access_token: string; refresh_token: string } }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    setTokens(data.tokens);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; first_name: string; last_name: string }) => {
      const data = await apiFetch<{ user: AuthUser; tokens: { access_token: string; refresh_token: string } }>(
        "/api/v1/auth/register",
        { method: "POST", body: JSON.stringify({ ...input, password_confirmation: input.password }) },
      );
      setTokens(data.tokens);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setTokens(null);
    setUser(null);
  }, []);

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user]);

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh, hasRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}