"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createModule, assignModuleUser, type ModuleFormState } from "./actions";

const initialState: ModuleFormState = { error: null };

type Module = {
  id: string;
  module_type: string;
  status: string;
  module_assignments: { id: string; user_id: string; users: { name: string } | null }[];
};

export function ModulesView({
  projectId,
  modules,
  staff,
  canEdit,
}: {
  projectId: string;
  modules: Module[];
  staff: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [createState, createAction, createPending] = useActionState(createModule, initialState);

  return (
    <div className="max-w-2xl space-y-4">
      {modules.map((mod) => (
        <ModuleCard key={mod.id} module={mod} projectId={projectId} staff={staff} canEdit={canEdit} />
      ))}
      {modules.length === 0 && (
        <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-8 text-center text-sm text-text-secondary">
          No modules yet. {canEdit && "Add one below to start assigning the team."}
        </div>
      )}

      {canEdit && (
        <form
          action={createAction}
          className="flex items-end gap-2 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4"
        >
          <input type="hidden" name="project_id" value={projectId} />
          <label className="flex-1 text-xs font-medium text-text-secondary">
            New module name
            <input
              name="module_type"
              placeholder="e.g. Homepage, Backend API"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <button
            type="submit"
            disabled={createPending}
            className="h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {createPending ? "Adding…" : "Add module"}
          </button>
        </form>
      )}
      {createState.error && <p className="text-xs text-error">{createState.error}</p>}
    </div>
  );
}

function ModuleCard({
  module: mod,
  projectId,
  staff,
  canEdit,
}: {
  module: Module;
  projectId: string;
  staff: { id: string; name: string }[];
  canEdit: boolean;
}) {
  const [state, action, pending] = useActionState(assignModuleUser, initialState);
  const assignedIds = new Set(mod.module_assignments.map((a) => a.user_id));

  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="flex items-center justify-between">
        <Link href={`/app/projects/${projectId}/modules/${mod.id}`} className="font-semibold hover:text-accent-primary">
          {mod.module_type}
        </Link>
        <span className="inline-flex h-6 items-center rounded-full border border-border-default bg-bg-elevated px-2.5 text-[11.5px] font-medium font-data text-text-secondary">
          {mod.status}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {mod.module_assignments.map((a) => (
          <span key={a.id} className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-primary">
            {a.users?.name ?? "—"}
          </span>
        ))}
        {mod.module_assignments.length === 0 && <span className="text-xs text-text-secondary">Unassigned</span>}
      </div>

      {canEdit && (
        <form action={action} className="mt-3 flex gap-2">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="module_id" value={mod.id} />
          <select
            name="user_id"
            className="flex-1 rounded-lg border border-border-default bg-bg-elevated px-2.5 py-1.5 text-xs outline-none focus:border-accent-primary"
          >
            <option value="">Assign staff…</option>
            {staff
              .filter((s) => !assignedIds.has(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="h-8 rounded-lg border border-border-default px-3 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
          >
            {pending ? "…" : "Assign"}
          </button>
        </form>
      )}
      {state.error && <p className="mt-1.5 text-xs text-error">{state.error}</p>}
    </div>
  );
}
