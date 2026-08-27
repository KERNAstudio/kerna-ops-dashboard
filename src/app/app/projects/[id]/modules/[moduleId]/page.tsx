import { guard } from "@/lib/auth/guard";
import { getModuleDetail } from "@/lib/modules/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { ModuleWorkspaceView } from "./ModuleWorkspaceView";

export default async function ModuleWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const { id, moduleId } = await params;
  const actor = await guard({ projectId: id, moduleId, permission: "MODULE_VIEW" });
  if (actor.type !== "staff") return null;

  const detail = await getModuleDetail(moduleId);

  // §2 step 7: "everyone can VIEW, only assigned department can EDIT" — edit is specific
  // to this module's assignees (plus Founder/POC), not just holding the role-level
  // MODULE_EDIT code (a dev assigned to a different module shouldn't edit this one).
  // isPoc is computed unconditionally — the reopen rule (§3) cares whether this actor IS
  // the POC, regardless of whether they also happen to hold the Founder role.
  const isFounder = actor.roles.includes("founder");
  const admin = createAdminClient();
  const { data: project } = await admin.from("projects").select("client_id").eq("id", id).maybeSingle();
  const { data: client } = project
    ? await admin.from("clients").select("poc_user_id").eq("id", project.client_id).maybeSingle()
    : { data: null };
  const isPoc = client?.poc_user_id === actor.id;
  const canEdit = isFounder || isPoc || detail.assignees.some((a) => a.user_id === actor.id);

  return <ModuleWorkspaceView projectId={id} detail={detail} canEdit={canEdit} isPoc={isPoc} />;
}
