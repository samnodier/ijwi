import type { Report, ReportStatus } from "../types/report";

const STORAGE_KEY = "ijwi-reports";

export function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Report[];
  } catch {
    return [];
  }
}

export function saveReports(reports: Report[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

export function addReport(report: Report): void {
  const reports = loadReports();
  reports.unshift(report);
  saveReports(reports);
}

export function getReport(id: string): Report | undefined {
  return loadReports().find((r) => r.id === id);
}

export function updateReportStatus(id: string, status: ReportStatus): void {
  const reports = loadReports();
  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) return;
  reports[index] = { ...reports[index], status };
  saveReports(reports);
}
