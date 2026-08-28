import { ScopeApprovalButton, FinalDeliveryReview } from "./TimelineForm";
import { DangerZone } from "./DangerZone";
import { RequirementsPanel } from "./RequirementsPanel";
import { ContractPanel } from "./ContractPanel";
import { SubscriptionPanel } from "./SubscriptionPanel";

// §6: "Client view modes — Simple: health, stage, next action, pending approvals, short
// updates, vault when unlocked. Balanced (default): + module progress, milestone timeline,
// collapsed version history, payment progress, key team roles. Power: everything — full
// activity feed, full module/version/team detail, payment log." CLAUDE.md non-negotiable:
// "Client view mode changes components, never routes" — this is that switch.
export function ClientProjectOverview({
  projectId,
  status,
  statusLabel,
  viewMode,
  healthStatusClient,
  clientDeadline,
  paidTotal,
  modules,
  payments,
  activity,
  team,
  hasPendingTermination,
  requirementSnapshot,
  addenda,
  activeContractVersion,
  subscription,
}: {
  projectId: string;
  status: string;
  statusLabel: string;
  viewMode: string;
  healthStatusClient: string | null;
  clientDeadline: string;
  paidTotal: string;
  modules: { module_type: string; status: string }[];
  payments: { payment_type: string; amount: number; status: string }[];
  activity: { action: string; created_at: string }[];
  team: { name: string; role: string }[];
  hasPendingTermination: boolean;
  requirementSnapshot: { content: string; locked_at: string; locked_by_name: string | null } | null;
  addenda: { id: string; description: string; created_at: string; created_by_name: string | null }[];
  activeContractVersion: {
    id: string;
    version_number: number;
    document_url: string | null;
    issued_at: string | null;
    signed_at: string | null;
    signed_by_name: string | null;
  } | null;
  subscription: { billing_cycle: string; next_due_date: string | null; grace_period_days: number | null; status: string } | null;
}) {
  const showBalanced = viewMode === "balanced" || viewMode === "power";
  const showPower = viewMode === "power";

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Status" value={statusLabel} />
        <SummaryCard label="Health" value={healthStatusClient ?? "—"} />
        <SummaryCard label="Your deadline" value={clientDeadline} />
        <SummaryCard label="Advance/final paid" value={paidTotal} />
      </div>

      {status === "team_assigned" && (
        <>
          <RequirementsPanel projectId={projectId} snapshot={requirementSnapshot} addenda={addenda} canEdit={false} />
          {requirementSnapshot && <ScopeApprovalButton projectId={projectId} />}
        </>
      )}
      {status === "deliverable_sent" && <FinalDeliveryReview projectId={projectId} />}

      {showBalanced && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <Panel title="Module progress">
            {modules.map((m, i) => (
              <Row key={i} left={m.module_type} right={m.status} />
            ))}
            {modules.length === 0 && <Empty />}
          </Panel>
          <Panel title="Payment progress">
            {payments.map((p, i) => (
              <Row key={i} left={`${p.payment_type} — ${p.amount.toFixed(2)}`} right={p.status} />
            ))}
            {payments.length === 0 && <Empty />}
          </Panel>
        </div>
      )}

      {showPower && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          <Panel title="Activity">
            {activity.map((a, i) => (
              <Row key={i} left={a.action.replace(/_/g, " ")} right={new Date(a.created_at).toLocaleDateString()} />
            ))}
            {activity.length === 0 && <Empty />}
          </Panel>
          <Panel title="Team">
            {team.map((t, i) => (
              <Row key={i} left={t.name} right={t.role} />
            ))}
            {team.length === 0 && <Empty />}
          </Panel>
        </div>
      )}

      {activeContractVersion && (
        <ContractPanel projectId={projectId} activeVersion={activeContractVersion} canManage={false} canCountersign={false} />
      )}
      {subscription && <SubscriptionPanel projectId={projectId} subscription={subscription} canManage={false} />}

      <DangerZone projectId={projectId} hasPendingRequest={hasPendingTermination} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="mt-1.5 text-lg font-bold font-data">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card">
      <p className="p-4 pb-0 text-sm font-bold">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between border-t border-border-default px-4 py-2.5 text-xs first:border-t-0">
      <span className="capitalize">{left}</span>
      <span className="text-text-secondary">{right}</span>
    </div>
  );
}

function Empty() {
  return <div className="p-4 text-xs text-text-secondary">Nothing yet.</div>;
}
