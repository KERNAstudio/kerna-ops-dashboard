"use client";

import { useActionState } from "react";
import { runChecks, createManualEscalation, updateEscalationStatus, type EscalationFormState } from "./actions";
import { ESCALATION_STATUSES, SEVERITY_BADGE, STATUS_BADGE, type EscalationSeverity, type EscalationStatus } from "@/lib/escalations/constants";

const initialState: EscalationFormState = { error: null };

type Escalation = {
  id: string;
  escalation_type: string;
  severity: string;
  status: string;
  triggered_by: string;
  created_at: string;
  projects: { type: string; clients: { company_name: string } | null } | null;
  owner: { name: string } | null;
};

function ageLabel(createdAt: string) {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function EscalationsView({
  escalations,
  projects,
  canUpdateStatus,
  canCreate,
}: {
  escalations: Escalation[];
  projects: { id: string; label: string }[];
  canUpdateStatus: boolean;
  canCreate: boolean;
}) {
  const [runState, runAction, runPending] = useActionState(runChecks, initialState);
  const [createState, createAction, createPending] = useActionState(createManualEscalation, initialState);

  return (
    <div className="max-w-[1180px] space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Escalation Center</h1>
          <p className="text-[13px] text-text-secondary">{escalations.length} total</p>
        </div>
        <form action={runAction}>
          <button
            type="submit"
            disabled={runPending}
            className="h-9 rounded-[10px] border border-border-default px-4 text-xs font-semibold hover:bg-bg-elevated disabled:opacity-50"
          >
            {runPending ? "Checking…" : "Run Checks"}
          </button>
        </form>
      </div>
      {runState.error && <p className="text-xs text-error">{runState.error}</p>}

      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Project", "Type", "Severity", "Trigger", "Owner", "Age", "Status", ""].map((h) => (
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
            {escalations.map((e) => (
              <EscalationRow key={e.id} escalation={e} canUpdateStatus={canUpdateStatus} />
            ))}
            {escalations.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-text-secondary">
                  No escalations.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>

      {canCreate && (
        <form action={createAction} className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
          <p className="text-sm font-bold">Create manual escalation</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select
              name="project_id"
              required
              className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            >
              <option value="">Project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <input
              name="escalation_type"
              placeholder="Type (e.g. dispute)"
              required
              className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
            <select
              name="severity"
              defaultValue="medium"
              className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              name="reason"
              placeholder="Reason"
              className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-accent-primary"
            />
          </div>
          {createState.error && <p className="mt-2 text-xs text-error">{createState.error}</p>}
          <button
            type="submit"
            disabled={createPending}
            className="mt-3 h-9 rounded-[10px] bg-accent-primary px-4 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {createPending ? "Creating…" : "Create escalation"}
          </button>
        </form>
      )}
    </div>
  );
}

function EscalationRow({ escalation, canUpdateStatus }: { escalation: Escalation; canUpdateStatus: boolean }) {
  const [state, action, pending] = useActionState(updateEscalationStatus, initialState);

  return (
    <tr className="border-b border-border-default last:border-0">
      <td className="px-4 py-3 font-semibold">{escalation.projects?.clients?.company_name ?? "—"}</td>
      <td className="px-4 py-3">{escalation.escalation_type}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${
            SEVERITY_BADGE[escalation.severity as EscalationSeverity] ?? SEVERITY_BADGE.low
          }`}
        >
          {escalation.severity}
        </span>
      </td>
      <td className="px-4 py-3 text-text-secondary capitalize">{escalation.triggered_by}</td>
      <td className="px-4 py-3 text-text-secondary">{escalation.owner?.name ?? "—"}</td>
      <td className="px-4 py-3 font-data text-text-secondary">{ageLabel(escalation.created_at)}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${
            STATUS_BADGE[escalation.status as EscalationStatus] ?? STATUS_BADGE.open
          }`}
        >
          {escalation.status.replace("_", " ")}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        {canUpdateStatus && escalation.status !== "resolved" && escalation.status !== "dismissed" && (
          <form action={action} className="inline-flex gap-1.5">
            <input type="hidden" name="escalation_id" value={escalation.id} />
            <select
              name="status"
              defaultValue=""
              onChange={(e) => e.target.form?.requestSubmit()}
              disabled={pending}
              className="rounded-lg border border-border-default bg-bg-elevated px-2 py-1 text-xs outline-none"
            >
              <option value="" disabled>
                Set status…
              </option>
              {ESCALATION_STATUSES.filter((s) => s !== escalation.status).map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </form>
        )}
        {state.error && <p className="text-xs text-error">{state.error}</p>}
      </td>
    </tr>
  );
}
