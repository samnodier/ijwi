import type { AnalysisResult, AnalysisProgress, Department } from "../types/report";

// Real Rwanda authorities. IDs match the backend routing categories
// (apps/api/src/data/emergencyNumbers.ts) so the preview and the actual
// dispatched authority line up.
export const DEPARTMENTS: Department[] = [
  {
    id: "security",
    name: "Rwanda National Police",
    contact: "112",
    responseTime: "Within 1 hour",
  },
  {
    id: "traffic",
    name: "Traffic Police",
    contact: "113",
    responseTime: "Within 1 hour",
  },
  {
    id: "fire",
    name: "Fire & Rescue Brigade",
    contact: "111",
    responseTime: "Within 1 hour",
  },
  {
    id: "medical",
    name: "Ambulance / SAMU",
    contact: "912",
    responseTime: "Immediate",
  },
  {
    id: "water",
    name: "WASAC (Water & Sanitation)",
    contact: "3535",
    responseTime: "Within 24 hours",
  },
  {
    id: "power",
    name: "REG / EUCL (Electricity)",
    contact: "2727",
    responseTime: "Within 24 hours",
  },
  {
    id: "gbv",
    name: "Isange One Stop Center (GBV)",
    contact: "3512",
    responseTime: "Immediate",
  },
  {
    id: "child",
    name: "Child Helpline",
    contact: "116",
    responseTime: "Immediate",
  },
  {
    id: "fraud",
    name: "RIB (Fraud / Cybercrime)",
    contact: "166",
    responseTime: "Within 48 hours",
  },
  {
    id: "corruption",
    name: "Anti-Corruption Hotline",
    contact: "997",
    responseTime: "Within 5 business days",
  },
  {
    id: "governance",
    name: "Office of the Ombudsman",
    contact: "3138034",
    responseTime: "Within 5 business days",
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
    keywords: ["gbv", "gender", "domestic", "abuse", "rape"],
    issueType: "Gender-Based Violence",
    severity: "critical",
    summary: "Possible gender-based violence reported, requiring immediate and confidential response.",
    departmentId: "gbv",
    tags: ["gbv", "safety", "emergency"],
  },
  {
    keywords: ["fire", "burning", "smoke", "flame"],
    issueType: "Fire",
    severity: "critical",
    summary: "Active fire or smoke detected that poses a danger to people and property.",
    departmentId: "fire",
    tags: ["fire", "emergency"],
  },
  {
    keywords: ["flood", "rain", "drain", "flooding", "submerged"],
    issueType: "Flooding / Water Emergency",
    severity: "critical",
    summary: "Standing water or flooding detected that may pose safety risks to residents and traffic.",
    departmentId: "fire",
    tags: ["flooding", "water", "emergency"],
  },
  {
    keywords: ["accident", "crash", "collision", "car", "traffic"],
    issueType: "Traffic Accident",
    severity: "critical",
    summary: "Possible traffic incident detected requiring immediate attention from authorities.",
    departmentId: "traffic",
    tags: ["accident", "traffic", "emergency"],
  },
  {
    keywords: ["injured", "bleeding", "ambulance", "medical", "sick", "unconscious"],
    issueType: "Medical Emergency",
    severity: "critical",
    summary: "A person appears injured or in need of urgent medical assistance.",
    departmentId: "medical",
    tags: ["medical", "emergency"],
  },
  {
    keywords: ["crime", "theft", "robbery", "assault", "danger", "safety", "attack"],
    issueType: "Security / Crime",
    severity: "high",
    summary: "A possible security or crime situation detected that needs police attention.",
    departmentId: "security",
    tags: ["crime", "security", "safety"],
  },
  {
    keywords: ["light", "streetlight", "lamp", "electric", "power", "outage", "transformer"],
    issueType: "Power / Electricity Fault",
    severity: "medium",
    summary: "Electrical fault or non-functioning street lighting detected, a public safety concern.",
    departmentId: "power",
    tags: ["power", "electricity", "safety"],
  },
  {
    keywords: ["pipe", "tap", "sewer", "leak", "wasac", "no water"],
    issueType: "Water Supply Issue",
    severity: "medium",
    summary: "Water supply or sanitation problem detected, such as a burst pipe or outage.",
    departmentId: "water",
    tags: ["water", "sanitation", "infrastructure"],
  },
  {
    keywords: ["corruption", "bribe", "embezzle", "kickback"],
    issueType: "Corruption",
    severity: "medium",
    summary: "A report of possible corruption or abuse of public office.",
    departmentId: "corruption",
    tags: ["corruption", "governance"],
  },
  {
    keywords: ["scam", "fraud", "phishing", "cybercrime"],
    issueType: "Fraud / Cybercrime",
    severity: "medium",
    summary: "A possible fraud or cybercrime incident detected.",
    departmentId: "fraud",
    tags: ["fraud", "cybercrime"],
  },
  {
    keywords: ["child", "minor", "kid"],
    issueType: "Child Protection",
    severity: "high",
    summary: "A child protection concern that requires urgent, specialised attention.",
    departmentId: "child",
    tags: ["child", "safety"],
  },
  {
    keywords: [
      "pothole", "road", "bridge", "infrastructure", "garbage",
      "dump", "litter", "waste", "stalled", "project", "delay", "construction",
    ],
    issueType: "Infrastructure / Public Services",
    severity: "medium",
    summary: "A public infrastructure or service-delivery issue such as roads, waste, or a stalled project.",
    departmentId: "governance",
    tags: ["infrastructure", "public-services", "governance"],
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
