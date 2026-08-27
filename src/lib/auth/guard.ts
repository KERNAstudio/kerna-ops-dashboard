import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActor, type Actor, type StaffActor } from "./session";
import type { PermissionCode } from "./permissions";

export type GuardOptions = {
  /** Step 5: action-level permission required (mutations mainly). Bypassed for the project's POC — see resolveProjectAccess. */
  permission?: PermissionCode;
  /** Step 3: the project this request is scoped to, if any. */
  projectId?: string;
  /** Step 4: the module this request is scoped to, if any. */
  moduleId?: string;
  /** Set false to reject client actors outright (staff-only routes). Default true. */
  allowClient?: boolean;
  /** Step 2: staff must hold one of these roles. Omit to allow any authenticated staff role. */
  allowStaffRoles?: string[];
};

type ProjectAccess = "none" | "broad" | "poc" | "assigned";

// §3 POC row: "Full assigned project / Everything on that project" — this is a per-project
// override that beats the actor's base role, so a Sales rep who is POC on a project gets
// PAYMENT_EDIT etc. there even though the Sales role itself doesn't carry that permission
// globally. "broad" (founder/management) and "poc" both short-circuit every later check;
// "assigned" (dev/design/research) only carries through to the specific module they're on.
async function resolveProjectAccess(actor: StaffActor, projectId: string): Promise<ProjectAccess> {
  if (actor.roles.includes("founder") || actor.roles.includes("management")) return "broad";

  const admin = createAdminClient();
  const { data: project } = await admin
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return "none";

  const { data: client } = await admin
    .from("clients")
    .select("poc_user_id")
    .eq("id", project.client_id)
    .maybeSingle();
  if (client?.poc_user_id === actor.id) return "poc";

  if (actor.roles.some((r) => ["dev", "design", "research"].includes(r))) {
    const { count } = await admin
      .from("module_assignments")
      .select("project_modules!inner(project_id)", { count: "exact", head: true })
      .eq("project_modules.project_id", projectId)
      .eq("user_id", actor.id);
    if ((count ?? 0) > 0) return "assigned";
  }

  return "none";
}

async function staffHasModuleScope(actor: StaffActor, access: ProjectAccess, moduleId: string): Promise<boolean> {
  if (access === "broad" || access === "poc") return true;
  if (access !== "assigned") return false;

  const admin = createAdminClient();
  const { data: assignment } = await admin
    .from("module_assignments")
    .select("id")
    .eq("module_id", moduleId)
    .eq("user_id", actor.id)
    .maybeSingle();
  return !!assignment;
}

// The route guard order, kerna-master-reference.md §3:
// (1) auth -> /login  (2) role -> 403  (3) project scope -> 403  (4) module scope -> 403
// (5) action-level permission on mutations -> 403.
// Call this at the top of every server component / route handler / server action that
// touches a project, module, or permission-gated action — never hardcode the check inline.
export async function guard(options: GuardOptions = {}): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login"); // (1)

  if (actor.type === "client") {
    if (options.allowClient === false) redirect("/403"); // (2)
    if (options.projectId) {
      const admin = createAdminClient();
      const { data: project } = await admin
        .from("projects")
        .select("client_id")
        .eq("id", options.projectId)
        .maybeSingle();
      if (!project || project.client_id !== actor.clientId) redirect("/403"); // (3)
    }
    // Clients have no module-scope or permission-code system: their edits are limited to
    // approval actions on the approvals table, checked at the point of that mutation.
    return actor;
  }

  if (options.allowStaffRoles && !options.allowStaffRoles.some((r) => actor.roles.includes(r))) {
    redirect("/403"); // (2)
  }

  let access: ProjectAccess = "broad"; // no projectId given: nothing to scope, permission check below still applies
  if (options.projectId) {
    access = await resolveProjectAccess(actor, options.projectId);
    if (access === "none") redirect("/403"); // (3)
  }

  if (options.moduleId && !(await staffHasModuleScope(actor, access, options.moduleId))) {
    redirect("/403"); // (4)
  }

  const pocOverride = options.projectId !== undefined && (access === "broad" || access === "poc");
  if (options.permission && !pocOverride && !actor.permissions.has(options.permission)) {
    redirect("/403"); // (5)
  }

  return actor;
}
