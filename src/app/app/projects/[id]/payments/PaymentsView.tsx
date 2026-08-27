"use client";

import { useActionState } from "react";
import { logPayment, markPaymentReceived, type PaymentFormState } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: PaymentFormState = { error: null };

export function PaymentsView({
  projectId,
  payments,
  canEdit,
}: {
  projectId: string;
  payments: Tables<"payments">[];
  canEdit: boolean;
}) {
  const [logState, logAction, logPending] = useActionState(logPayment, initialState);

  const receivedTotal = payments.filter((p) => p.status === "received").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Type", "Amount", "Status", "Date", ""].map((h) => (
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
            {payments.map((p) => (
              <PaymentRow key={p.id} payment={p} projectId={projectId} canEdit={canEdit} />
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No payments logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
        <div className="flex justify-between border-t border-border-default p-4 text-sm font-bold">
          <span>Received total</span>
          <span className="font-data">{receivedTotal.toFixed(2)}</span>
        </div>
      </div>

      {canEdit && (
        <form
          action={logAction}
          className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6"
        >
          <input type="hidden" name="project_id" value={projectId} />
          <h2 className="text-sm font-bold">Log a payment</h2>

          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Type
            <input
              name="payment_type"
              placeholder="advance / final"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Amount
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-3 flex items-center gap-2 text-xs text-text-secondary">
            <input name="received" type="checkbox" />
            Already received
          </label>

          {logState.error && <p className="mt-3 text-xs text-error">{logState.error}</p>}

          <button
            type="submit"
            disabled={logPending}
            className="mt-4 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {logPending ? "Logging…" : "Log payment"}
          </button>
        </form>
      )}
    </div>
  );
}

function PaymentRow({
  payment,
  projectId,
  canEdit,
}: {
  payment: Tables<"payments">;
  projectId: string;
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(markPaymentReceived, initialState);

  return (
    <tr className="border-b border-border-default last:border-0">
      <td className="px-4 py-3 capitalize">{payment.payment_type}</td>
      <td className="px-4 py-3 font-data">{payment.amount.toFixed(2)}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${
            payment.status === "received"
              ? "bg-success/10 text-success"
              : "bg-bg-elevated text-text-secondary border border-border-default"
          }`}
        >
          {payment.status}
        </span>
      </td>
      <td className="px-4 py-3 text-text-secondary">{payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : "—"}</td>
      <td className="px-4 py-3 text-right">
        {canEdit && payment.status === "pending" && (
          <form action={action}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="payment_id" value={payment.id} />
            <button type="submit" disabled={pending} className="text-xs text-accent-primary hover:text-accent-hover disabled:opacity-50">
              {pending ? "…" : "Mark Received"}
            </button>
          </form>
        )}
        {state.error && <p className="text-xs text-error">{state.error}</p>}
      </td>
    </tr>
  );
}
