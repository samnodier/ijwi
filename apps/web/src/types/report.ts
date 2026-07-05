export type Severity = "low" | "medium" | "high" | "critical";

export type ReportStatus = "submitted" | "received" | "in_progress" | "resolved";

export type Department = {
  id: string;
  name: string;
  contact: string;
  responseTime: string;
};

export type AnalysisResult = {
  issueType: string;
  severity: Severity;
  confidence: number;
  summary: string;
  department: Department;
  tags: string[];
};

export type Report = {
  id: string;
  createdAt: string;
  status: ReportStatus;
  photoDataUrl: string;
  description?: string;
  location?: { lat: number; lng: number };
  analysis: AnalysisResult;
  userId?: string;
  anonymous?: boolean;
};

export type AnalysisProgress = {
  stage: string;
  progress: number;
};

export type ReportDraft = {
  file: File;
  preview: string;
};
