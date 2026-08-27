import Link from "next/link";
import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/projects/constants";
import type { Tables } from "@/lib/supabase/database.types";

// §3 view scope: Founder/Management see everything; Sales sees only POC'd projects;
// Dev/Design/Research see only projects they have a module assignment on (none yet in
// this phase — modules are what "Project Assignment" creates). A client actor only ever
// reaches this list when they have multiple projects (§4 client routing rule) — scoped to
// their own client_id.
export default async function ProjectsPage() {
  const actor = await guard();
  if (actor.type !== "staff" && actor.type !== "client") return null;

  const admin = createAdminClient();

  if (actor.type === "client") {
    const { data: projects } = await admin
      .from("projects")
      .select("*, clients(company_name)")
      .eq("client_id", actor.clientId)
      .order("created_at", { ascending: false });
    return <ProjectsList projects={projects ?? []} />;
  }

  if (!actor.permissions.has("PROJECT_VIEW") && !actor.roles.includes("founder")) redirect("/403");

  let projectIds: string[] | null = null;

  if (!actor.roles.includes("founder") && !actor.roles.includes("management")) {
    if (actor.roles.some((r) => ["dev", "design", "research"].includes(r))) {
      const { data: assigned } = await admin
        .from("module_assignments")
        .select("project_modules(project_id)")
        .eq("user_id", actor.id);
      projectIds = [...new Set((assigned ?? []).map((a) => a.project_modules?.project_id).filter(Boolean))] as string[];
    } else {
      const { data: pocClients } = await admin.from("clients").select("id").eq("poc_user_id", actor.id);
      const { data: pocProjects } = pocClients?.length
        ? await admin.from("projects").select("id").in("client_id", pocClients.map((c) => c.id))
        : { data: [] };
      projectIds = (pocProjects ?? []).map((p) => p.id);
    }
  }

  let query = admin
    .from("projects")
    .select("*, clients(company_name)")
    .order("created_at", { ascending: false });
  if (projectIds !== null) query = query.in("id", projectIds.length ? projectIds : ["00000000-0000-0000-0000-000000000000"]);

  const { data: projects } = await query;
  return <ProjectsList projects={projects ?? []} />;
}

type ProjectRow = Tables<"projects"> & { clients: { company_name: string } | null };

function ProjectsList({ projects }: { projects: ProjectRow[] }) {
  return (
    <div className="max-w-[1180px]">
      <div className="mb-6">
        <h1 className="text-[26px] font-bold tracking-tight">Projects</h1>
        <p className="text-[13px] text-text-secondary">{projects.length} projects</p>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-default)] border border-border-default bg-bg-card">
        <div className="overflow-x-auto">
<table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {["Client", "Type", "Status", "Created", ""].map((h) => (
                <th
                  key={h}
                  className="border-b border-border-default px-4 py-2.5 text-left font-data text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-border-default last:border-0 hover:bg-bg-elevated">
                <td className="px-4 py-3 font-semibold">{p.clients?.company_name ?? "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{p.type}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex h-6 items-center rounded-full border border-border-default bg-bg-elevated px-2.5 text-[11.5px] font-medium font-data text-text-secondary">
                    {PROJECT_STATUS_LABEL[p.status as ProjectStatus] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{new Date(p.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/app/projects/${p.id}`} className="text-xs text-text-secondary hover:text-text-primary">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-secondary">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
</div>
      </div>
    </div>
  );
}
