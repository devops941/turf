"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setToken } from "./api";
import type { Role, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role: Role;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await api.get<User>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ access_token: string; user: User }>("/api/auth/login", {
      email,
      password,
    });
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  }, []);

  const signup = useCallback(
    async (payload: { name: string; email: string; password: string; phone?: string; role: Role }) => {
      const res = await api.post<{ access_token: string; user: User }>(
        "/api/auth/signup",
        payload
      );
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function dashboardPathFor(role: Role | undefined): string {
  if (role === "ADMIN") return "/admin";
  if (role === "VENUE_OWNER") return "/owner";
  return "/dashboard";
}
