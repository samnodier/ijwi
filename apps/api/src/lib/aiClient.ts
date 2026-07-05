import { emergencyNumbers } from "../data/emergencyNumbers.js";
import type { ReportDTO } from "../types.js";

// Optional integration with the AI service (apps/ai-service). When
// AI_SERVICE_URL is set, the backend asks it to classify a report from its
// text + photos (real vision). If it's not configured or the call fails, the
// caller falls back to the report's own category.

export interface AiAnalysis {
  category: string;
  urgency: number;
  summary: string;
  provider: string;
}

export const isAiConfigured = Boolean(process.env.AI_SERVICE_URL);

export async function analyzeWithAi(report: ReportDTO): Promise<AiAnalysis | null> {
  const baseUrl = process.env.AI_SERVICE_URL;
  if (!baseUrl) return null;

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": process.env.AI_SERVICE_SECRET ?? "",
      },
      body: JSON.stringify({
        reportId: report.id,
        description: report.description,
        photoUrls: report.photos,
        lat: report.location?.lat,
        lng: report.location?.lng,
        // The AI service can suggest one of these; we route by category so the
        // list is mainly context for its summary.
        authorities: emergencyNumbers.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.category,
        })),
      }),
    });

    if (!res.ok) {
      console.warn(`[ai] analyze failed: ${res.status}`);
      return null;
    }

    const data = (await res.json()) as Partial<AiAnalysis>;
    if (!data.category) return null;

    return {
      category: data.category,
      urgency: Number(data.urgency ?? 3),
      summary: data.summary ?? report.description,
      provider: data.provider ?? "ai",
    };
  } catch (err) {
    console.warn(`[ai] analyze error: ${String(err)}`);
    return null;
  }
}
