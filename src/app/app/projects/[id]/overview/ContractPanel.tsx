"use client";

import { useActionState } from "react";
import { uploadContract, countersignContract, type ContractFormState } from "./contract-actions";
import { PreviewLink } from "@/lib/modules/PreviewLink";

const initialState: ContractFormState = { error: null };

type Version = {
  id: string;
  version_number: number;
  document_url: string | null;
  issued_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
};

export function ContractPanel({
  projectId,
  activeVersion,
  canManage,
  canCountersign,
}: {
  projectId: string;
  activeVersion: Version | null;
  canManage: boolean;
  canCountersign: boolean;
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadContract, initialState);
  const [signState, signAction, signPending] = useActionState(countersignContract, initialState);

  return (
    <div className="mt-4 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <p className="text-sm font-bold">Contract</p>

      {activeVersion ? (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border-default bg-bg-elevated p-3 text-sm">
          <span>Version {activeVersion.version_number}</span>
          {activeVersion.issued_at && (
            <span className="text-text-secondary">issued {new Date(activeVersion.issued_at).toLocaleDateString()}</span>
          )}
          {activeVersion.signed_at ? (
            <span className="inline-flex h-6 items-center rounded-full bg-success/10 px-2.5 text-[11.5px] font-medium text-success">
              Signed {new Date(activeVersion.signed_at).toLocaleDateString()}
              {activeVersion.signed_by_name ? ` by ${activeVersion.signed_by_name}` : ""}
            </span>
          ) : (
            <span className="inline-flex h-6 items-center rounded-full bg-bg-card px-2.5 text-[11.5px] font-medium text-text-secondary">
              Unsigned
            </span>
          )}
          <PreviewLink projectId={projectId} fileUrl={activeVersion.document_url} />

          {canCountersign && !activeVersion.signed_at && (
            <form action={signAction}>
              <input type="hidden" name="project_id" value={projectId} />
              <input type="hidden" name="version_id" value={activeVersion.id} />
              <button
                type="submit"
                disabled={signPending}
                className="h-7 rounded-lg bg-accent-primary px-3 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
              >
                {signPending ? "Signing…" : "Countersign"}
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-text-secondary">No contract on file yet.</p>
      )}
      {signState.error && <p className="mt-2 text-xs text-error">{signState.error}</p>}

      {canManage && (
        <form action={uploadAction} className="mt-3 flex items-center gap-2 border-t border-border-default pt-3">
          <input type="hidden" name="project_id" value={projectId} />
          <input
            name="file"
            type="file"
            required
            className="flex-1 text-sm text-text-secondary file:mr-3 file:rounded-lg file:border file:border-border-default file:bg-bg-elevated file:px-3 file:py-1.5 file:text-xs file:font-semibold"
          />
          <button
            type="submit"
            disabled={uploadPending}
            className="h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
          >
            {uploadPending ? "Uploading…" : activeVersion ? "Upload new version" : "Upload contract"}
          </button>
        </form>
      )}
      {uploadState.error && <p className="mt-2 text-xs text-error">{uploadState.error}</p>}
    </div>
  );
}
