import { apiFetch } from "./client";
import type { Report, ReportStatus, Severity, AnalysisResult } from "../types/report";
import { getStoredToken } from "../lib/authStorage";
import { addReport, loadReports } from "../lib/storage";
import { DEPARTMENTS } from "../lib/mockAi";

function mapDtoToReport(dto: any): Report {
  let status: ReportStatus = "submitted";
  if (dto.status === "in_progress") {
    status = "in_progress";
  } else if (dto.status === "resolved") {
    status = "resolved";
  } else if (dto.status === "rejected") {
    status = "submitted";
  } else if (dto.status === "pending") {
    status = "submitted";
  }

  const photoDataUrl = dto.photos && dto.photos.length > 0 ? dto.photos[0] : "";
  const category = dto.category || "other";

  const CATEGORY_DETAILS: Record<string, { deptId: string; issueType: string; severity: Severity }> = {
    security: { deptId: "security", issueType: "Security / Crime Incident", severity: "high" },
    traffic: { deptId: "traffic", issueType: "Traffic Accident", severity: "critical" },
    fire: { deptId: "fire", issueType: "Fire Emergency", severity: "critical" },
    medical: { deptId: "medical", issueType: "Medical Emergency", severity: "critical" },
    gbv: { deptId: "gbv", issueType: "Gender-Based Violence Report", severity: "critical" },
    child: { deptId: "child", issueType: "Child Protection Concern", severity: "high" },
    fraud: { deptId: "fraud", issueType: "Fraud / Cybercrime", severity: "medium" },
    corruption: { deptId: "corruption", issueType: "Corruption / Bribe Report", severity: "medium" },
    governance: { deptId: "governance", issueType: "Injustice / Stalled Project", severity: "low" },
    water: { deptId: "water", issueType: "Water Supply Issue", severity: "medium" },
    power: { deptId: "power", issueType: "Power / Electricity Fault", severity: "medium" },
    flood: { deptId: "water", issueType: "Flooding / Water Emergency", severity: "critical" },
    accident: { deptId: "traffic", issueType: "Traffic Accident", severity: "critical" },
    infrastructure: { deptId: "water", issueType: "Road / Infrastructure Damage", severity: "medium" },
    gov_delay: { deptId: "governance", issueType: "Governance / Delay Issue", severity: "low" },
    safety: { deptId: "security", issueType: "Security / Safety Incident", severity: "high" },
  };

  if (category === "infrastructure" && dto.description && /electricity|power|light/i.test(dto.description)) {
    CATEGORY_DETAILS.infrastructure = { deptId: "power", issueType: "Power / Electricity Fault", severity: "medium" };
  }

  const details = CATEGORY_DETAILS[category] || {
    deptId: "security",
    issueType: "Community Incident",
    severity: "low",
  };

  const deptId = details.deptId;
  const issueType = details.issueType;
  const severity = details.severity;
  const summary = dto.description || "Citizen report.";

  const department = DEPARTMENTS.find((d) => d.id === deptId) || DEPARTMENTS[0];

  const analysis: AnalysisResult = {
    issueType,
    severity,
    confidence: 100,
    summary,
    department,
    tags: [category],
  };

  return {
    id: dto.id,
    createdAt: dto.createdAt,
    status,
    photoDataUrl,
    description: dto.description,
    location: dto.location ? { lat: dto.location.lat, lng: dto.location.lng } : undefined,
    analysis,
    userId: dto.author?.id,
    anonymous: !dto.author,
  };
}

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
    const dtos = await apiFetch<any[]>("/reports/mine", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return dtos.map(mapDtoToReport);
  } catch {
    return loadReports();
  }
}

export function submitAnonymousReport(report: Report): Report {
  addReport({ ...report, anonymous: true });
  return report;
}

export async function fetchAllReports(): Promise<Report[]> {
  try {
    const dtos = await apiFetch<any[]>("/reports");
    return dtos.map(mapDtoToReport);
  } catch (err) {
    console.warn("Failed to fetch all reports, falling back to local storage:", err);
    return loadReports();
  }
}
