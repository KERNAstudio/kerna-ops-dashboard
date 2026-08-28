import type { createAdminClient } from "@/lib/supabase/admin";

const CYCLE_MONTHS: Record<string, number> = { monthly: 1, quarterly: 3, yearly: 12 };

// A "subscription" payment_type (logged through the same Payments form as advance/final —
// there's no separate recurring-payment UI, matching the rest of the app's manual-entry
// model) advances next_due_date by one cycle. Advances from today rather than the old due
// date when a cycle was paid late, so a payment made well past grace doesn't leave the
// subscription looking overdue again the moment it's paid.
export async function advanceSubscriptionCycle(admin: ReturnType<typeof createAdminClient>, projectId: string): Promise<void> {
  const { data: subscription } = await admin.from("subscriptions").select("*").eq("project_id", projectId).maybeSingle();
  if (!subscription) return;

  const months = CYCLE_MONTHS[subscription.billing_cycle] ?? 1;
  const base = subscription.next_due_date && new Date(subscription.next_due_date) > new Date() ? new Date(subscription.next_due_date) : new Date();
  base.setMonth(base.getMonth() + months);

  await admin.from("subscriptions").update({ next_due_date: base.toISOString().slice(0, 10) }).eq("project_id", projectId);
}
