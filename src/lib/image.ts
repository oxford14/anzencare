export type CompressOptions = {
  /** Longest edge of the output in pixels. */
  maxEdge?: number;
  /** JPEG quality between 0 and 1. */
  quality?: number;
};

/**
 * Downscales and re-encodes an image to JPEG on the client to shrink upload
 * size while preserving visual quality. EXIF orientation is respected via
 * createImageBitmap. Falls back to the original file if it isn't an image,
 * the browser lacks canvas support, or compression wouldn't help.
 */
export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.85 }: CompressOptions = {}
): Promise<File> {
  if (typeof window === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // Animated GIFs / SVGs shouldn't be flattened to a single JPEG frame.
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );

    if (!blob || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, "") || "upload";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
