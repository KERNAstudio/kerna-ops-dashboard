"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateLead, type LeadFormState } from "../actions";
import { LEAD_STATUSES } from "@/lib/leads/constants";
import type { Tables } from "@/lib/supabase/database.types";

const initialState: LeadFormState = { error: null };

export function LeadDetailForm({
  lead,
  staff,
}: {
  lead: Tables<"leads">;
  staff: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(updateLead, initialState);

  return (
    <div className="max-w-lg">
      <Link href="/app/leads" className="text-xs text-text-secondary hover:text-text-primary">
        ← Back to leads
      </Link>
      <h1 className="mt-2 text-[26px] font-bold tracking-tight">{lead.company_name}</h1>

      <form action={formAction} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
        <input type="hidden" name="lead_id" value={lead.id} />

        <label className="block text-xs font-medium text-text-secondary">
          Company name
          <input
            name="company_name"
            defaultValue={lead.company_name}
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Contact name
          <input
            name="contact_name"
            defaultValue={lead.contact_name}
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Phone
          <input
            name="phone"
            defaultValue={lead.phone ?? ""}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Email
          <input
            name="email"
            type="email"
            defaultValue={lead.email ?? ""}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Status
          <select
            name="status"
            defaultValue={lead.status}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Assigned to
          <select
            name="assigned_to"
            defaultValue={lead.assigned_to ?? ""}
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          >
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-5 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
