import type { AuthResponse, LoginPayload, SignupPayload, User } from "@/lib/types";

// Mock auth — replace with apiClient calls when backend is ready
const MOCK_USER: User = {
  id: "usr-001",
  name: "Alex Johnson",
  email: "alex@acme.com",
  role: "ADMIN",
  workspaceId: "ws-1",
  workspaceName: "Acme Corp",
  createdAt: "2026-01-15T00:00:00Z",
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  // MOCK: simulate network delay
  await new Promise((r) => setTimeout(r, 800));
  if (payload.email && payload.password.length >= 6) {
    const token = "mock_token_" + Date.now();
    return { user: MOCK_USER, token };
  }
  throw new Error("Invalid email or password");
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  await new Promise((r) => setTimeout(r, 1000));
  if (payload.email && payload.password.length >= 8) {
    const user: User = {
      ...MOCK_USER,
      name: payload.name,
      email: payload.email,
      workspaceName: payload.workspaceName,
      role: "ADMIN",
    };
    return { user, token: "mock_token_" + Date.now() };
  }
  throw new Error("Signup failed. Please check your details.");
}

export async function getMe(): Promise<User> {
  await new Promise((r) => setTimeout(r, 200));
  return MOCK_USER;
}

export function logout(): void {
  localStorage.removeItem("loop_token");
  localStorage.removeItem("loop_user");
}
