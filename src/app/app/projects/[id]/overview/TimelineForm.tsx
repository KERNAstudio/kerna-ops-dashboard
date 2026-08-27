"use client";

import { useActionState, useState } from "react";
import {
  updateTimeline,
  updateHealth,
  approveScope,
  sendForFinalApproval,
  approveFinalDelivery,
  rejectFinalDelivery,
  type OverviewFormState,
} from "./actions";

const initialState: OverviewFormState = { error: null };

export function TimelineForm({
  projectId,
  internalDeadline,
  clientDeadline,
}: {
  projectId: string;
  internalDeadline: string | null;
  clientDeadline: string | null;
}) {
  const [state, action, pending] = useActionState(updateTimeline, initialState);

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <input type="hidden" name="project_id" value={projectId} />
      <label className="text-xs font-medium text-text-secondary">
        Internal deadline
        <input
          name="internal_deadline"
          type="date"
          defaultValue={internalDeadline?.slice(0, 10) ?? ""}
          className="mt-1 block rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
        />
      </label>
      <label className="text-xs font-medium text-text-secondary">
        Client deadline
        <input
          name="client_deadline"
          type="date"
          defaultValue={clientDeadline?.slice(0, 10) ?? ""}
          className="mt-1 block rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save timeline"}
      </button>
      {state.error && <p className="w-full text-xs text-error">{state.error}</p>}
    </form>
  );
}

export function HealthForm({
  projectId,
  healthScoreInternal,
  healthStatusClient,
}: {
  projectId: string;
  healthScoreInternal: number | null;
  healthStatusClient: string | null;
}) {
  const [state, action, pending] = useActionState(updateHealth, initialState);

  return (
    <form
      action={action}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <label className="text-xs font-medium text-text-secondary">
        Internal health score (0-100)
        <input
          name="health_score_internal"
          type="number"
          min="0"
          max="100"
          defaultValue={healthScoreInternal ?? ""}
          className="mt-1 block w-40 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
        />
      </label>
      <label className="text-xs font-medium text-text-secondary">
        Client-facing health
        <select
          name="health_status_client"
          defaultValue={healthStatusClient ?? ""}
          className="mt-1 block w-40 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
        >
          <option value="">—</option>
          <option value="On Track">On Track</option>
          <option value="At Risk">At Risk</option>
          <option value="Delayed">Delayed</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save health"}
      </button>
      {state.error && <p className="w-full text-xs text-error">{state.error}</p>}
    </form>
  );
}

export function ScopeApprovalButton({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(approveScope, initialState);

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="project_id" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-[10px] bg-accent-primary px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve Scope"}
      </button>
      {state.error && <p className="mt-2 text-xs text-error">{state.error}</p>}
    </form>
  );
}

export function SendFinalApprovalButton({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(sendForFinalApproval, initialState);

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="project_id" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send for Final Approval"}
      </button>
      {state.error && <p className="mt-2 text-xs text-error">{state.error}</p>}
    </form>
  );
}

export function FinalDeliveryReview({ projectId }: { projectId: string }) {
  const [approveState, approveAction, approvePending] = useActionState(approveFinalDelivery, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectFinalDelivery, initialState);
  const [showReject, setShowReject] = useState(false);

  return (
    <div className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <p className="text-sm font-bold">Final delivery is ready for your review</p>
      <div className="mt-3 flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="project_id" value={projectId} />
          <button
            type="submit"
            disabled={approvePending}
            className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {approvePending ? "Approving…" : "Approve"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setShowReject((s) => !s)}
          className="h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold hover:bg-bg-elevated"
        >
          Request Changes
        </button>
      </div>

      {showReject && (
        <form action={rejectAction} className="mt-3">
          <input type="hidden" name="project_id" value={projectId} />
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="What needs to change?"
            className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
          <button
            type="submit"
            disabled={rejectPending}
            className="mt-2 h-8 rounded-lg border border-border-default px-3 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
          >
            {rejectPending ? "Sending…" : "Send feedback"}
          </button>
        </form>
      )}

      {(approveState.error || rejectState.error) && (
        <p className="mt-2 text-xs text-error">{approveState.error || rejectState.error}</p>
      )}
    </div>
  );
}
