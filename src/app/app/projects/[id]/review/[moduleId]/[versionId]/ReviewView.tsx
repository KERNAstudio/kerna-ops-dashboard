"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { approveVersion, requestChanges, type ReviewFormState } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";
import { PreviewLink } from "@/lib/modules/PreviewLink";

const initialState: ReviewFormState = { error: null };

export function ReviewView({
  projectId,
  moduleId,
  moduleName,
  version,
  approval,
  history,
  isClient,
}: {
  projectId: string;
  moduleId: string;
  moduleName: string;
  version: Tables<"module_versions">;
  approval: Tables<"approvals"> | null;
  history: { id: string; version_number: number; created_at: string }[];
  isClient: boolean;
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveVersion, initialState);
  const [changesState, changesAction, changesPending] = useActionState(requestChanges, initialState);
  const [showFeedback, setShowFeedback] = useState(false);

  const pending = approval?.status === "pending";

  return (
    <div className="max-w-xl">
      <h1 className="text-[26px] font-bold tracking-tight">
        {moduleName} — v{version.version_number}
      </h1>

      <div className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
        <PreviewLink projectId={projectId} fileUrl={version.file_url} big />
        {version.notes && <p className="mt-2 text-xs text-text-secondary">{version.notes}</p>}
      </div>

      {isClient && pending && (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6 text-center">
          <p className="text-sm font-bold">Review this deliverable</p>
          <div className="mt-4 flex justify-center gap-2">
            <form action={approveAction}>
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="approval_id" value={approval!.id} />
              <button
                type="submit"
                disabled={approvePending}
                className="h-10 rounded-[10px] bg-accent-primary px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {approvePending ? "Approving…" : "Approve"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setShowFeedback((s) => !s)}
              className="h-10 rounded-[10px] border border-border-default px-5 text-sm font-semibold hover:bg-bg-elevated"
            >
              Request Changes
            </button>
          </div>

          {showFeedback && (
            <form action={changesAction} className="mt-4 text-left">
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="approval_id" value={approval!.id} />
              <textarea
                name="feedback"
                required
                placeholder="What needs to change?"
                rows={3}
                className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
              />
              <button
                type="submit"
                disabled={changesPending}
                className="mt-2 h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
              >
                {changesPending ? "Sending…" : "Send feedback"}
              </button>
            </form>
          )}

          {(approveState.error || changesState.error) && (
            <p className="mt-3 text-xs text-error">{approveState.error || changesState.error}</p>
          )}
        </div>
      )}

      {!pending && approval && (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-elevated p-4 text-sm text-text-secondary">
          Status: <span className="font-semibold text-text-primary">{approval.status}</span>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-medium text-text-secondary">Version history</p>
        <div className="mt-1.5 flex flex-col gap-1">
          {history.map((h) => (
            <Link
              key={h.id}
              href={`/app/projects/${projectId}/review/${moduleId}/${h.id}`}
              className={`text-xs ${h.id === version.id ? "font-semibold text-accent-primary" : "text-text-secondary hover:text-text-primary"}`}
            >
              v{h.version_number} — {new Date(h.created_at).toLocaleDateString()}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
