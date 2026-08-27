"use client";

import { useActionState, useMemo, useState } from "react";
import { createQuotation, type QuotationFormState } from "../actions";

const initialState: QuotationFormState = { error: null };

type Row = { title: string; description: string; unitPrice: string; quantity: string };
const emptyRow: Row = { title: "", description: "", unitPrice: "", quantity: "1" };

export function QuotationBuilder({
  leads,
  defaultAdvancePercent,
}: {
  leads: { id: string; company_name: string; contact_name: string }[];
  defaultAdvancePercent: number;
}) {
  const [state, formAction, pending] = useActionState(createQuotation, initialState);
  const [rows, setRows] = useState<Row[]>([{ ...emptyRow }]);
  const [discount, setDiscount] = useState("0");
  const [advancePercent, setAdvancePercent] = useState(String(defaultAdvancePercent));

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0), 0),
    [rows]
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const advancePct = Math.min(100, Math.max(0, Number(advancePercent) || 0));
  const advanceAmount = (total * advancePct) / 100;
  const finalAmount = total - advanceAmount;

  function updateRow(i: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-bold tracking-tight">New Quotation</h1>

      <form action={formAction} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
        <label className="block text-xs font-medium text-text-secondary">
          Lead
          <select
            name="lead_id"
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          >
            <option value="">Select a lead…</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.company_name} — {l.contact_name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Template / package
          <input
            name="template_type"
            placeholder="e.g. Website, Branding, Custom"
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">Line items</span>
            <button
              type="button"
              onClick={() => setRows((prev) => [...prev, { ...emptyRow }])}
              className="text-xs font-semibold text-accent-primary"
            >
              + Add line item
            </button>
          </div>

          {rows.map((row, i) => (
            <div key={i} className="mt-2 rounded-lg border border-border-default bg-bg-elevated p-3">
              <div className="flex gap-2">
                <input
                  name="item_title"
                  value={row.title}
                  onChange={(e) => updateRow(i, { title: e.target.value })}
                  placeholder="Title"
                  className="flex-1 rounded-lg border border-border-default bg-bg-card px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                    className="px-2 text-xs text-text-secondary hover:text-error"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                name="item_description"
                value={row.description}
                onChange={(e) => updateRow(i, { description: e.target.value })}
                placeholder="Description (optional)"
                className="mt-2 w-full rounded-lg border border-border-default bg-bg-card px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
              />
              <div className="mt-2 flex gap-2">
                <input
                  name="item_unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(e) => updateRow(i, { unitPrice: e.target.value })}
                  placeholder="Unit price"
                  className="w-1/2 rounded-lg border border-border-default bg-bg-card px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
                />
                <input
                  name="item_quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={row.quantity}
                  onChange={(e) => updateRow(i, { quantity: e.target.value })}
                  placeholder="Qty"
                  className="w-1/2 rounded-lg border border-border-default bg-bg-card px-2.5 py-1.5 text-sm outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          ))}
        </div>

        <label className="mt-4 block text-xs font-medium text-text-secondary">
          Discount
          <input
            name="discount"
            type="number"
            min="0"
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>

        <label className="mt-4 block text-xs font-medium text-text-secondary">
          Advance %
          <div className="mt-1 flex items-center gap-2">
            <input
              name="advance_percent"
              type="number"
              min="0"
              max="100"
              step="1"
              value={advancePercent}
              onChange={(e) => setAdvancePercent(e.target.value)}
              className="w-24 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
            <span className="text-text-secondary">/ {(100 - advancePct).toFixed(0)}% final — auto-calculated, never entered directly</span>
          </div>
        </label>

        <div className="mt-4 space-y-1 border-t border-border-default pt-4 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="font-data">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Discount</span>
            <span className="font-data">-{(Number(discount) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="font-data">{total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Advance due ({advancePct.toFixed(0)}%)</span>
            <span className="font-data">{advanceAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Final due ({(100 - advancePct).toFixed(0)}%)</span>
            <span className="font-data">{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-10 rounded-[10px] bg-accent-primary px-5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save draft"}
        </button>
      </form>
    </div>
  );
}
