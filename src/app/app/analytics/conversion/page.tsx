import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_STATUSES } from "@/lib/leads/constants";

export default async function ConversionAnalyticsPage() {
  await guard({ allowStaffRoles: ["founder"], allowClient: false });

  const admin = createAdminClient();
  const { data: leads } = await admin.from("leads").select("status");
  const total = leads?.length ?? 0;

  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  for (const l of leads ?? []) {
    if (l.status in counts) counts[l.status]++;
  }
  const closedWon = counts["Closed Won"] ?? 0;
  const conversionRate = total > 0 ? ((closedWon / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-bold tracking-tight">Conversion</h1>
      <p className="mt-1 text-[13px] text-text-secondary">
        {total} leads · {conversionRate}% closed won
      </p>

      <div className="mt-5 rounded-[var(--radius-default)] border border-border-default bg-bg-card p-5">
        <div className="space-y-2">
          {LEAD_STATUSES.map((status) => {
            const count = counts[status];
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-28 text-xs text-text-secondary">{status}</span>
                <div className="h-5 flex-1 overflow-hidden rounded bg-bg-elevated">
                  <div className="h-full bg-accent-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 text-right font-data text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
