import "dotenv/config";
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { authRouter } from "./routes/auth.js";
import { reportsRouter } from "./routes/reports.js";
import { emergencyNumbersRouter } from "./routes/emergencyNumbers.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { openApiSpec } from "./docs/openapi.js";
import multer from "multer";
import { analyzeImageBuffer } from "./lib/aiClient.js";
import { resolveAuthority } from "./lib/dispatch.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

// CORS: restrict to CORS_ORIGIN (comma-separated list) when set, e.g. the
// deployed Vercel frontend. When unset, allow all origins (handy for local
// dev and demos).
const corsOrigin = process.env.CORS_ORIGIN?.trim();
app.use(
  cors(
    corsOrigin
      ? { origin: corsOrigin.split(",").map((o) => o.trim()), credentials: true }
      : undefined,
  ),
);
app.use(express.json());

// Note: the frontend calls `/api/*`, and the Vite dev proxy strips the
// `/api` prefix before forwarding here, so routes are mounted without it.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Interactive API docs (Swagger UI) at /docs, raw spec at /docs.json
app.get("/docs.json", (_req, res) => {
  res.json(openApiSpec);
});
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "IJWI API Docs",
  }),
);

app.use("/auth", authRouter);
app.use("/reports", reportsRouter);
app.use("/emergency-numbers", emergencyNumbersRouter);
app.use("/dashboard", dashboardRouter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

function getResponseTime(deptId: string): string {
  switch (deptId) {
    case "security":
    case "traffic":
    case "fire":
      return "Within 1 hour";
    case "medical":
    case "gbv":
    case "child":
      return "Immediate";
    case "water":
    case "power":
      return "Within 24 hours";
    case "fraud":
      return "Within 48 hours";
    case "corruption":
    case "governance":
      return "Within 5 business days";
    default:
      return "Within 24 hours";
  }
}

function getSeverity(urgency: number) {
  if (urgency >= 5) return "critical" as const;
  if (urgency >= 4) return "high" as const;
  if (urgency >= 3) return "medium" as const;
  return "low" as const;
}

app.post("/analyze", upload.single("image"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "image file is required" });
      return;
    }
    const description = typeof req.body?.description === "string" ? req.body.description : "";

    const analysis = await analyzeImageBuffer(file.buffer, file.mimetype, description);
    const routing = resolveAuthority(analysis.category, description);

    const severity = getSeverity(analysis.urgency);
    const responseTime = getResponseTime(routing.authority.category);

    res.json({
      issueType: routing.reason,
      severity,
      confidence: 90,
      summary: analysis.summary,
      department: {
        id: routing.authority.category,
        name: routing.authority.name,
        contact: routing.authority.number,
        responseTime,
      },
      tags: [analysis.category],
    });
  } catch (err) {
    next(err);
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler — returns JSON for any error thrown in a route.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`IJWI API listening on http://localhost:${PORT}`);
});
