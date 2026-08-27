import type { createAdminClient } from "@/lib/supabase/admin";

// Projects have no direct quotation_id (§1) — the required total is the latest version of
// the most recent quotation raised against this project's client, same chain payment-gate's
// caller has no other way to reach. Returns 0% if there's no quotation to compare against,
// which keeps isProjectFullyPaid's default (threshold 100) equivalent to the old
// status-only check rather than accidentally unlocking on a division by zero.
export async function getProjectPaidPercent(admin: ReturnType<typeof createAdminClient>, projectId: string): Promise<number> {
  const { data: project } = await admin.from("projects").select("client_id").eq("id", projectId).maybeSingle();
  if (!project) return 0;

  const { data: payments } = await admin.from("payments").select("amount, status").eq("project_id", projectId);
  const paidAmount = (payments ?? []).filter((p) => p.status === "received").reduce((sum, p) => sum + p.amount, 0);

  const { data: leads } = await admin.from("leads").select("id").eq("client_id", project.client_id);
  const leadIds = (leads ?? []).map((l) => l.id);
  const { data: quotation } = leadIds.length
    ? await admin.from("quotations").select("id").in("lead_id", leadIds).order("created_at", { ascending: false }).limit(1).maybeSingle()
    : { data: null };
  const { data: version } = quotation
    ? await admin
        .from("quotation_versions")
        .select("total")
        .eq("quotation_id", quotation.id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const requiredTotal = version?.total ?? 0;
  return requiredTotal > 0 ? (paidAmount / requiredTotal) * 100 : 0;
}
