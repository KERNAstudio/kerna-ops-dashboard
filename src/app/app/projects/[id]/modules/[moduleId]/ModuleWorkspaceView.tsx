"use client";

import { useActionState } from "react";
import Link from "next/link";
import { uploadVersion, reopenApproval, type ModuleActionState } from "./actions";
import type { ModuleDetail } from "@/lib/modules/access";
import { PreviewLink } from "@/lib/modules/PreviewLink";

const initialState: ModuleActionState = { error: null };

const APPROVAL_BADGE: Record<string, string> = {
  pending: "bg-bg-elevated text-text-secondary border border-border-default",
  approved: "bg-success/10 text-success",
  changes_requested: "bg-warning/10 text-warning",
  withdrawn: "bg-error/10 text-error",
};

export function ModuleWorkspaceView({
  projectId,
  detail,
  canEdit,
  isPoc,
}: {
  projectId: string;
  detail: ModuleDetail;
  canEdit: boolean;
  isPoc: boolean;
}) {
  const { module: mod, versions, latestApproval, assignees } = detail;
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadVersion, initialState);
  const [reopenState, reopenAction, reopenPending] = useActionState(reopenApproval, initialState);

  const locked = latestApproval?.status === "approved";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{mod.module_type}</h2>
          <p className="text-xs text-text-secondary">
            {assignees.length ? assignees.map((a) => a.name).join(", ") : "Unassigned"} · {mod.status}
          </p>
        </div>
        {latestApproval && (
          <span
            className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${
              APPROVAL_BADGE[latestApproval.status] ?? APPROVAL_BADGE.pending
            }`}
          >
            {latestApproval.status}
          </span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Version", "Date", "Notes", ""].map((h) => (
                <th
                  key={h}
                  className="border-b border-border-default px-4 py-2.5 text-left font-data text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id} className="border-b border-border-default last:border-0">
                <td className="px-4 py-3 font-semibold">v{v.version_number}</td>
                <td className="px-4 py-3 text-text-secondary">{new Date(v.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-text-secondary">{v.notes ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <PreviewLink fileUrl={v.file_url} />
                </td>
              </tr>
            ))}
            {versions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-text-secondary">
                  No versions uploaded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>

      {locked && isPoc && (
        <form action={reopenAction} className="mt-4 rounded-[var(--radius-default)] border border-error/40 bg-error/5 p-4">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="module_id" value={mod.id} />
          <p className="text-xs font-semibold text-error">This version is approved and locked.</p>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            Reason to reopen
            <input
              name="reason"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          {reopenState.error && <p className="mt-2 text-xs text-error">{reopenState.error}</p>}
          <button
            type="submit"
            disabled={reopenPending}
            className="mt-3 h-8 rounded-lg border border-error px-3 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50"
          >
            {reopenPending ? "Reopening…" : "Reopen for edits"}
          </button>
        </form>
      )}

      {canEdit && !locked && (
        <form action={uploadAction} className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="module_id" value={mod.id} />
          <p className="text-sm font-bold">Upload new version</p>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            File URL
            <input
              name="file_url"
              placeholder="https://…"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            Notes
            <input
              name="notes"
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          {uploadState.error && <p className="mt-2 text-xs text-error">{uploadState.error}</p>}
          <button
            type="submit"
            disabled={uploadPending}
            className="mt-3 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {uploadPending ? "Uploading…" : "Upload version"}
          </button>
        </form>
      )}

      {detail.latestVersion && (
        <Link
          href={`/app/projects/${projectId}/review/${mod.id}/${detail.latestVersion.id}`}
          className="mt-4 inline-block text-xs text-accent-primary"
        >
          View client approval screen →
        </Link>
      )}
    </div>
  );
}
