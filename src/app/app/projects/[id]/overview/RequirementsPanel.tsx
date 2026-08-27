"use client";

import { useActionState } from "react";
import { lockRequirement, addAddendum, type RequirementFormState } from "./requirement-actions";

const initialState: RequirementFormState = { error: null };

type Snapshot = { content: string; locked_at: string; locked_by_name: string | null } | null;
type Addendum = { id: string; description: string; created_at: string; created_by_name: string | null };

export function RequirementsPanel({
  projectId,
  snapshot,
  addenda,
  canEdit,
}: {
  projectId: string;
  snapshot: Snapshot;
  addenda: Addendum[];
  canEdit: boolean;
}) {
  return (
    <div className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <p className="text-sm font-bold">Requirement</p>

      {snapshot ? (
        <>
          <div className="mt-2 rounded-lg border border-border-default bg-bg-elevated p-3 text-sm whitespace-pre-wrap">{snapshot.content}</div>
          <p className="mt-1.5 text-[11px] text-text-secondary">
            Locked {new Date(snapshot.locked_at).toLocaleDateString()}
            {snapshot.locked_by_name ? ` by ${snapshot.locked_by_name}` : ""} — the baseline every approval refers back to.
          </p>

          {addenda.length > 0 && (
            <div className="mt-3 border-t border-border-default pt-3">
              <p className="text-xs font-semibold text-text-secondary">Addenda</p>
              <ul className="mt-1.5 space-y-2">
                {addenda.map((a) => (
                  <li key={a.id} className="text-sm">
                    <span className="text-text-secondary">{new Date(a.created_at).toLocaleDateString()}</span>
                    {a.created_by_name ? <span className="text-text-secondary"> — {a.created_by_name}</span> : null}
                    <div>{a.description}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {canEdit && <AddendumForm projectId={projectId} />}
        </>
      ) : canEdit ? (
        <LockForm projectId={projectId} />
      ) : (
        <p className="mt-2 text-sm text-text-secondary">Your project team is finalizing the scope details.</p>
      )}
    </div>
  );
}

function LockForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(lockRequirement, initialState);

  return (
    <form action={action} className="mt-2">
      <input type="hidden" name="project_id" value={projectId} />
      <textarea
        name="content"
        required
        rows={4}
        placeholder="Scope, timeline, and milestones agreed at kickoff…"
        className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
      />
      <p className="mt-1 text-[11px] text-text-secondary">
        Becomes the permanent baseline once locked — later changes go through addenda, not edits here.
      </p>
      {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {pending ? "Locking…" : "Lock requirement"}
      </button>
    </form>
  );
}

function AddendumForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(addAddendum, initialState);

  return (
    <form action={action} className="mt-3 border-t border-border-default pt-3">
      <input type="hidden" name="project_id" value={projectId} />
      <textarea
        name="description"
        required
        rows={2}
        placeholder="Describe the minor change…"
        className="w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
      />
      {state.error && <p className="mt-1 text-xs text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-8 rounded-lg border border-border-default px-3 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add addendum"}
      </button>
    </form>
  );
}
