import { Router } from "express";

import { getProvider } from "../providers/index.js";
import { requireInternalSecret } from "../security.js";
import { AnalyzeReportRequestSchema } from "../types.js";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", requireInternalSecret, async (req, res) => {
  const parsed = AnalyzeReportRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await getProvider().analyze(parsed.data);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: "AI provider failed", detail: String(err) });
  }
});
