import { redirect } from "next/navigation";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFounderDashboardData } from "@/lib/dashboard/data";
import { FounderCommandCenter } from "./FounderCommandCenter";

// §4: "/app/dashboard  Founder Command Center (tabs: Overview/Risk/Revenue/Activity, one
// route)" — but every actor lands here right after login (see src/app/login/actions.ts),
// so this also implements §4's client routing rule and gives non-Founder staff a minimal
// landing instead of blocking them from the page their login flow always sends them to.
export default async function DashboardPage() {
  const actor = await guard();

  if (actor.type === "client") {
    const admin = createAdminClient();
    const { data: projects } = await admin.from("projects").select("id").eq("client_id", actor.clientId);
    if (projects && projects.length === 1) redirect(`/app/projects/${projects[0].id}`);
    if (projects && projects.length > 1) redirect("/app/projects");
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="text-[26px] font-bold">Welcome</h1>
        <p className="mt-2 text-sm text-text-secondary">You don&apos;t have any active projects yet.</p>
      </div>
    );
  }

  if (actor.roles.includes("founder")) {
    const data = await getFounderDashboardData();
    return <FounderCommandCenter data={data} />;
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-[26px] font-bold">Welcome back, {actor.name}</h1>
      <p className="mt-2 text-sm text-text-secondary">
        {actor.roles.join(", ") || "staff"} — use the sidebar to get to your work.
      </p>
    </div>
  );
}
