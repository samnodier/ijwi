import { Router } from "express";
import multer from "multer";
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  listPostsByAuthor,
  updatePost,
  updatePostStatus,
  type NewMediaItem,
} from "../services/posts.js";
import { isCloudinaryConfigured, uploadMedia } from "../lib/cloudinary.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import type { Location, ReportStatus } from "../types.js";

// Files are held in memory so we can stream them straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB per file (allows short videos)
  fileFilter: (_req, file, cb) => {
    const isMedia =
      file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    cb(null, isMedia);
  },
});

const VALID_STATUSES: ReportStatus[] = [
  "pending",
  "in_progress",
  "resolved",
  "rejected",
];

// Accepts either a `location` field as a JSON string, or separate
// `lat` / `lng` / `address` form fields.
function parseLocation(body: Record<string, unknown>): Location | undefined {
  if (typeof body.location === "string" && body.location.trim()) {
    try {
      const parsed = JSON.parse(body.location) as Location;
      if (typeof parsed.lat === "number" && typeof parsed.lng === "number") {
        return parsed;
      }
    } catch {
      // fall through to lat/lng fields
    }
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      lat,
      lng,
      address: typeof body.address === "string" ? body.address : undefined,
    };
  }
  return undefined;
}

export const reportsRouter = Router();

reportsRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listPosts());
  } catch (err) {
    next(err);
  }
});

// The current user's own reports (for their dashboard / status tracking).
// Must be declared before "/:id" so it isn't captured as an id.
reportsRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    res.json(await listPostsByAuthor(req.userId!));
  } catch (err) {
    next(err);
  }
});

reportsRouter.get("/:id", async (req, res, next) => {
  try {
    const report = await getPost(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// Create a post together with its media (images/videos) in a single request.
// Auth is optional: anonymous posts are allowed, but if a valid token is
// present the post is linked to that user so they can track it later.
reportsRouter.post(
  "/",
  optionalAuth,
  upload.array("media", 10),
  async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const { title, description, category } = body;

    if (!description || !category) {
      return res
        .status(400)
        .json({ error: "description and category are required" });
    }

    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length > 0 && !isCloudinaryConfigured) {
      return res.status(503).json({
        error:
          "Media upload is not configured. Set CLOUDINARY_* env vars to enable it.",
      });
    }

    const mediaItems: NewMediaItem[] = [];
    for (const file of files) {
      const uploaded = await uploadMedia(file.buffer, file.mimetype);
      mediaItems.push(uploaded);
    }

    const report = await createPost(
      {
        title: title ?? null,
        description,
        category,
        location: parseLocation(body) ?? null,
        authorId: req.userId ?? null,
      },
      mediaItems,
    );

    res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  },
);

reportsRouter.patch("/:id/status", async (req, res, next) => {
  try {
    const { status } = req.body ?? {};
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const report = await updatePostStatus(req.params.id, status);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// Edit a report's own fields — restricted to the report's author.
reportsRouter.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await getPost(id);
    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (existing.author?.id !== req.userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own reports" });
    }

    const body = req.body ?? {};
    const { title, description, category, location } = body;

    if (description !== undefined && !String(description).trim()) {
      return res.status(400).json({ error: "description cannot be empty" });
    }

    let locationValue: Location | null | undefined;
    if (location !== undefined) {
      locationValue =
        location &&
        typeof location.lat === "number" &&
        typeof location.lng === "number"
          ? {
              lat: location.lat,
              lng: location.lng,
              address:
                typeof location.address === "string"
                  ? location.address
                  : undefined,
            }
          : null;
    }

    const updated = await updatePost(id, {
      title,
      description,
      category,
      location: locationValue,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete a report — restricted to the report's author.
reportsRouter.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const existing = await getPost(id);
    if (!existing) {
      return res.status(404).json({ error: "Report not found" });
    }
    if (existing.author?.id !== req.userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own reports" });
    }

    await deletePost(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
