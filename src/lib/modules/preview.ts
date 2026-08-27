// §7 Module Workspace: "V1 preview support: image ✓, PDF ✓, web preview ✓ — zip ✕, video ✕."
export type PreviewKind = "image" | "pdf" | "web" | "unsupported";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
const UNSUPPORTED_EXT = new Set(["zip", "mp4", "mov", "avi", "webm", "mkv"]);

export function classifyPreview(fileUrl: string | null): { kind: PreviewKind; label: string } {
  if (!fileUrl) return { kind: "unsupported", label: "No file" };

  const cleanUrl = fileUrl.split(/[?#]/)[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase() ?? "";

  if (IMAGE_EXT.has(ext)) return { kind: "image", label: "Image" };
  if (ext === "pdf") return { kind: "pdf", label: "PDF" };
  if (UNSUPPORTED_EXT.has(ext)) return { kind: "unsupported", label: ext === "zip" ? "Zip archive" : "Video" };
  return { kind: "web", label: "Web preview" };
}
