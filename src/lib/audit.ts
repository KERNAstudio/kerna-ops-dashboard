import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";

// Append-only audit trail (CLAUDE.md non-negotiable rule, §3 Immutable audit). Call this
// from every mutation on a tracked entity. audit_logs has UPDATE/DELETE revoked at the DB
// level (see supabase/migrations/00000000000007_governance.sql) — this is the only writer.
export async function logAudit(params: {
  userId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  previousState?: Json | null;
  newState?: Json | null;
}) {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    user_id: params.userId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    action: params.action,
    previous_state: params.previousState ?? null,
    new_state: params.newState ?? null,
  });
}
