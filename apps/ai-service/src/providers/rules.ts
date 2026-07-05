import type { AIProvider } from "./base.js";
import { suggestAuthorityId } from "./routing.js";
import type {
  AnalyzeReportRequest,
  AnalyzeReportResult,
  ReportCategory,
  SummarizeRequest,
  SummarizeResult,
} from "../types.js";

// Keyword buckets used to classify report text.
const CATEGORY_KEYWORDS: Record<ReportCategory, string[]> = {
  flood: ["flood", "water", "rain", "overflow", "drainage", "submerged"],
  accident: ["accident", "crash", "collision", "injured", "hit", "vehicle"],
  infrastructure: ["pothole", "road", "bridge", "pipe", "power", "electricity", "streetlight", "broken"],
  gov_delay: ["delay", "unfinished", "stalled", "abandoned", "project", "months"],
  safety: ["fire", "crime", "theft", "assault", "danger", "gun", "violence"],
  other: [],
};

// High-urgency signals that bump the score regardless of category.
const URGENT_WORDS = ["trapped", "dying", "urgent", "emergency", "help", "injured", "fire", "drowning"];

/** Zero-cost keyword classifier. Ignores images; text only. */
export class RulesProvider implements AIProvider {
  readonly name = "rules";

  async analyze(request: AnalyzeReportRequest): Promise<AnalyzeReportResult> {
    const text = request.description.toLowerCase();

    let bestCategory: ReportCategory = "other";
    let bestScore = 0;
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      const hits = keywords.filter((word) => text.includes(word)).length;
      if (hits > bestScore) {
        bestScore = hits;
        bestCategory = category as ReportCategory;
      }
    }

    let urgency = bestScore > 0 ? 3 : 2;
    urgency += URGENT_WORDS.filter((word) => text.includes(word)).length;
    urgency = Math.max(1, Math.min(5, urgency));

    let summary = request.description.trim() || "Citizen report with no description.";
    if (summary.length > 120) summary = summary.slice(0, 117) + "...";

    return {
      category: bestCategory,
      urgency,
      suggestedAuthorityId: suggestAuthorityId(bestCategory, request.authorities),
      summary,
      duplicateOf: null,
      provider: this.name,
    };
  }

  async summarize(request: SummarizeRequest): Promise<SummarizeResult> {
    if (request.summaries.length === 0) {
      return { digest: "No reports to summarize.", provider: this.name };
    }
    const preview = request.summaries.slice(0, 5).join("; ");
    return {
      digest: `${request.summaries.length} report(s). Recent: ${preview}`,
      provider: this.name,
    };
  }
}
