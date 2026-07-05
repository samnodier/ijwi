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

const PORT = Number(process.env.PORT ?? 3000);

const app = express();

app.use(cors());
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
