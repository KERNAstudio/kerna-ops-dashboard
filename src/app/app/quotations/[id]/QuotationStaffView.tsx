"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendQuotation, archiveQuotation, type QuotationFormState, type SendResult } from "../actions";
import { QUOTATION_STATUS_BADGE, type QuotationStatus } from "@/lib/quotations/constants";
import type { QuotationDetail } from "@/lib/quotations/access";

const initialSend: SendResult = { error: null };
const initialForm: QuotationFormState = { error: null };

export function QuotationStaffView({ detail, pocName }: { detail: QuotationDetail; pocName: string }) {
  const { quotation, lead, latestVersion, lineItems } = detail;
  const [sendState, sendAction, sendPending] = useActionState(sendQuotation, initialSend);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveQuotation, initialForm);

  const badge = QUOTATION_STATUS_BADGE[quotation.status as QuotationStatus] ?? QUOTATION_STATUS_BADGE.draft;

  return (
    <div className="max-w-2xl">
      <Link href="/app/quotations" className="text-xs text-text-secondary hover:text-text-primary">
        ← Back to quotations
      </Link>
      <div className="mt-2 flex items-center gap-3">
        <h1 className="text-[26px] font-bold tracking-tight">{lead.company_name}</h1>
        <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${badge}`}>
          {quotation.status}
        </span>
      </div>
      <p className="text-[13px] text-text-secondary">
        {lead.contact_name} · POC: {pocName} · v{latestVersion?.version_number ?? 1}
      </p>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Item", "Qty", "Unit price", "Total"].map((h) => (
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
                <td className="px-4 py-3 font-data">{li.unit_price.toFixed(2)}</td>
                <td className="px-4 py-3 font-data">{li.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
</div>
        <div className="space-y-1 border-t border-border-default p-4 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-data">{(latestVersion?.subtotal ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Discount</span>
            <span className="font-data">-{(latestVersion?.discount ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="font-data">{(latestVersion?.total ?? 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {sendState.credentials && (
        <div className="mt-4 rounded-[var(--radius-default)] border border-accent-primary bg-accent-soft p-4 text-sm">
          <p className="font-semibold text-accent-primary">Client login created</p>
          <p className="mt-1">
            Email: <span className="font-data">{sendState.credentials.email}</span>
          </p>
          <p>
            Temp password: <span className="font-data">{sendState.credentials.password}</span>
          </p>
          <p className="mt-1 text-xs text-text-secondary">
            Shown once — share it with the client now. It isn&apos;t stored anywhere retrievable.
          </p>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {quotation.status === "draft" && (
          <form action={sendAction}>
            <input type="hidden" name="quotation_id" value={quotation.id} />
            <button
              type="submit"
              disabled={sendPending}
              className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {sendPending ? "Sending…" : "Send Quotation"}
            </button>
          </form>
        )}
        {quotation.status !== "draft" && quotation.status !== "archived" && (
          <Link
            href={`/app/quotations/${quotation.id}/revise`}
            className="inline-flex h-9 items-center rounded-[10px] border border-border-default px-4 text-xs font-semibold hover:bg-bg-elevated"
          >
            Revise
          </Link>
        )}
        {quotation.status !== "archived" && (
          <form action={archiveAction}>
            <input type="hidden" name="quotation_id" value={quotation.id} />
            <button
              type="submit"
              disabled={archivePending}
              className="h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold text-text-secondary hover:bg-bg-elevated disabled:opacity-50"
            >
              Archive
            </button>
          </form>
        )}
      </div>
      {(sendState.error || archiveState.error) && (
        <p className="mt-3 text-xs text-error">{sendState.error || archiveState.error}</p>
      )}
    </div>
  );
}
