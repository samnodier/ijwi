import { v2 as cloudinary } from "cloudinary";
import exifr from "exifr";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

export interface UploadedMedia {
  type: "image" | "video";
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  // Extracted from the file's EXIF metadata (images only).
  latitude?: number;
  longitude?: number;
  capturedAt?: Date;
  metadata?: Record<string, unknown>;
}

// Best-effort EXIF extraction: GPS coordinates + original capture time.
async function extractExif(buffer: Buffer): Promise<{
  latitude?: number;
  longitude?: number;
  capturedAt?: Date;
  raw?: Record<string, unknown>;
}> {
  try {
    const data = (await exifr.parse(buffer, {
      gps: true,
      pick: ["latitude", "longitude", "DateTimeOriginal", "CreateDate"],
    })) as Record<string, unknown> | undefined;

    if (!data) return {};

    const latitude =
      typeof data.latitude === "number" ? data.latitude : undefined;
    const longitude =
      typeof data.longitude === "number" ? data.longitude : undefined;
    const captured = (data.DateTimeOriginal ?? data.CreateDate) as
      | Date
      | undefined;

    return {
      latitude,
      longitude,
      capturedAt: captured instanceof Date ? captured : undefined,
      raw: data,
    };
  } catch {
    return {};
  }
}

// Best-effort deletion of an asset from Cloudinary. Never throws so it can't
// block a DB delete; failures are logged instead.
export async function deleteMedia(
  publicId: string,
  type: "image" | "video" = "image",
): Promise<void> {
  if (!isCloudinaryConfigured || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  } catch (err) {
    console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
  }
}

export async function uploadMedia(
  buffer: Buffer,
  mimetype: string,
): Promise<UploadedMedia> {
  const isVideo = mimetype.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";

  const exif = isVideo ? {} : await extractExif(buffer);

  const result = await new Promise<Record<string, any>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: "ijwi" },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          return reject(error ?? new Error("Cloudinary upload failed"));
        }
        resolve(uploadResult);
      },
    );
    stream.end(buffer);
  });

  return {
    type: isVideo ? "video" : "image",
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    durationSeconds: result.duration,
    latitude: exif.latitude,
    longitude: exif.longitude,
    capturedAt: exif.capturedAt,
    metadata: exif.raw,
  };
}
