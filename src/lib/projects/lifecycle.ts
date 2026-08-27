import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// The §2 lifecycle chain only ever moves forward, and every transition here is triggered
// by a specific event (payment received, first assignment, first upload, etc.) rather than
// being manually settable — this is the one place all of those transitions happen, shared
// by the payments, modules, and overview actions so the "forward-only, from this exact
// status" guard isn't duplicated per call site.
export async function advanceProjectStatus(
  projectId: string,
  fromStatus: string,
  toStatus: string,
  userId: string | null,
  action: string
) {
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("status").eq("id", projectId).maybeSingle();
  if (project?.status !== fromStatus) return;

  const { data: updated } = await admin
    .from("projects")
    .update({ status: toStatus })
    .eq("id", projectId)
    .select()
    .single();

  await logAudit({
    userId,
    entityType: "project",
    entityId: projectId,
    action,
    previousState: project,
    newState: updated,
  });
}
