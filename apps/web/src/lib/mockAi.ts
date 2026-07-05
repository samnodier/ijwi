import type { AnalysisResult, AnalysisProgress, Department } from "../types/report";

export const DEPARTMENTS: Department[] = [
  {
    id: "emergency",
    name: "Emergency Management",
    contact: "911 / emergency@city.gov",
    responseTime: "Within 2 hours",
  },
  {
    id: "public-works",
    name: "Public Works",
    contact: "publicworks@city.gov",
    responseTime: "Within 3–5 business days",
  },
  {
    id: "police",
    name: "Police / Traffic Safety",
    contact: "traffic@city.gov",
    responseTime: "Within 1 hour",
  },
  {
    id: "utilities",
    name: "Utilities",
    contact: "utilities@city.gov",
    responseTime: "Within 24 hours",
  },
  {
    id: "sanitation",
    name: "Sanitation",
    contact: "sanitation@city.gov",
    responseTime: "Within 2 business days",
  },
  {
    id: "parks",
    name: "Parks & Recreation",
    contact: "parks@city.gov",
    responseTime: "Within 5 business days",
  },
  {
    id: "planning",
    name: "City Planning",
    contact: "planning@city.gov",
    responseTime: "Within 7 business days",
  },
];

type IssueTemplate = {
  keywords: string[];
  issueType: string;
  severity: AnalysisResult["severity"];
  summary: string;
  departmentId: string;
  tags: string[];
};

const ISSUE_TEMPLATES: IssueTemplate[] = [
  {
    keywords: ["flood", "water", "rain", "drain", "leak"],
    issueType: "Flooding / Water Damage",
    severity: "critical",
    summary: "Standing water or flooding detected that may pose safety risks to residents and traffic.",
    departmentId: "emergency",
    tags: ["flooding", "water", "infrastructure"],
  },
  {
    keywords: ["pothole", "road", "crack", "asphalt", "pavement"],
    issueType: "Pothole / Road Damage",
    severity: "medium",
    summary: "Road surface damage detected that could cause vehicle damage or accidents.",
    departmentId: "public-works",
    tags: ["roads", "pothole", "transportation"],
  },
  {
    keywords: ["accident", "crash", "collision", "car", "traffic"],
    issueType: "Traffic Accident",
    severity: "critical",
    summary: "Possible traffic incident detected requiring immediate attention from authorities.",
    departmentId: "police",
    tags: ["accident", "traffic", "emergency"],
  },
  {
    keywords: ["light", "streetlight", "lamp", "dark", "electric"],
    issueType: "Broken Streetlight",
    severity: "medium",
    summary: "Non-functioning street lighting detected, creating a public safety concern at night.",
    departmentId: "utilities",
    tags: ["lighting", "utilities", "safety"],
  },
  {
    keywords: ["trash", "dump", "garbage", "litter", "waste"],
    issueType: "Illegal Dumping",
    severity: "low",
    summary: "Unauthorized waste disposal detected in a public area.",
    departmentId: "sanitation",
    tags: ["sanitation", "waste", "environment"],
  },
  {
    keywords: ["park", "playground", "bench", "tree", "garden"],
    issueType: "Park / Playground Damage",
    severity: "low",
    summary: "Damage to public recreational infrastructure detected.",
    departmentId: "parks",
    tags: ["parks", "recreation", "maintenance"],
  },
  {
    keywords: ["construction", "project", "delay", "building", "scaffold"],
    issueType: "Construction Delay",
    severity: "medium",
    summary: "Incomplete or stalled government construction project detected.",
    departmentId: "planning",
    tags: ["construction", "planning", "infrastructure"],
  },
];

const LOADING_STAGES = [
  { stage: "Scanning image…", progress: 20 },
  { stage: "Detecting issue type…", progress: 45 },
  { stage: "Assessing severity…", progress: 65 },
  { stage: "Matching department…", progress: 85 },
  { stage: "Finalizing report…", progress: 100 },
];

function findTemplate(filename: string): IssueTemplate {
  const lower = filename.toLowerCase();
  for (const template of ISSUE_TEMPLATES) {
    if (template.keywords.some((kw) => lower.includes(kw))) {
      return template;
    }
  }
  const index = Math.abs(hashString(filename)) % ISSUE_TEMPLATES.length;
  return ISSUE_TEMPLATES[index];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function buildResult(template: IssueTemplate): AnalysisResult {
  const department = DEPARTMENTS.find((d) => d.id === template.departmentId)!;
  const confidence = 78 + (Math.abs(hashString(template.issueType)) % 18);

  return {
    issueType: template.issueType,
    severity: template.severity,
    confidence,
    summary: template.summary,
    department,
    tags: template.tags,
  };
}

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS.find((d) => d.id === id);
}

export async function mockAnalyzeImage(
  file: File,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<AnalysisResult> {
  for (const stage of LOADING_STAGES) {
    onProgress?.(stage);
    await delay(350);
  }

  const template = findTemplate(file.name);
  return buildResult(template);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
