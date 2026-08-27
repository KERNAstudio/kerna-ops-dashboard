"use client";

import { classifyPreview } from "./preview";

// Shared between the Module Workspace and Client Approval Screen — §7's V1 preview matrix
// (image/PDF/web yes, zip/video no) enforced in one place.
export function PreviewLink({ fileUrl, big }: { fileUrl: string | null; big?: boolean }) {
  const { kind, label } = classifyPreview(fileUrl);
  const size = big ? "text-sm" : "text-xs";

  if (kind === "unsupported") {
    return <span className={`${size} text-text-secondary`}>No preview available ({label.toLowerCase()})</span>;
  }

  return (
    <a href={fileUrl ?? "#"} target="_blank" rel="noreferrer" className={`${size} text-accent-primary`}>
      {big ? `Open ${label.toLowerCase()} preview →` : "Preview"}
    </a>
  );
}
