import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { media, posts, type Media, type Post, type User } from "../db/schema.js";
import { deleteMedia } from "../lib/cloudinary.js";
import type { Location, ReportDTO, ReportStatus } from "../types.js";

// Neon's serverless HTTP endpoint can occasionally time out (cold start /
// transient network). Retry read-only queries a few times with backoff.
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

export interface CreatePostInput {
  title?: string | null;
  description: string;
  category?: string | null;
  location?: Location | null;
  authorId?: string | null;
}

export interface NewMediaItem {
  type: "image" | "video";
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  latitude?: number;
  longitude?: number;
  capturedAt?: Date;
  metadata?: Record<string, unknown>;
}

type PostWithRelations = Post & {
  media: Media[];
  author: User | null;
};

function toDTO(post: PostWithRelations): ReportDTO {
  const location: Location | null =
    post.latitude != null && post.longitude != null
      ? {
          lat: post.latitude,
          lng: post.longitude,
          address: post.locationName ?? undefined,
        }
      : null;

  return {
    id: post.id,
    title: post.title,
    description: post.description,
    category: post.category,
    status: post.status,
    location,
    capturedAt: post.capturedAt ? post.capturedAt.toISOString() : null,
    media: post.media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      latitude: m.latitude,
      longitude: m.longitude,
      capturedAt: m.capturedAt ? m.capturedAt.toISOString() : null,
    })),
    photos: post.media.map((m) => m.url),
    author: post.author
      ? {
          id: post.author.id,
          displayName: post.author.displayName,
          username: post.author.username,
        }
      : null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export async function listPosts(): Promise<ReportDTO[]> {
  const rows = await withRetry(() =>
    db.query.posts.findMany({
      with: { media: true, author: true },
      orderBy: [desc(posts.createdAt)],
    }),
  );
  return rows.map(toDTO);
}

export async function listPostsByAuthor(
  authorId: string,
): Promise<ReportDTO[]> {
  const rows = await withRetry(() =>
    db.query.posts.findMany({
      where: eq(posts.authorId, authorId),
      with: { media: true, author: true },
      orderBy: [desc(posts.createdAt)],
    }),
  );
  return rows.map(toDTO);
}

export async function getPost(id: string): Promise<ReportDTO | null> {
  const row = await withRetry(() =>
    db.query.posts.findFirst({
      where: eq(posts.id, id),
      with: { media: true, author: true },
    }),
  );
  return row ? toDTO(row) : null;
}

export async function createPost(
  input: CreatePostInput,
  mediaItems: NewMediaItem[],
): Promise<ReportDTO> {
  // Derive post-level location / capture time from the first media item that
  // carries EXIF data, unless a location was provided explicitly.
  const firstGeo = mediaItems.find(
    (m) => m.latitude != null && m.longitude != null,
  );
  const firstCaptured = mediaItems.find((m) => m.capturedAt);

  const latitude = input.location?.lat ?? firstGeo?.latitude ?? null;
  const longitude = input.location?.lng ?? firstGeo?.longitude ?? null;
  const capturedAt = firstCaptured?.capturedAt ?? null;

  // Generate ids client-side so we can insert post + media in a single
  // atomic batch (one round trip) and build the response without re-querying.
  const postId = randomUUID();
  const now = new Date();

  const postRow = {
    id: postId,
    title: input.title ?? null,
    description: input.description,
    category: input.category ?? null,
    status: "pending" as const,
    authorId: input.authorId ?? null,
    latitude,
    longitude,
    locationName: input.location?.address ?? null,
    capturedAt,
    createdAt: now,
    updatedAt: now,
  };

  const mediaRows = mediaItems.map((m) => ({
    id: randomUUID(),
    postId,
    type: m.type,
    url: m.url,
    publicId: m.publicId ?? null,
    format: m.format ?? null,
    width: m.width ?? null,
    height: m.height ?? null,
    durationSeconds: m.durationSeconds ?? null,
    latitude: m.latitude ?? null,
    longitude: m.longitude ?? null,
    capturedAt: m.capturedAt ?? null,
    metadata: m.metadata ?? null,
    createdAt: now,
  }));

  await withRetry(async () => {
    if (mediaRows.length > 0) {
      await db.batch([
        db.insert(posts).values(postRow),
        db.insert(media).values(mediaRows),
      ]);
    } else {
      await db.insert(posts).values(postRow);
    }
  });

  // Re-read so the response is fully hydrated (author relation included).
  const hydrated = await getPost(postId);
  if (hydrated) return hydrated;

  // Fallback: build the DTO locally if the read failed for any reason.
  const dtoPost: PostWithRelations = {
    ...postRow,
    media: mediaRows as unknown as Media[],
    author: null,
  };
  return toDTO(dtoPost);
}

export interface UpdatePostInput {
  title?: string | null;
  description?: string;
  category?: string | null;
  location?: Location | null;
}

export async function updatePost(
  id: string,
  input: UpdatePostInput,
): Promise<ReportDTO | null> {
  const set: Partial<typeof posts.$inferInsert> = { updatedAt: new Date() };

  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.category !== undefined) set.category = input.category;
  if (input.location !== undefined) {
    set.latitude = input.location?.lat ?? null;
    set.longitude = input.location?.lng ?? null;
    set.locationName = input.location?.address ?? null;
  }

  const [updated] = await withRetry(() =>
    db.update(posts).set(set).where(eq(posts.id, id)).returning(),
  );

  if (!updated) return null;
  return getPost(id);
}

// Deletes a post and its media rows (DB cascade), and best-effort removes the
// media files from Cloudinary. Returns false if the post did not exist.
export async function deletePost(id: string): Promise<boolean> {
  const mediaRows = await withRetry(() =>
    db.query.media.findMany({ where: eq(media.postId, id) }),
  );

  await Promise.all(
    mediaRows
      .filter((m) => m.publicId)
      .map((m) => deleteMedia(m.publicId!, m.type)),
  );

  const deleted = await withRetry(() =>
    db.delete(posts).where(eq(posts.id, id)).returning({ id: posts.id }),
  );

  return deleted.length > 0;
}

export async function updatePostStatus(
  id: string,
  status: ReportStatus,
): Promise<ReportDTO | null> {
  const [updated] = await withRetry(() =>
    db
      .update(posts)
      .set({ status, updatedAt: new Date() })
      .where(eq(posts.id, id))
      .returning(),
  );

  if (!updated) return null;
  return getPost(id);
}

export async function summarize() {
  const all = await listPosts();
  const byStatus: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const post of all) {
    byStatus[post.status] = (byStatus[post.status] ?? 0) + 1;
    const cat = post.category ?? "uncategorized";
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }

  return {
    total: all.length,
    byStatus,
    byCategory,
    recent: all.slice(0, 5),
  };
}
