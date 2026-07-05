import type { Report } from "../types/report";
import { loadReports, saveReports } from "./storage";

const DEMO_REPORT: Report = {
  id: "demo-seed-report",
  createdAt: new Date(Date.now() - 86400000).toISOString(),
  status: "in_progress",
  photoDataUrl:
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#1e40af" width="400" height="300"/>
        <text x="200" y="140" text-anchor="middle" fill="white" font-size="20" font-family="sans-serif">Demo: Pothole</text>
        <text x="200" y="170" text-anchor="middle" fill="#93c5fd" font-size="14" font-family="sans-serif">Sample report for demo</text>
      </svg>`,
    ),
  description: "Large pothole on Main Street causing traffic slowdown.",
  location: { lat: 40.7128, lng: -74.006 },
  analysis: {
    issueType: "Pothole / Road Damage",
    severity: "medium",
    confidence: 91,
    summary: "Road surface damage detected that could cause vehicle damage or accidents.",
    department: {
      id: "public-works",
      name: "Public Works",
      contact: "publicworks@city.gov",
      responseTime: "Within 3–5 business days",
    },
    tags: ["roads", "pothole", "transportation"],
  },
};

export function seedDemoReportIfEmpty(): void {
  const existing = loadReports();
  if (existing.length === 0) {
    saveReports([DEMO_REPORT]);
  }
}
