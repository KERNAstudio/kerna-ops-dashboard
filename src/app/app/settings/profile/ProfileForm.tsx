"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = { error: null };

export function ProfileForm({ name, email, roles }: { name: string; email: string; roles: string[] }) {
  const [state, action, pending] = useActionState(updateProfile, initialState);

  return (
    <div className="max-w-md">
      <h1 className="text-[26px] font-bold tracking-tight">Profile</h1>

      <form action={action} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
        <label className="block text-xs font-medium text-text-secondary">
          Name
          <input
            name="name"
            defaultValue={name}
            required
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Email
          <input
            value={email}
            disabled
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-secondary outline-none"
          />
        </label>
        <label className="mt-3 block text-xs font-medium text-text-secondary">
          Role
          <input
            value={roles.join(", ") || "—"}
            disabled
            className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm capitalize text-text-secondary outline-none"
          />
        </label>

        {state.error && <p className="mt-3 text-xs text-error">{state.error}</p>}
        {state.saved && <p className="mt-3 text-xs text-success">Saved.</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
