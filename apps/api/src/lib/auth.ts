import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "1h") as SignOptions["expiresIn"];

if (!JWT_SECRET) {
  // Fail fast on boot so we never sign tokens with an empty secret.
  throw new Error("JWT_SECRET is not set. Add it to apps/api/.env");
}

export interface TokenPayload {
  sub: string; // user id
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded && "sub" in decoded) {
      return { sub: String((decoded as { sub: unknown }).sub) };
    }
    return null;
  } catch {
    return null;
  }
}
