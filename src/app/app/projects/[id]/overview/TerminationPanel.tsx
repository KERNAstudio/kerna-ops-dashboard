"use client";

import { useActionState } from "react";
import { resolveTermination, type TerminationFormState } from "./termination-actions";

const initialState: TerminationFormState = { error: null };

// Staff side of §2 step 12 Data Control — POC/Founder reviews the client's deletion request.
export function TerminationPanel({ projectId, requestId }: { projectId: string; requestId: string }) {
  const [state, action, pending] = useActionState(resolveTermination, initialState);

  return (
    <div className="mt-4 rounded-[var(--radius-default)] border border-error/40 bg-error/5 p-4">
      <p className="text-sm font-semibold text-error">Client requested full project deletion</p>
      <form action={action} className="mt-2 flex gap-2">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="request_id" value={requestId} />
        <button
          type="submit"
          name="status"
          value="approved"
          disabled={pending}
          className="h-8 rounded-lg border border-error px-3 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          type="submit"
          name="status"
          value="rejected"
          disabled={pending}
          className="h-8 rounded-lg border border-border-default px-3 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
        >
          Reject
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
    </div>
  );
}
