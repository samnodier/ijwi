import { Router } from "express";

import { getProvider } from "../providers/index.js";
import { requireInternalSecret } from "../security.js";
import { SummarizeRequestSchema } from "../types.js";

export const summarizeRouter = Router();

summarizeRouter.post("/summarize", requireInternalSecret, async (req, res) => {
  const parsed = SummarizeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await getProvider().summarize(parsed.data);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: "AI provider failed", detail: String(err) });
  }
});
