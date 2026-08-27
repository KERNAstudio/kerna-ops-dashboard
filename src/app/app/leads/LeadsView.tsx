"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createLead, type LeadFormState } from "./actions";
import { LEAD_STATUSES, LEAD_STATUS_BADGE, type LeadStatus } from "@/lib/leads/constants";

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  updated_at: string;
  assigned_user: { name: string } | null;
  creator: { name: string } | null;
};

const initialState: LeadFormState = { error: null };

function StatusBadge({ status }: { status: string }) {
  const cls = LEAD_STATUS_BADGE[status as LeadStatus] ?? LEAD_STATUS_BADGE.New;
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${cls}`}>
      {status}
    </span>
  );
}

export function LeadsView({ leads, staff }: { leads: Lead[]; staff: { id: string; name: string }[] }) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.company_name.toLowerCase().includes(q) ||
        l.contact_name.toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q)
    );
  }, [leads, search]);

  return (
    <div className="max-w-[1180px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Lead Management</h1>
          <p className="text-[13px] text-text-secondary">{leads.length} leads in pipeline</p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/app/leads/import"
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] border border-border-default px-4 text-[13.5px] font-semibold text-text-primary hover:bg-bg-elevated"
          >
            Import Leads
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] bg-accent-primary px-4 text-[13.5px] font-semibold text-white hover:bg-accent-hover"
          >
            + New Lead
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-4 py-3">
          <div className="flex rounded-[9px] border border-border-default bg-bg-elevated p-0.5">
            <button
              onClick={() => setView("table")}
              className={`rounded-[7px] px-3 py-1.5 text-xs font-semibold ${view === "table" ? "bg-bg-card text-accent-primary" : "text-text-secondary"}`}
            >
              Table
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`rounded-[7px] px-3 py-1.5 text-xs font-semibold ${view === "kanban" ? "bg-bg-card text-accent-primary" : "text-text-secondary"}`}
            >
              Kanban
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads…"
            className="w-[170px] rounded-lg border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs text-text-secondary outline-none focus:border-accent-primary"
          />
        </div>

        {view === "table" ? (
          <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                {["Company", "Contact", "Phone", "Status", "Last Updated", ""].map((h) => (
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
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-border-default last:border-0 hover:bg-bg-elevated">
                  <td className="px-4 py-3 font-semibold">{lead.company_name}</td>
                  <td className="px-4 py-3">{lead.contact_name}</td>
                  <td className="px-4 py-3 text-text-secondary">{lead.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(lead.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/app/leads/${lead.id}`} className="text-xs text-text-secondary hover:text-text-primary">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary">
                    No leads match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
</div>
        ) : (
          <div className="grid grid-cols-6 gap-3 p-4">
            {LEAD_STATUSES.map((col) => {
              const cards = filtered.filter((l) => l.status === col);
              return (
                <div key={col} className="min-h-[200px] rounded-[var(--radius-default)] border border-border-default bg-bg-elevated p-2">
                  <div className="flex justify-between px-1.5 py-2 text-[11.5px] font-bold text-text-secondary">
                    <span>{col}</span>
                    <span>{cards.length}</span>
                  </div>
                  {cards.map((lead) => (
                    <Link
                      href={`/app/leads/${lead.id}`}
                      key={lead.id}
                      className="mb-2 block rounded-[9px] border border-border-default bg-bg-card p-2.5"
                    >
                      <div className="text-[13px] font-semibold">{lead.company_name}</div>
                      <div className="mt-0.5 text-[11.5px] text-text-secondary">
                        {lead.contact_name} · {lead.phone ?? "—"}
                      </div>
                    </Link>
                  ))}
                  {cards.length === 0 && (
                    <div className="p-4 text-[11px] text-text-secondary">Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <NewLeadModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function NewLeadModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createLead, initialState);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted && !pending && state.error === null) onClose();
  }, [submitted, pending, state.error, onClose]);

  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 px-4">
      <form
        action={formAction}
        onSubmit={() => setSubmitted(true)}
        className="w-full max-w-md rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6"
      >
        <h2 className="text-lg font-bold">New Lead</h2>

        <label className="mt-4 block text-xs font-medium text-text-secondary">
          Company name
          <input
            name="company_name"
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Contact name
          <input
            name="contact_name"
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Phone
          <input
            name="phone"
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Email
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>

        {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold text-text-primary hover:bg-bg-elevated"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {pending ? "Creating…" : "Create lead"}
          </button>
        </div>
      </form>
    </div>
  );
}
