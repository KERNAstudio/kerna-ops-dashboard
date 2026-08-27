"use client";

import { useActionState, useEffect } from "react";
import { addResource, logDownload, type VaultFormState } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";
import { PreviewLink } from "@/lib/modules/PreviewLink";

const initialState: VaultFormState = { error: null };

export function VaultView({
  projectId,
  resources,
  canManage,
  isClient,
  fullyPaid,
}: {
  projectId: string;
  resources: Tables<"resources">[];
  canManage: boolean;
  isClient: boolean;
  fullyPaid: boolean;
}) {
  const [addState, addAction, addPending] = useActionState(addResource, initialState);

  return (
    <div className="max-w-2xl space-y-4">
      {!fullyPaid && isClient && (
        <div className="rounded-[var(--radius-default)] border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          Downloads unlock after final payment is received. You can still preview everything below.
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["File", "Date", ""].map((h) => (
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
            {resources.map((r) => (
              <ResourceRow key={r.id} resource={r} projectId={projectId} fullyPaid={fullyPaid} />
            ))}
            {resources.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                  No files yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>

      {canManage && (
        <form action={addAction} className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
          <input type="hidden" name="project_id" value={projectId} />
          <p className="text-sm font-bold">Add a file</p>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            File
            <input
              name="file"
              type="file"
              required
              className="mt-1 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border-default file:bg-bg-elevated file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-primary"
            />
          </label>
          <label className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
            <input name="downloadable" type="checkbox" />
            Downloadable once fully paid
          </label>
          {addState.error && <p className="mt-2 text-xs text-error">{addState.error}</p>}
          <button
            type="submit"
            disabled={addPending}
            className="mt-3 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {addPending ? "Adding…" : "Add file"}
          </button>
        </form>
      )}
    </div>
  );
}

function ResourceRow({
  resource,
  projectId,
  fullyPaid,
}: {
  resource: Tables<"resources">;
  projectId: string;
  fullyPaid: boolean;
}) {
  const [state, action, pending] = useActionState(logDownload, initialState);
  const canDownload = resource.downloadable && fullyPaid;

  // The action just records the audit-logged download and hands back the URL to open —
  // The action resolves a short-lived signed URL for the private Storage object and hands
  // it back here to open — see src/lib/storage.ts.
  useEffect(() => {
    if (state.fileUrl) window.open(state.fileUrl, "_blank", "noopener,noreferrer");
  }, [state.fileUrl]);

  const displayName = (resource.file_url.split("/").pop() ?? resource.file_url).replace(/^\d+-/, "");

  return (
    <tr className="border-b border-border-default last:border-0">
      <td className="px-4 py-3 font-semibold">{displayName}</td>
      <td className="px-4 py-3 text-text-secondary">{new Date(resource.created_at).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-right">
        <span className="mr-3">
          <PreviewLink projectId={projectId} fileUrl={resource.file_url} />
        </span>
        {canDownload ? (
          <form action={action} className="inline">
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="resource_id" value={resource.id} />
            <button type="submit" disabled={pending} className="text-xs text-text-primary hover:text-accent-primary disabled:opacity-50">
              {pending ? "…" : "Download"}
            </button>
          </form>
        ) : (
          <span className="text-xs text-text-secondary" title="Available after final payment">
            Download
          </span>
        )}
        {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
      </td>
    </tr>
  );
}
