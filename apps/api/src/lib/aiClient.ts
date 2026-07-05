import { emergencyNumbers } from "../data/emergencyNumbers.js";
import type { ReportDTO } from "../types.js";

export interface AiAnalysis {
  category: string;
  urgency: number;
  summary: string;
  provider: string;
}

const VALID_CATEGORIES = ["flood", "accident", "infrastructure", "gov_delay", "safety", "other"];
const MAX_IMAGES = 5;

const ANALYZE_SYSTEM_PROMPT = `You are a civic incident triage assistant for IJWI, a platform where \
citizens report community problems. Analyze the report text and any photos, then respond with a \
STRICT JSON object (no prose) using exactly these keys:
{
  "category": one of ["flood","accident","infrastructure","gov_delay","safety","other"],
  "urgency": integer 1-5 (5 = life-threatening, immediate response needed),
  "summary": one short sentence describing the incident,
  "duplicate": false
}
Base the category and urgency on what you actually see in the photos and read in the text.`;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  flood: ["flood", "water", "rain", "overflow", "drainage", "submerged"],
  accident: ["accident", "crash", "collision", "injured", "hit", "vehicle"],
  infrastructure: ["pothole", "road", "bridge", "pipe", "power", "electricity", "streetlight", "broken"],
  gov_delay: ["delay", "unfinished", "stalled", "abandoned", "project", "months"],
  safety: ["fire", "crime", "theft", "assault", "danger", "gun", "violence"],
  other: [],
};

const URGENT_WORDS = ["trapped", "dying", "urgent", "emergency", "help", "injured", "fire", "drowning"];

function sanitizeCategory(category: any): string {
  if (typeof category === "string") {
    const lower = category.toLowerCase().trim();
    if (VALID_CATEGORIES.includes(lower)) {
      return lower;
    }
  }
  return "other";
}

function analyzeWithRules(description: string): Omit<AiAnalysis, "provider"> {
  const text = (description || "").toLowerCase();

  let bestCategory = "other";
  let bestScore = 0;
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const hits = keywords.filter((word) => text.includes(word)).length;
    if (hits > bestScore) {
      bestScore = hits;
      bestCategory = category;
    }
  }

  let urgency = bestScore > 0 ? 3 : 2;
  urgency += URGENT_WORDS.filter((word) => text.includes(word)).length;
  urgency = Math.max(1, Math.min(5, urgency));

  let summary = (description || "").trim() || "Citizen report with no description.";
  if (summary.length > 120) summary = summary.slice(0, 117) + "...";

  return {
    category: bestCategory,
    urgency,
    summary,
  };
}

async function fetchImageDataUrls(urls: string[]): Promise<string[]> {
  const dataUrls: string[] = [];
  if (!urls) return dataUrls;
  for (const url of urls.slice(0, MAX_IMAGES)) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const mime = resp.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
      const buffer = Buffer.from(await resp.arrayBuffer());
      dataUrls.push(`data:${mime};base64,${buffer.toString("base64")}`);
    } catch {
      // Skip unreachable images (e.g. private MinIO URL or no network); text still works.
    }
  }
  return dataUrls;
}

export const isAiConfigured = Boolean(
  process.env.GROQ_API_KEY || process.env.AI_SERVICE_URL
);

export async function analyzeWithAi(report: ReportDTO): Promise<AiAnalysis | null> {
  // 1. Backwards compatibility: If AI_SERVICE_URL is explicitly configured, call the microservice.
  const baseUrl = process.env.AI_SERVICE_URL;
  if (baseUrl) {
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
          authorities: emergencyNumbers.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.category,
          })),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as Partial<AiAnalysis>;
        if (data.category) {
          return {
            category: sanitizeCategory(data.category),
            urgency: Number(data.urgency ?? 3),
            summary: data.summary ?? report.description,
            provider: data.provider ?? "ai-service",
          };
        }
      }
      console.warn(`[ai] microservice analyze returned non-ok status: ${res.status}`);
    } catch (err) {
      console.warn(`[ai] microservice analyze error: ${String(err)}`);
    }
  }

  // 2. Direct In-Process Groq Vision API
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      const model = process.env.GROQ_MODEL || "llama-3.2-11b-vision-preview";
      const contentParts: any[] = [
        { type: "text", text: `Report description: ${report.description || "(none provided)"}` }
      ];

      const dataUrls = await fetchImageDataUrls(report.photos);
      for (const dataUrl of dataUrls) {
        contentParts.push({ type: "image_url", image_url: { url: dataUrl } });
      }

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: ANALYZE_SYSTEM_PROMPT },
            { role: "user", content: contentParts },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        throw new Error(`Groq API responded with status ${res.status}`);
      }

      const data = await res.json() as any;
      const responseText = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(responseText);

      return {
        category: sanitizeCategory(parsed.category),
        urgency: Math.max(1, Math.min(5, Number(parsed.urgency) || 3)),
        summary: String(parsed.summary || report.description || "Citizen report.").trim(),
        provider: "groq-direct",
      };
    } catch (err) {
      console.warn(`[ai] direct groq analyze failed, falling back to rules: ${String(err)}`);
    }
  }

  // 3. Failover / Default: Rules-based local classifier
  const localAnalysis = analyzeWithRules(report.description);
  return {
    ...localAnalysis,
    provider: groqApiKey ? "rules (groq-direct failed)" : "rules (local default)",
  };
}
