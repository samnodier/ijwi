import { relations } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const postStatusEnum = pgEnum("post_status", [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

// ---------------------------------------------------------------------------
// Users
//
// Accounts are optional. Anonymous reports simply have no author. When a
// citizen chooses to create an account, we can link their posts back to them
// so they can track the status of everything they've submitted.
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
  // Null for Google-only accounts (no password set).
  passwordHash: text("password_hash"),
  // Google account id (from the verified ID token). Null for password users.
  googleId: varchar("google_id", { length: 255 }).unique(),
  displayName: varchar("display_name", { length: 120 }),
  avatarUrl: text("avatar_url"),
  phone: varchar("phone", { length: 30 }),
  isAnonymous: boolean("is_anonymous").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Posts (reports / questions submitted by citizens)
// ---------------------------------------------------------------------------

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Nullable => anonymous post. onDelete "set null" keeps the post if the
  // account is later removed.
  authorId: uuid("author_id").references(() => users.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 200 }),
  description: text("description").notNull(),
  category: varchar("category", { length: 60 }),
  status: postStatusEnum("status").notNull().default("pending"),

  // Location of the reported event. Kept at the post level for fast geo
  // queries / map rendering (can be indexed with PostGIS later).
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  locationName: varchar("location_name", { length: 255 }),

  // When the primary media was captured (from EXIF), which may differ from
  // when the post was created.
  capturedAt: timestamp("captured_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Media (images / videos stored on Cloudinary)
//
// A post can have many media items. Each item stores the Cloudinary URL and
// public id (needed for deletion/transforms) plus the per-file EXIF metadata:
// GPS coordinates and capture timestamp.
// ---------------------------------------------------------------------------

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),

  type: mediaTypeEnum("type").notNull().default("image"),
  // Cloudinary secure_url and public_id.
  url: text("url").notNull(),
  publicId: text("public_id"),
  format: varchar("format", { length: 20 }),
  width: integer("width"),
  height: integer("height"),
  // For videos only.
  durationSeconds: doublePrecision("duration_seconds"),

  // EXIF metadata for where/when the file was captured.
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  capturedAt: timestamp("captured_at", { withTimezone: true }),
  // Raw EXIF / Cloudinary metadata blob for anything we don't model yet.
  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  media: many(media),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  post: one(posts, {
    fields: [media.postId],
    references: [posts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types (use across the API)
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
