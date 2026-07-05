import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";

// Adds `req.userId` when a valid Bearer token is present.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

function extractUserId(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  const payload = verifyAccessToken(token);
  return payload?.sub;
}

// Attaches userId if a token is present, but never blocks the request.
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.userId = extractUserId(req);
  next();
}

// Requires a valid token, otherwise responds 401.
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = extractUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  req.userId = userId;
  next();
}
