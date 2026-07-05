import type { NextFunction, Request, Response } from "express";

import { config } from "./config.js";

/** Reject requests that do not carry the shared internal secret. */
export function requireInternalSecret(req: Request, res: Response, next: NextFunction): void {
  if (req.header("X-Internal-Secret") !== config.aiServiceSecret) {
    res.status(401).json({ error: "Invalid or missing X-Internal-Secret header." });
    return;
  }
  next();
}
