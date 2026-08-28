"use client";

import { useActionState } from "react";
import { saveSubscription, setSubscriptionStatus, BILLING_CYCLES, type SubscriptionFormState } from "./subscription-actions";

const initialState: SubscriptionFormState = { error: null };

type Subscription = {
  billing_cycle: string;
  next_due_date: string | null;
  grace_period_days: number | null;
  status: string;
} | null;

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  cancelled: "bg-bg-elevated text-text-secondary border border-border-default",
};

export function SubscriptionPanel({
  projectId,
  subscription,
  canManage,
}: {
  projectId: string;
  subscription: Subscription;
  canManage: boolean;
}) {
  const [saveState, saveAction, savePending] = useActionState(saveSubscription, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setSubscriptionStatus, initialState);

  if (!subscription && !canManage) return null;

  return (
    <div className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold">Recurring billing</p>
        {subscription && (
          <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${STATUS_BADGE[subscription.status] ?? STATUS_BADGE.active}`}>
            {subscription.status}
          </span>
        )}
      </div>

      {subscription && (
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-text-secondary">
          <span>
            Cycle: <span className="text-text-primary capitalize">{subscription.billing_cycle}</span>
          </span>
          <span>
            Next due:{" "}
            <span className="text-text-primary font-data">
              {subscription.next_due_date ? new Date(subscription.next_due_date).toLocaleDateString() : "—"}
            </span>
          </span>
          <span>
            Grace: <span className="text-text-primary font-data">{subscription.grace_period_days ?? 0}d</span>
          </span>
        </div>
      )}

      {canManage && (
        <>
          <form action={saveAction} className="mt-3 flex flex-wrap items-end gap-2 border-t border-border-default pt-3">
            <input type="hidden" name="project_id" value={projectId} />
            <label className="text-xs font-medium text-text-secondary">
              Cycle
              <select
                name="billing_cycle"
                defaultValue={subscription?.billing_cycle ?? "monthly"}
                className="mt-1 block rounded-lg border border-border-default bg-bg-elevated px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
              >
                {BILLING_CYCLES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-text-secondary">
              Next due date
              <input
                name="next_due_date"
                type="date"
                defaultValue={subscription?.next_due_date?.slice(0, 10) ?? ""}
                required
                className="mt-1 block rounded-lg border border-border-default bg-bg-elevated px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
              />
            </label>
            <label className="text-xs font-medium text-text-secondary">
              Grace (days)
              <input
                name="grace_period_days"
                type="number"
                min="0"
                defaultValue={subscription?.grace_period_days ?? 7}
                className="mt-1 block w-24 rounded-lg border border-border-default bg-bg-elevated px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
              />
            </label>
            <button
              type="submit"
              disabled={savePending}
              className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {savePending ? "Saving…" : subscription ? "Update" : "Start recurring billing"}
            </button>
          </form>
          {saveState.error && <p className="mt-1 text-xs text-error">{saveState.error}</p>}

          {subscription && subscription.status !== "cancelled" && (
            <div className="mt-2 flex gap-3">
              <form action={statusAction}>
                <input type="hidden" name="project_id" value={projectId} />
                <input type="hidden" name="status" value={subscription.status === "active" ? "paused" : "active"} />
                <button type="submit" disabled={statusPending} className="text-xs text-accent-primary hover:text-accent-hover disabled:opacity-50">
                  {subscription.status === "active" ? "Pause" : "Reactivate"}
                </button>
              </form>
              <CancelButton projectId={projectId} />
            </div>
          )}
          {statusState.error && <p className="mt-1 text-xs text-error">{statusState.error}</p>}
        </>
      )}
    </div>
  );
}

function CancelButton({ projectId }: { projectId: string }) {
  const [, action, pending] = useActionState(setSubscriptionStatus, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="status" value="cancelled" />
      <button type="submit" disabled={pending} className="text-xs text-error hover:opacity-80 disabled:opacity-50">
        Cancel
      </button>
    </form>
  );
}
