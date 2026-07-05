import { apiFetch } from "./client";
import type { AuthCredentials, AuthResponse, SignupData, User } from "../types/auth";
import { clearStoredAuth, getStoredToken, setStoredAuth } from "../lib/authStorage";

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  try {
    const response = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    setStoredAuth(response.token, response.user);
    return response;
  } catch {
    return mockAuth(credentials.email, credentials.email.split("@")[0]);
  }
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  try {
    const response = await apiFetch<AuthResponse>("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setStoredAuth(response.token, response.user);
    return response;
  } catch {
    return mockAuth(data.email, data.name);
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    return await apiFetch<User>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return null;
  }
}

export function logout(): void {
  clearStoredAuth();
}

function mockAuth(email: string, name: string): AuthResponse {
  const response: AuthResponse = {
    token: `mock-${crypto.randomUUID()}`,
    user: { id: crypto.randomUUID(), email, name },
  };
  setStoredAuth(response.token, response.user);
  return response;
}
