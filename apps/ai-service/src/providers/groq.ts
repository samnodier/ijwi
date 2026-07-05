import Groq from "groq-sdk";

import { config } from "../config.js";
import type { AIProvider } from "./base.js";
import { suggestAuthorityId } from "./routing.js";
import {
  ReportCategory,
  type AnalyzeReportRequest,
  type AnalyzeReportResult,
  type SummarizeRequest,
  type SummarizeResult,
} from "../types.js";

// Groq's multimodal models accept at most 5 images per request.
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

/** Vision-capable provider using Groq's free-tier multimodal models. */
export class GroqProvider implements AIProvider {
  readonly name = "groq";
  private client: Groq;
  private model: string;

  constructor() {
    if (!config.groqApiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to apps/ai-service/.env or set AI_PROVIDER=rules.",
      );
    }
    this.client = new Groq({ apiKey: config.groqApiKey });
    this.model = config.groqModel;
  }

  /** Download images and encode them as base64 data URLs Groq can read. */
  private async fetchImageDataUrls(urls: string[]): Promise<string[]> {
    const dataUrls: string[] = [];
    for (const url of urls.slice(0, MAX_IMAGES)) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const mime = resp.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
        const buffer = Buffer.from(await resp.arrayBuffer());
        dataUrls.push(`data:${mime};base64,${buffer.toString("base64")}`);
      } catch {
        // Skip unreachable images (e.g. private MinIO URL); text still works.
      }
    }
    return dataUrls;
  }

  async analyze(request: AnalyzeReportRequest): Promise<AnalyzeReportResult> {
    const content: Groq.Chat.Completions.ChatCompletionContentPart[] = [
      { type: "text", text: `Report description: ${request.description || "(none provided)"}` },
    ];
    for (const dataUrl of await this.fetchImageDataUrls(request.photoUrls)) {
      content.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: ANALYZE_SYSTEM_PROMPT },
        { role: "user", content },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");

    const category = ReportCategory.safeParse(parsed.category);
    const resolvedCategory = category.success ? category.data : "other";

    const urgency = Math.max(1, Math.min(5, Number(parsed.urgency) || 3));
    const summary = String(parsed.summary || request.description || "Citizen report.").trim();

    return {
      category: resolvedCategory,
      urgency,
      suggestedAuthorityId: suggestAuthorityId(resolvedCategory, request.authorities),
      summary,
      duplicateOf: null,
      provider: this.name,
    };
  }

  async summarize(request: SummarizeRequest): Promise<SummarizeResult> {
    if (request.summaries.length === 0) {
      return { digest: "No reports to summarize.", provider: this.name };
    }

    const joined = request.summaries.map((s) => `- ${s}`).join("\n");
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Summarize these civic reports into a 2-3 sentence briefing for authorities. " +
            "Highlight the most urgent and most common issues.",
        },
        { role: "user", content: `Reports:\n${joined}` },
      ],
      temperature: 0.3,
    });

    return {
      digest: (completion.choices[0]?.message?.content || "").trim(),
      provider: this.name,
    };
  }
}
