"use client";

import { useActionState } from "react";
import { requestTermination, type TerminationFormState } from "./termination-actions";

const initialState: TerminationFormState = { error: null };

// §2 step 12 Data Control (client-facing half) — whole-project only, see termination-actions.ts.
export function DangerZone({ projectId, hasPendingRequest }: { projectId: string; hasPendingRequest: boolean }) {
  const [state, action, pending] = useActionState(requestTermination, initialState);

  return (
    <div className="mt-5 rounded-[var(--radius-default)] border border-error/40 bg-error/5 p-4">
      <p className="text-sm font-bold text-error">Danger zone</p>
      {hasPendingRequest ? (
        <p className="mt-2 text-xs text-text-secondary">A project deletion request is pending review.</p>
      ) : (
        <form action={action} className="mt-2">
          <input type="hidden" name="project_id" value={projectId} />
          <p className="text-xs text-text-secondary">Permanently delete this project and its data on request.</p>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-8 rounded-lg border border-error px-3 text-xs font-semibold text-error hover:bg-error/10 disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Request full project deletion"}
          </button>
          {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
