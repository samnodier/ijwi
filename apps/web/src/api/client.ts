const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const TOKEN_KEY = "ijwi_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    let message = `API error: ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export type ReportStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "rejected";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Media {
  id: string;
  type: "image" | "video";
  url: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string | null;
}

export interface Author {
  id: string;
  displayName: string | null;
  username: string | null;
}

export interface Report {
  id: string;
  title: string | null;
  description: string;
  category: string | null;
  status: ReportStatus;
  location: Location | null;
  capturedAt: string | null;
  media: Media[];
  photos: string[];
  author: Author | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyNumber {
  id: string;
  name: string;
  number: string;
  category: string;
}

export interface CreateReportInput {
  title?: string;
  description: string;
  category: string;
  location?: Location;
}

export interface DashboardSummary {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  recent: Report[];
}

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

async function authRequest(
  path: string,
  body: unknown,
): Promise<AuthResponse> {
  const res = await apiFetch<AuthResponse>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  setToken(res.token);
  return res;
}

export const api = {
  register: (name: string, email: string, password: string) =>
    authRequest("/auth/register", { name, email, password }),

  login: (email: string, password: string) =>
    authRequest("/auth/login", { email, password }),

  loginWithGoogle: (idToken: string) =>
    authRequest("/auth/google", { idToken }),

  me: () => apiFetch<User>("/auth/me"),

  logout: () => setToken(null),

  listReports: () => apiFetch<Report[]>("/reports"),

  myReports: () => apiFetch<Report[]>("/reports/mine"),

  getReport: (id: string) => apiFetch<Report>(`/reports/${id}`),

  // Creates a post and uploads its media (images/videos) in one request.
  createReport: (input: CreateReportInput, media: File[] = []) => {
    const form = new FormData();
    if (input.title) form.append("title", input.title);
    form.append("description", input.description);
    form.append("category", input.category);
    if (input.location) form.append("location", JSON.stringify(input.location));
    for (const file of media) form.append("media", file);

    return apiFetch<Report>("/reports", { method: "POST", body: form });
  },

  updateReportStatus: (id: string, status: ReportStatus) =>
    apiFetch<Report>(`/reports/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }),

  // Edit own report (author only).
  updateReport: (
    id: string,
    fields: {
      title?: string | null;
      description?: string;
      category?: string | null;
      location?: Location | null;
    },
  ) =>
    apiFetch<Report>(`/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    }),

  // Delete own report (author only). Returns nothing (204).
  deleteReport: (id: string) =>
    fetch(`${API_BASE}/reports/${id}`, {
      method: "DELETE",
      headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
    }).then((r) => {
      if (!r.ok) throw new Error(`API error: ${r.status}`);
    }),

  listEmergencyNumbers: () =>
    apiFetch<EmergencyNumber[]>("/emergency-numbers"),

  getDashboardSummary: () =>
    apiFetch<DashboardSummary>("/dashboard/summary"),
};
