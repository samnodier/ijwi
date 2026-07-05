import express from "express";

import { config } from "./config.js";
import { analyzeRouter } from "./routes/analyze.js";
import { summarizeRouter } from "./routes/summarize.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", provider: config.aiProvider });
});

app.use(analyzeRouter);
app.use(summarizeRouter);

app.listen(config.port, () => {
  console.log(`IJWI AI service listening on http://localhost:${config.port} (provider: ${config.aiProvider})`);
});
