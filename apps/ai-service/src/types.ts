import { z } from "zod";

export const reportCategories = [
  "flood",
  "accident",
  "infrastructure",
  "gov_delay",
  "safety",
  "other",
] as const;

export const ReportCategory = z.enum(reportCategories);
export type ReportCategory = z.infer<typeof ReportCategory>;

export const AuthoritySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
});
export type Authority = z.infer<typeof AuthoritySchema>;

export const AnalyzeReportRequestSchema = z.object({
  reportId: z.string(),
  description: z.string().default(""),
  photoUrls: z.array(z.string()).default([]),
  lat: z.number().optional(),
  lng: z.number().optional(),
  authorities: z.array(AuthoritySchema).default([]),
});
export type AnalyzeReportRequest = z.infer<typeof AnalyzeReportRequestSchema>;

export const AnalyzeReportResultSchema = z.object({
  category: ReportCategory,
  urgency: z.number().int().min(1).max(5),
  suggestedAuthorityId: z.string().nullable(),
  summary: z.string(),
  duplicateOf: z.string().nullable(),
  provider: z.string(),
});
export type AnalyzeReportResult = z.infer<typeof AnalyzeReportResultSchema>;

export const SummarizeRequestSchema = z.object({
  summaries: z.array(z.string()).default([]),
});
export type SummarizeRequest = z.infer<typeof SummarizeRequestSchema>;

export interface SummarizeResult {
  digest: string;
  provider: string;
}
