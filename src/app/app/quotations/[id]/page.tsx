import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { getQuotationDetail, assertStaffOwnsQuotation, assertClientOwnsQuotation } from "@/lib/quotations/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { QuotationStaffView } from "./QuotationStaffView";
import { QuotationClientView } from "./QuotationClientView";

// Shared route for both actor types (confirmed with user) — staff get the builder/editor,
// a client actor whose quotation this is gets a read-only approval view with a checkbox.
export default async function QuotationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard();
  const detail = await getQuotationDetail(id);

  if (actor.type === "staff") {
    assertStaffOwnsQuotation(actor, detail.quotation);
    const admin = createAdminClient();
    const { data: poc } = detail.quotation.poc_id
      ? await admin.from("users").select("name").eq("id", detail.quotation.poc_id).maybeSingle()
      : { data: null };
    return <QuotationStaffView detail={detail} pocName={poc?.name ?? "—"} />;
  }

  assertClientOwnsQuotation(actor, detail.lead);
  const admin = createAdminClient();
  const { data: client } = await admin.from("clients").select("*").eq("id", actor.clientId).single();
  if (!client) redirect("/403");
  return <QuotationClientView detail={detail} client={client} />;
}
