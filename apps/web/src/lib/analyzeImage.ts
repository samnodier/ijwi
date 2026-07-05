import type { AnalysisProgress, AnalysisResult } from "../types/report";
import { mockAnalyzeImage } from "./mockAi";

export async function analyzeImage(
  file: File,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<AnalysisResult> {
  if (import.meta.env.VITE_USE_REAL_API === "true") {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch("/api/analyze", { method: "POST", body: form });
    if (!res.ok) throw new Error("Analysis failed");
    return res.json() as Promise<AnalysisResult>;
  }
  return mockAnalyzeImage(file, onProgress);
}
