"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import type { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user: User | null = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      role: session.user.role,
      workspaceId: session.user.workspaceId,
      workspaceName: session.user.workspaceName,
      createdAt: "",
    };
  }, [session]);

  const signOut = () => {
    nextAuthSignOut({ callbackUrl: "/login" });
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading: status === "loading", signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}