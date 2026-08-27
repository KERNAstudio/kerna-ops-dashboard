"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { advanceProjectStatus } from "@/lib/projects/lifecycle";

export type PaymentFormState = { error: string | null };

// §2 step 4: "POC controls entry... Work blocked until marked Received." Logging and
// marking-received are separate actions so a payment can sit as a pending manual entry
// before it's confirmed.
export async function logPayment(_prev: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PAYMENT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const amount = Number(formData.get("amount") ?? 0);
  const paymentType = String(formData.get("payment_type") ?? "").trim();
  const received = formData.get("received") === "on";
  if (!amount || amount <= 0) return { error: "Enter a valid amount." };
  if (!paymentType) return { error: "Payment type is required." };

  const admin = createAdminClient();
  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      project_id: projectId,
      amount,
      payment_type: paymentType,
      status: received ? "received" : "pending",
      paid_at: received ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error || !payment) return { error: "Could not log payment." };

  await logAudit({ userId: actor.id, entityType: "payment", entityId: payment.id, action: "create", newState: payment });

  if (received) await advanceProjectOnPayment(projectId, paymentType, actor.id);

  revalidatePath(`/app/projects/${projectId}/payments`);
  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

export async function markPaymentReceived(_prev: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const projectId = String(formData.get("project_id") ?? "");
  const actor = await guard({ projectId, permission: "PAYMENT_EDIT" });
  if (actor.type !== "staff") redirect("/403");

  const paymentId = String(formData.get("payment_id") ?? "");
  const admin = createAdminClient();
  const { data: previous } = await admin.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (!previous || previous.project_id !== projectId) redirect("/403");

  const { data: updated } = await admin
    .from("payments")
    .update({ status: "received", paid_at: new Date().toISOString() })
    .eq("id", paymentId)
    .select()
    .single();

  await logAudit({
    userId: actor.id,
    entityType: "payment",
    entityId: paymentId,
    action: "mark_received",
    previousState: previous,
    newState: updated,
  });

  await advanceProjectOnPayment(projectId, previous.payment_type, actor.id);

  revalidatePath(`/app/projects/${projectId}/payments`);
  revalidatePath(`/app/projects/${projectId}/overview`);
  return { error: null };
}

// §2: "Advance Paid" / "Completed" are the lifecycle stages right after the matching
// payment is confirmed. advanceProjectStatus only moves the status forward from the exact
// prior stage, so a final payment logged early (before deliverable_sent) is a no-op here —
// it stays a received payment without forcing the project to "completed" out of order.
async function advanceProjectOnPayment(projectId: string, paymentType: string, userId: string) {
  const type = paymentType.toLowerCase();
  if (type === "advance") {
    await advanceProjectStatus(projectId, "quotation_approved", "advance_paid", userId, "status_advance_paid");
  } else if (type === "final") {
    await advanceProjectStatus(projectId, "final_payment_pending", "completed", userId, "status_completed");
  }
}
