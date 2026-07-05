import { apiFetch } from "./client";
import type { AuthCredentials, AuthResponse, SignupData, User } from "../types/auth";
import { clearStoredAuth, getStoredToken, setStoredAuth } from "../lib/authStorage";

// The backend represents the display name as `displayName`; the frontend uses `name`.
type BackendUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

type BackendAuthResponse = {
  token: string;
  user: BackendUser;
};

function mapUser(u: BackendUser): User {
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.displayName ?? u.email ?? "",
  };
}

export async function login(credentials: AuthCredentials): Promise<AuthResponse> {
  const res = await apiFetch<BackendAuthResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const user = mapUser(res.user);
  setStoredAuth(res.token, user);
  return { token: res.token, user };
}

export async function signup(data: SignupData): Promise<AuthResponse> {
  const res = await apiFetch<BackendAuthResponse>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const user = mapUser(res.user);
  setStoredAuth(res.token, user);
  return { token: res.token, user };
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const user = await apiFetch<BackendUser>("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return mapUser(user);
  } catch {
    // Invalid/expired token — treat as signed out.
    return null;
  }
}

export function logout(): void {
  clearStoredAuth();
}
