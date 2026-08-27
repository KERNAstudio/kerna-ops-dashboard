"use client";

import { useActionState } from "react";
import { addCredential, revealCredential, archiveCredential, deleteCredential, type CredentialFormState } from "./actions";

const initialState: CredentialFormState = { error: null };

type MaskedCredential = {
  id: string;
  platform_name: string;
  login_identifier: string | null;
  created_at: string;
  maskedPassword: string | null;
};

export function CredentialsView({
  projectId,
  credentials,
  canManage,
  isClient,
  fullyPaid,
}: {
  projectId: string;
  credentials: MaskedCredential[];
  canManage: boolean;
  isClient: boolean;
  fullyPaid: boolean;
}) {
  const [addState, addAction, addPending] = useActionState(addCredential, initialState);

  return (
    <div className="max-w-2xl space-y-4">
      {!fullyPaid && isClient && (
        <div className="rounded-[var(--radius-default)] border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          Credentials unlock once the project is fully paid and released.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {credentials.map((c) => (
          <CredentialCard key={c.id} credential={c} projectId={projectId} isClient={isClient} fullyPaid={fullyPaid} />
        ))}
        {credentials.length === 0 && (
          <div className="col-span-2 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-8 text-center text-sm text-text-secondary">
            No credentials stored yet.
          </div>
        )}
      </div>

      {canManage && (
        <form action={addAction} className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
          <input type="hidden" name="project_id" value={projectId} />
          <p className="text-sm font-bold">Add a credential</p>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            Platform
            <input
              name="platform_name"
              placeholder="e.g. Hosting, Domain registrar"
              required
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            Username / login
            <input
              name="login_identifier"
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          <label className="mt-2 block text-xs font-medium text-text-secondary">
            Password
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </label>
          {addState.error && <p className="mt-2 text-xs text-error">{addState.error}</p>}
          <button
            type="submit"
            disabled={addPending}
            className="mt-3 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {addPending ? "Saving…" : "Add credential"}
          </button>
        </form>
      )}
    </div>
  );
}

function CredentialCard({
  credential,
  projectId,
  isClient,
  fullyPaid,
}: {
  credential: MaskedCredential;
  projectId: string;
  isClient: boolean;
  fullyPaid: boolean;
}) {
  const [revealState, revealAction, revealPending] = useActionState(revealCredential, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveCredential, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCredential, initialState);
  const locked = isClient && !fullyPaid;

  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <p className="text-sm font-semibold">{credential.platform_name}</p>
      <p className="mt-1 text-xs text-text-secondary">{credential.login_identifier ?? "—"}</p>
      <p className="mt-1 font-data text-sm">
        {revealState.revealed?.id === credential.id ? revealState.revealed.password : credential.maskedPassword ?? "—"}
      </p>

      {!locked && credential.maskedPassword && (
        <form action={revealAction} className="mt-2 inline-block">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="credential_id" value={credential.id} />
          <button type="submit" disabled={revealPending} className="text-xs text-accent-primary disabled:opacity-50">
            {revealPending ? "…" : "Show"}
          </button>
        </form>
      )}
      {locked && <p className="mt-2 text-xs text-text-secondary">Locked until final payment</p>}
      {revealState.error && <p className="mt-1 text-xs text-error">{revealState.error}</p>}

      {isClient && !locked && (
        <div className="mt-2 flex gap-3">
          <form action={archiveAction}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="credential_id" value={credential.id} />
            <button type="submit" disabled={archivePending} className="text-xs text-text-secondary hover:text-text-primary disabled:opacity-50">
              {archivePending ? "…" : "Archive"}
            </button>
          </form>
          <form action={deleteAction}>
            <input type="hidden" name="project_id" value={projectId} />
            <input type="hidden" name="credential_id" value={credential.id} />
            <button type="submit" disabled={deletePending} className="text-xs text-error hover:text-error/80 disabled:opacity-50">
              {deletePending ? "…" : "Delete permanently"}
            </button>
          </form>
        </div>
      )}
      {(archiveState.error || deleteState.error) && (
        <p className="mt-1 text-xs text-error">{archiveState.error || deleteState.error}</p>
      )}
    </div>
  );
}
