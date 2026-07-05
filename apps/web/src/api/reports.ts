import { apiFetch } from "./client";
import type { Report } from "../types/report";
import { getStoredToken } from "../lib/authStorage";
import { addReport, loadReports } from "../lib/storage";

export async function submitReportToApi(report: Report): Promise<Report> {
  const token = getStoredToken();

  try {
    return await apiFetch<Report>("/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(report),
    });
  } catch {
    addReport(report);
    return report;
  }
}

export async function fetchUserReports(): Promise<Report[]> {
  const token = getStoredToken();
  if (!token) return [];

  try {
    return await apiFetch<Report[]>("/reports/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return loadReports();
  }
}

export function submitAnonymousReport(report: Report): Report {
  addReport({ ...report, anonymous: true });
  return report;
}
