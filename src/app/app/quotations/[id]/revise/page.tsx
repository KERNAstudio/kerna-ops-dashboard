import { guard } from "@/lib/auth/guard";
import { getQuotationDetail, assertStaffOwnsQuotation } from "@/lib/quotations/access";
import { ReviseBuilder } from "./ReviseBuilder";

// §4 route: /app/quotations/:id/revise — the actual editable revision UI (the previous
// "Revise" button just cloned the version unchanged; this is where you can edit it).
export default async function ReviseQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await guard({ permission: "QUOTATION_EDIT" });
  const detail = await getQuotationDetail(id);
  assertStaffOwnsQuotation(actor, detail.quotation);

  return (
    <ReviseBuilder
      quotationId={id}
      companyName={detail.lead.company_name}
      lineItems={detail.lineItems}
      discount={detail.latestVersion?.discount ?? 0}
    />
  );
}
