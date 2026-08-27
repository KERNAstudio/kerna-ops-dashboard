import { redirect } from "next/navigation";
import type { Actor } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type QuotationDetail = {
  quotation: Tables<"quotations">;
  lead: Tables<"leads">;
  latestVersion: Tables<"quotation_versions"> | null;
  lineItems: Tables<"quotation_line_items">[];
};

export async function getQuotationDetail(quotationId: string): Promise<QuotationDetail> {
  const admin = createAdminClient();

  const { data: quotation } = await admin.from("quotations").select("*").eq("id", quotationId).maybeSingle();
  if (!quotation) redirect("/app/quotations");

  const { data: lead } = await admin.from("leads").select("*").eq("id", quotation.lead_id).maybeSingle();
  if (!lead) redirect("/app/quotations");

  const { data: latestVersion } = await admin
    .from("quotation_versions")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lineItems } = latestVersion
    ? await admin
        .from("quotation_line_items")
        .select("*")
        .eq("quotation_version_id", latestVersion.id)
        .order("id")
    : { data: [] };

  return { quotation, lead, latestVersion, lineItems: lineItems ?? [] };
}

// §3: quotations are POC-owned ("Sales: Own leads/quotations"); Founder has no restriction.
export function assertStaffOwnsQuotation(actor: Actor, quotation: Tables<"quotations">) {
  if (actor.type !== "staff") redirect("/403");
  if (!actor.roles.includes("founder") && quotation.poc_id !== actor.id) redirect("/403");
}

// A client may only see the quotation tied to their own client record.
export function assertClientOwnsQuotation(actor: Actor, lead: Tables<"leads">) {
  if (actor.type !== "client") redirect("/403");
  if (lead.client_id !== actor.clientId) redirect("/403");
}
