import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, type User } from "../db/schema.js";
import { hashPassword, verifyPassword } from "../lib/auth.js";
import type { UserDTO } from "../types.js";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastError;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  };
}

async function findByEmail(email: string): Promise<User | undefined> {
  return withRetry(() =>
    db.query.users.findFirst({ where: eq(users.email, email) }),
  );
}

export async function getUserById(id: string): Promise<User | undefined> {
  return withRetry(() => db.query.users.findFirst({ where: eq(users.id, id) }));
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();

  const existing = await findByEmail(email);
  if (existing) {
    throw new AuthError("An account with this email already exists", 409);
  }

  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const [user] = await withRetry(() =>
    db
      .insert(users)
      .values({
        id: randomUUID(),
        email,
        passwordHash,
        displayName: input.name,
        isAnonymous: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning(),
  );

  return user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<User> {
  const email = input.email.trim().toLowerCase();
  const user = await findByEmail(email);

  if (!user || !user.passwordHash) {
    throw new AuthError("Invalid email or password", 401);
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new AuthError("Invalid email or password", 401);
  }

  return user;
}

// Find or create a user from a verified Google profile.
export async function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}): Promise<User> {
  const email = profile.email.trim().toLowerCase();

  // Match by Google id first, then by email (link existing account).
  const existing = await withRetry(() =>
    db.query.users.findFirst({ where: eq(users.googleId, profile.googleId) }),
  );
  if (existing) return existing;

  const byEmail = await findByEmail(email);
  if (byEmail) {
    const [updated] = await withRetry(() =>
      db
        .update(users)
        .set({
          googleId: profile.googleId,
          avatarUrl: byEmail.avatarUrl ?? profile.picture ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, byEmail.id))
        .returning(),
    );
    return updated;
  }

  const now = new Date();
  const [user] = await withRetry(() =>
    db
      .insert(users)
      .values({
        id: randomUUID(),
        email,
        googleId: profile.googleId,
        displayName: profile.name ?? null,
        avatarUrl: profile.picture ?? null,
        isAnonymous: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning(),
  );

  return user;
}
