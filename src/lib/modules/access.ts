import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";

export type ModuleDetail = {
  module: Tables<"project_modules">;
  versions: Tables<"module_versions">[];
  latestVersion: Tables<"module_versions"> | null;
  latestApproval: Tables<"approvals"> | null;
  assignees: { user_id: string; name: string }[];
};

export async function getModuleDetail(moduleId: string): Promise<ModuleDetail> {
  const admin = createAdminClient();

  const { data: module } = await admin.from("project_modules").select("*").eq("id", moduleId).maybeSingle();
  if (!module) redirect("/app/projects");

  const { data: versions } = await admin
    .from("module_versions")
    .select("*")
    .eq("module_id", moduleId)
    .order("version_number", { ascending: false });

  const latestVersion = versions?.[0] ?? null;

  const { data: latestApproval } = latestVersion
    ? await admin
        .from("approvals")
        .select("*")
        .eq("module_version_id", latestVersion.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: assignmentRows } = await admin
    .from("module_assignments")
    .select("user_id, users(name)")
    .eq("module_id", moduleId);
  const assignees = (assignmentRows ?? []).map((a) => ({ user_id: a.user_id, name: a.users?.name ?? "—" }));

  return { module, versions: versions ?? [], latestVersion, latestApproval, assignees };
}
