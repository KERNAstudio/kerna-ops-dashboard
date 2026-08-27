import { describe, it, expect } from "vitest";
import { classifyPreview } from "./preview";

// §7: "V1 preview support: image ✓, PDF ✓, web preview ✓ — zip ✕, video ✕."
describe("classifyPreview", () => {
  it("classifies images", () => {
    expect(classifyPreview("proj/vault/1-photo.png").kind).toBe("image");
    expect(classifyPreview("proj/vault/1-photo.JPG").kind).toBe("image");
  });

  it("classifies PDFs", () => {
    expect(classifyPreview("proj/vault/1-doc.pdf").kind).toBe("pdf");
  });

  it("rejects zip and video per the V1 matrix", () => {
    expect(classifyPreview("proj/vault/1-archive.zip").kind).toBe("unsupported");
    expect(classifyPreview("proj/vault/1-clip.mp4").kind).toBe("unsupported");
  });

  it("falls back to web preview for anything else", () => {
    expect(classifyPreview("proj/vault/1-page.html").kind).toBe("web");
  });

  it("strips query strings before classifying", () => {
    expect(classifyPreview("https://x.test/file.png?token=abc").kind).toBe("image");
  });

  it("treats a missing file as unsupported", () => {
    expect(classifyPreview(null).kind).toBe("unsupported");
  });
});
