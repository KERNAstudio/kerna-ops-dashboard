"use client";

import { useActionState } from "react";
import { updateSystemSettings, type SystemSettingsFormState } from "./actions";
import type { SYSTEM_SETTINGS } from "@/lib/system-settings";

const initialState: SystemSettingsFormState = { error: null };

type Setting = (typeof SYSTEM_SETTINGS)[number] & { value: number };

export function SystemSettingsForm({ settings }: { settings: Setting[] }) {
  const [state, action, pending] = useActionState(updateSystemSettings, initialState);

  return (
    <div className="max-w-xl">
      <h1 className="text-[26px] font-bold tracking-tight">System Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Escalation and action-required thresholds. Founder-only — see docs/kerna-master-reference.md §5.
      </p>

      <form action={action} className="mt-6 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-6">
        {settings.map((setting) => (
          <label key={setting.key} className="mb-4 block text-xs font-medium text-text-secondary last:mb-0">
            {setting.label}
            <div className="mt-1 flex items-center gap-2">
              <input
                name={setting.key}
                type="number"
                min={0}
                step={1}
                defaultValue={setting.value}
                required
                className="w-28 rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
              />
              <span className="text-text-secondary">{setting.unit}</span>
            </div>
            <p className="mt-1 text-[11px] font-normal text-text-secondary opacity-70">{setting.hint}</p>
          </label>
        ))}

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
