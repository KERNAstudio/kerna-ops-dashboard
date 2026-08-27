"use client";

import { useActionState, useEffect } from "react";
import { classifyPreview } from "./preview";
import { getPreviewUrl, type PreviewUrlState } from "./preview-actions";

const initialState: PreviewUrlState = { error: null };

// Shared between the Module Workspace, Client Approval Screen, and Vault — §7's V1 preview
// matrix (image/PDF/web yes, zip/video no) enforced in one place. Files live in a private
// Storage bucket, so this resolves a short-lived signed URL on click rather than linking a
// static href (see src/lib/storage.ts).
export function PreviewLink({ projectId, fileUrl, big }: { projectId: string; fileUrl: string | null; big?: boolean }) {
  const [state, action, pending] = useActionState(getPreviewUrl, initialState);
  const { kind, label } = classifyPreview(fileUrl);
  const size = big ? "text-sm" : "text-xs";

  useEffect(() => {
    if (state.url) window.open(state.url, "_blank", "noopener,noreferrer");
  }, [state.url]);

  if (kind === "unsupported") {
    return <span className={`${size} text-text-secondary`}>No preview available ({label.toLowerCase()})</span>;
  }
  if (!fileUrl) return <span className={`${size} text-text-secondary`}>No file</span>;

  return (
    <form action={action} className="inline">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="file_path" value={fileUrl} />
      <button type="submit" disabled={pending} className={`${size} text-accent-primary disabled:opacity-50`}>
        {pending ? "Loading…" : big ? `Open ${label.toLowerCase()} preview →` : "Preview"}
      </button>
      {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
    </form>
  );
}
