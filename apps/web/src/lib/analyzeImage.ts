import type { AnalysisProgress, AnalysisResult } from "../types/report";
import { mockAnalyzeImage } from "./mockAi";
import { API_BASE } from "../api/client";

export async function analyzeImage(
  file: File,
  onProgress?: (progress: AnalysisProgress) => void,
): Promise<AnalysisResult> {
  try {
    const form = new FormData();
    form.append("image", file);
    const res = await fetch(`${API_BASE}/analyze`, { method: "POST", body: form });
    if (res.ok) {
      return await res.json() as AnalysisResult;
    }
  } catch (err) {
    console.warn("[ai] analyze failed, falling back to mock:", err);
  }

  return mockAnalyzeImage(file, onProgress);
}
