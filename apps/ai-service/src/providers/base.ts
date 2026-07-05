import type {
  AnalyzeReportRequest,
  AnalyzeReportResult,
  SummarizeRequest,
  SummarizeResult,
} from "../types.js";

/** Interface every provider implements so they are interchangeable. */
export interface AIProvider {
  readonly name: string;
  analyze(request: AnalyzeReportRequest): Promise<AnalyzeReportResult>;
  summarize(request: SummarizeRequest): Promise<SummarizeResult>;
}
