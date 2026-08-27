import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// §4: "/app/analytics/revenue|conversion|performance — founder only, hidden from sidebar,
// still route-guarded."
export default async function RevenueAnalyticsPage() {
  await guard({ allowStaffRoles: ["founder"], allowClient: false });

  const admin = createAdminClient();
  const { data: payments } = await admin.from("payments").select("amount, status, payment_type, created_at");

  const received = (payments ?? []).filter((p) => p.status === "received");
  const receivedTotal = received.reduce((s, p) => s + p.amount, 0);
  const pendingTotal = (payments ?? []).filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const advanceTotal = received.filter((p) => p.payment_type.toLowerCase() === "advance").reduce((s, p) => s + p.amount, 0);
  const finalTotal = received.filter((p) => p.payment_type.toLowerCase() === "final").reduce((s, p) => s + p.amount, 0);

  const byMonth = new Map<string, number>();
  for (const p of received) {
    const key = p.created_at.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + p.amount);
  }
  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonth = Math.max(1, ...months.map(([, v]) => v));

  return (
    <div className="max-w-3xl">
      <h1 className="text-[26px] font-bold tracking-tight">Revenue</h1>

      <div className="mt-5 grid grid-cols-4 gap-3">
        <Stat label="Received" value={receivedTotal.toFixed(2)} />
        <Stat label="Pending" value={pendingTotal.toFixed(2)} />
        <Stat label="Advance" value={advanceTotal.toFixed(2)} />
        <Stat label="Final" value={finalTotal.toFixed(2)} />
      </div>

      <div className="mt-5 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-5">
        <p className="text-sm font-bold">Received by month</p>
        <div className="mt-4 space-y-2">
          {months.map(([month, value]) => (
            <div key={month} className="flex items-center gap-3">
              <span className="w-16 font-data text-xs text-text-secondary">{month}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-bg-elevated">
                <div className="h-full bg-accent-primary" style={{ width: `${(value / maxMonth) * 100}%` }} />
              </div>
              <span className="w-20 text-right font-data text-xs">{value.toFixed(0)}</span>
            </div>
          ))}
          {months.length === 0 && <p className="text-sm text-text-secondary">No received payments yet.</p>}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-default)] border border-border-default bg-bg-card p-4">
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="mt-1.5 text-xl font-bold font-data">{value}</div>
    </div>
  );
}
