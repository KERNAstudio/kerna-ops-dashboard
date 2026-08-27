"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importLeadsCsv, type ImportFormState } from "./actions";

const initialState: ImportFormState = { error: null };

export function ImportForm() {
  const [state, action, pending] = useActionState(importLeadsCsv, initialState);

  return (
    <div className="max-w-lg">
      <Link href="/app/leads" className="text-xs text-text-secondary hover:text-text-primary">
        ← Back to leads
      </Link>
      <h1 className="mt-2 text-[26px] font-bold tracking-tight">Import Leads</h1>
      <p className="mt-1 text-[13px] text-text-secondary">
        CSV with columns: company_name, contact_name, phone, email. A header row is optional.
      </p>

      <form action={action} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
        <input
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border-default file:bg-bg-elevated file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-text-primary"
        />

        {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}
        {state.imported !== undefined && (
          <p className="mt-3 text-xs text-success">
            Imported {state.imported} lead(s){state.skipped ? `, skipped ${state.skipped} row(s)` : ""}.
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Importing…" : "Import"}
        </button>
      </form>
    </div>
  );
}
