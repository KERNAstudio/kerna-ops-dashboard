import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";

// POC leaderboard — active project load + revenue collected per POC. No historical
// status-transition timestamps are stored per stage (only current status + the audit
// trail), so a real "average time in each lifecycle stage" report isn't derivable yet;
// this is the performance view that current data actually supports.
export default async function PerformanceAnalyticsPage() {
  await guard({ allowStaffRoles: ["founder"], allowClient: false });

  const admin = createAdminClient();
  const { data: clients } = await admin.from("clients").select("id, poc_user_id, users:poc_user_id(name)");
  const { data: projects } = await admin.from("projects").select("id, client_id, status");
  const { data: payments } = await admin.from("payments").select("project_id, amount, status");

  const clientToPoc = new Map((clients ?? []).map((c) => [c.id, { id: c.poc_user_id, name: c.users?.name }]));
  const projectToClient = new Map((projects ?? []).map((p) => [p.id, p.client_id]));

  const leaderboard = new Map<string, { name: string; activeProjects: number; revenue: number }>();

  for (const p of projects ?? []) {
    const poc = clientToPoc.get(p.client_id);
    if (!poc?.id) continue;
    const entry = leaderboard.get(poc.id) ?? { name: poc.name ?? "—", activeProjects: 0, revenue: 0 };
    if (p.status !== "completed") entry.activeProjects++;
    leaderboard.set(poc.id, entry);
  }

  for (const pay of payments ?? []) {
    if (pay.status !== "received") continue;
    const clientId = projectToClient.get(pay.project_id);
    const poc = clientId ? clientToPoc.get(clientId) : null;
    if (!poc?.id) continue;
    const entry = leaderboard.get(poc.id) ?? { name: poc.name ?? "—", activeProjects: 0, revenue: 0 };
    entry.revenue += pay.amount;
    leaderboard.set(poc.id, entry);
  }

  const rows = [...leaderboard.values()].sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="max-w-2xl">
      <h1 className="text-[26px] font-bold tracking-tight">Performance</h1>
      <p className="mt-1 text-[13px] text-text-secondary">POC leaderboard — active projects and revenue collected.</p>

      <div className="mt-5 overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["POC", "Active Projects", "Revenue Collected"].map((h) => (
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
            {rows.map((r) => (
              <tr key={r.name} className="border-b border-border-default last:border-0">
                <td className="px-4 py-3 font-semibold">{r.name}</td>
                <td className="px-4 py-3 font-data">{r.activeProjects}</td>
                <td className="px-4 py-3 font-data">{r.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-text-secondary">
                  No data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
