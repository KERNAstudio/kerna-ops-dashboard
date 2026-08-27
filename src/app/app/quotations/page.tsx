import Link from "next/link";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { QUOTATION_STATUS_BADGE, type QuotationStatus } from "@/lib/quotations/constants";

export default async function QuotationsPage() {
  const actor = await guard({ permission: "QUOTATION_CREATE", allowClient: false });
  if (actor.type !== "staff") return null;

  const admin = createAdminClient();
  let query = admin
    .from("quotations")
    .select("*, leads(company_name, contact_name), poc:users!quotations_poc_id_fkey(name)")
    .order("created_at", { ascending: false });

  if (!actor.roles.includes("founder")) {
    query = query.eq("poc_id", actor.id);
  }

  const { data: quotations } = await query;

  return (
    <div className="max-w-[1180px]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">Quotations</h1>
          <p className="text-[13px] text-text-secondary">{quotations?.length ?? 0} quotations</p>
        </div>
        <Link
          href="/app/quotations/new"
          className="inline-flex h-[38px] items-center gap-1.5 rounded-[10px] bg-accent-primary px-4 text-[13.5px] font-semibold text-white hover:bg-accent-hover"
        >
          + New Quotation
        </Link>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Lead", "POC", "Status", "Created", ""].map((h) => (
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
            {(quotations ?? []).map((q) => (
              <tr key={q.id} className="border-b border-border-default last:border-0 hover:bg-bg-elevated">
                <td className="px-4 py-3 font-semibold">{q.leads?.company_name ?? "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{q.poc?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11.5px] font-medium font-data ${
                      QUOTATION_STATUS_BADGE[q.status as QuotationStatus] ?? QUOTATION_STATUS_BADGE.draft
                    }`}
                  >
                    {q.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/app/quotations/${q.id}`} className="text-xs text-text-secondary hover:text-text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {(quotations ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No quotations yet.
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
