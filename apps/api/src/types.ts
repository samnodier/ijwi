export type ReportStatus = "pending" | "in_progress" | "resolved" | "rejected";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface MediaDTO {
  id: string;
  type: "image" | "video";
  url: string;
  latitude: number | null;
  longitude: number | null;
  capturedAt: string | null;
}

export interface AuthorDTO {
  id: string;
  displayName: string | null;
  username: string | null;
}

// Shape returned by the API for a post/report. `photos` is kept as a flat
// list of URLs for backwards compatibility with the existing frontend.
export interface ReportDTO {
  id: string;
  title: string | null;
  description: string;
  category: string | null;
  status: ReportStatus;
  location: Location | null;
  capturedAt: string | null;
  media: MediaDTO[];
  photos: string[];
  author: AuthorDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyNumber {
  id: string;
  name: string;
  number: string;
  category: string;
}

export interface UserDTO {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}
