import { signIn } from "next-auth/react";
import type { LoginPayload, SignupPayload } from "@/lib/types";

export async function login(payload: LoginPayload): Promise<void> {
  const res = await signIn("credentials", {
    email: payload.email,
    password: payload.password,
    redirect: false,
  });

  if (res?.error) {
    throw new Error("Invalid email or password");
  }
}

export async function signup(payload: SignupPayload): Promise<void> {
  const res = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Signup failed. Please try again.");
  }

  const signInRes = await signIn("credentials", {
    email: payload.email,
    password: payload.password,
    redirect: false,
  });
  if (signInRes?.error) {
    throw new Error("Account created, but automatic sign-in failed. Please log in.");
  }
}

export function logout(): void {
  // Handled by AuthContext.signOut() → calls next-auth's signOut()
}