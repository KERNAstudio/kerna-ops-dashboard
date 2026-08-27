"use client";

import { useActionState } from "react";
import { approveQuotation, type ApproveFormState } from "../client-actions";
import type { QuotationDetail } from "@/lib/quotations/access";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: ApproveFormState = { error: null };

export function QuotationClientView({
  detail,
  client,
}: {
  detail: QuotationDetail;
  client: Tables<"clients">;
}) {
  const { quotation, lineItems, latestVersion } = detail;
  const [state, formAction, pending] = useActionState(approveQuotation, initialState);

  return (
    <div className="max-w-xl">
      <h1 className="text-[26px] font-bold tracking-tight">Your Quotation</h1>
      <p className="text-[13px] text-text-secondary">from KERNA</p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Item", "Qty", "Total"].map((h) => (
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
            {lineItems.map((li) => (
              <tr key={li.id} className="border-b border-border-default last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold">{li.title}</div>
                  {li.description && <div className="text-xs text-text-secondary">{li.description}</div>}
                </td>
                <td className="px-4 py-3 font-data">{li.quantity}</td>
                <td className="px-4 py-3 font-data">{li.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
        <div className="flex justify-between border-t border-border-default p-4 text-base font-bold">
          <span>Total</span>
          <span className="font-data">{(latestVersion?.total ?? 0).toFixed(2)}</span>
        </div>
      </div>

      {quotation.status === "approved" ? (
        <div className="mt-6 rounded-[var(--radius-default)] border border-success bg-success/10 p-4 text-sm text-success">
          Approved — thanks! We&apos;ll be in touch about next steps.
        </div>
      ) : quotation.status !== "sent" ? (
        <div className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-elevated p-4 text-sm text-text-secondary">
          This quotation isn&apos;t ready for approval yet.
        </div>
      ) : (
        <form action={formAction} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
          <input type="hidden" name="quotation_id" value={quotation.id} />
          <h2 className="text-sm font-bold">Confirm your details</h2>

          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Contact name
            <input
              name="primary_contact_name"
              defaultValue={client.primary_contact_name}
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Company
            <input
              value={client.company_name}
              disabled
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary outline-none"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Phone
            <input
              name="primary_phone"
              defaultValue={client.primary_phone ?? ""}
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-3 block text-xs font-medium text-text-secondary">
            Address
            <input
              name="address"
              defaultValue={client.address ?? ""}
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>

          <label className="mt-4 flex items-start gap-2 text-xs text-text-secondary">
            <input name="agree" type="checkbox" required className="mt-0.5" />
            I confirm my details are correct and agree to proceed with this quotation.
          </label>

          {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 h-10 rounded-[10px] bg-accent-primary px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Approve Quotation"}
          </button>
        </form>
      )}
    </div>
  );
}
