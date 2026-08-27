import type { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// INVOICES (kerna-master-reference.md §1 Finance) has financial_year + sequence_number —
// the Indian-FY numbering scheme (Apr-Mar) implied by those column names, e.g. "2025-26".
export function financialYearFor(date: Date): string {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1; // Apr = month 3
  return `${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

// One invoice per received payment (§1: PAYMENTS and INVOICES are distinct entities). Not
// built from any dedicated spec doc — the source PDFs define the INVOICES columns but never
// its generation UI, so this fills the gap with the simplest rule the schema supports: no
// GST split, no multi-payment invoices, sequence restarts each financial year.
export async function createInvoiceForPayment(
  admin: ReturnType<typeof createAdminClient>,
  params: { projectId: string; paymentId: string; amount: number; actorId: string }
) {
  const now = new Date();
  const financialYear = financialYearFor(now);

  // ponytail: read-then-insert race on concurrent payments in the same FY could duplicate a
  // sequence number; add a DB sequence or advisory lock if invoice volume ever makes that likely.
  const { data: lastInvoice } = await admin
    .from("invoices")
    .select("sequence_number")
    .eq("financial_year", financialYear)
    .order("sequence_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sequenceNumber = (lastInvoice?.sequence_number ?? 0) + 1;
  const invoiceNumber = `KERNA/${financialYear}/${String(sequenceNumber).padStart(4, "0")}`;

  const { data: invoice, error } = await admin
    .from("invoices")
    .insert({
      project_id: params.projectId,
      payment_id: params.paymentId,
      invoice_number: invoiceNumber,
      financial_year: financialYear,
      sequence_number: sequenceNumber,
      subtotal: params.amount,
      gst_amount: 0,
      total: params.amount,
      status: "issued",
      issued_at: now.toISOString(),
    })
    .select()
    .single();
  if (invoice) {
    await logAudit({ userId: params.actorId, entityType: "invoice", entityId: invoice.id, action: "create", newState: invoice });
  }
  return { data: invoice, error };
}
