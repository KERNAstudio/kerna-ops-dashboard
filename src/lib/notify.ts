import type { createAdminClient } from "@/lib/supabase/admin";

// MASTER_WORKFLOW.pdf "Notification System": Approval Required, Approval Rejected, Payment
// Pending, Deliverable Ready. Only escalations/detect.ts wrote to this table before — the
// day-to-day triggers below never fired. notifications.user_id only references USERS
// (clients aren't in that table), so this stays staff-only; deliverable-ready is left to the
// client's own status-driven UI (ClientProjectOverview already surfaces it immediately, no
// separate row needed) rather than inventing a client notification channel the schema
// doesn't support.
export async function notify(
  admin: ReturnType<typeof createAdminClient>,
  userIds: (string | null | undefined)[],
  params: { type: string; entityId: string; message: string; severity?: "low" | "medium" | "high" }
) {
  const recipients = [...new Set(userIds.filter((id): id is string => !!id))];
  if (recipients.length === 0) return;

  await admin.from("notifications").insert(
    recipients.map((userId) => ({
      user_id: userId,
      type: params.type,
      entity_id: params.entityId,
      severity: params.severity ?? null,
      message: params.message,
    }))
  );
}
