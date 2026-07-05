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

  let deptId = "security";
  let issueType = "Community Issue";
  let severity: Severity = "medium";
  let summary = dto.description || "Citizen report.";

  if (category === "flood") {
    deptId = "water";
    issueType = "Flooding / Water Emergency";
    severity = "critical";
  } else if (category === "accident") {
    deptId = "traffic";
    issueType = "Traffic Accident";
    severity = "critical";
  } else if (category === "infrastructure") {
    deptId = "water";
    if (dto.description && /electricity|power|light/i.test(dto.description)) {
      deptId = "power";
      issueType = "Power / Electricity Fault";
    } else {
      issueType = "Road / Infrastructure Damage";
    }
    severity = "medium";
  } else if (category === "gov_delay") {
    deptId = "governance";
    issueType = "Governance / Delay Issue";
    severity = "low";
  } else if (category === "safety") {
    deptId = "security";
    issueType = "Security / Safety Incident";
    severity = "high";
  } else {
    deptId = "security";
    issueType = "Community Incident";
    severity = "low";
  }

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
