import Link from "next/link";
import { guard } from "@/lib/auth/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { logout } from "@/app/logout/actions";
import { NotificationsBell } from "./NotificationsBell";
import { ActionRequiredBell } from "./ActionRequiredBell";
import { getActionRequiredItems } from "@/lib/action-required";

// Persistent shell (§7): sidebar (role-filtered nav) + top bar. Role filtering happens here,
// not in routing (§4) — every route is still guard()-checked independently on top of this.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await guard();

  const displayName = actor.type === "staff" ? actor.name : actor.email;
  const initials = displayName.slice(0, 2).toUpperCase();
  const canViewLeads = actor.type === "staff" && actor.permissions.has("LEADS_VIEW");
  const canViewQuotations = actor.type === "staff" && actor.permissions.has("QUOTATION_CREATE");
  const canViewProjects = actor.type === "staff" && actor.permissions.has("PROJECT_VIEW");
  const canViewEscalations =
    actor.type === "staff" && (actor.roles.includes("founder") || actor.roles.includes("management"));

  let canViewGlobalVault = actor.type === "staff" && actor.roles.includes("founder");
  if (actor.type === "staff" && !canViewGlobalVault) {
    const { count } = await createAdminClient()
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("poc_user_id", actor.id);
    canViewGlobalVault = (count ?? 0) > 0;
  }

  const { data: notifications } =
    actor.type === "staff"
      ? await createAdminClient()
          .from("notifications")
          .select("id, type, message, severity, read, created_at")
          .eq("user_id", actor.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: [] };

  const actionRequiredItems = actor.type === "staff" ? await getActionRequiredItems(actor) : [];

  return (
    <div className="flex h-screen">
      <aside className="flex w-[230px] flex-none flex-col border-r border-border-default bg-bg-card">
        <div className="border-b border-border-default p-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 flex-none rounded-[7px] bg-gradient-to-br from-accent-primary to-accent-hover" />
            <span className="text-sm font-extrabold tracking-wider">KERNA</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5">
          <p className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-medium uppercase tracking-wider text-text-secondary opacity-70">
            General
          </p>
          <Link
            href="/app/dashboard"
            className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
          >
            Dashboard
          </Link>

          {(canViewLeads || canViewQuotations) && (
            <>
              <p className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-medium uppercase tracking-wider text-text-secondary opacity-70">
                Pipeline
              </p>
              {canViewLeads && (
                <Link
                  href="/app/leads"
                  className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Leads
                </Link>
              )}
              {canViewQuotations && (
                <Link
                  href="/app/quotations"
                  className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Quotations
                </Link>
              )}
              {canViewProjects && (
                <Link
                  href="/app/projects"
                  className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Projects
                </Link>
              )}
            </>
          )}

          {(canViewEscalations || canViewGlobalVault) && (
            <>
              <p className="px-2.5 pb-1.5 pt-3.5 text-[10.5px] font-medium uppercase tracking-wider text-text-secondary opacity-70">
                Governance
              </p>
              {canViewEscalations && (
                <Link
                  href="/app/escalations"
                  className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  Escalations
                </Link>
              )}
              {canViewGlobalVault && (
                <>
                  <Link
                    href="/app/vault"
                    className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  >
                    Vault
                  </Link>
                  <Link
                    href="/app/credentials"
                    className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                  >
                    Credentials
                  </Link>
                </>
              )}
              {actor.type === "staff" && actor.roles.includes("founder") && (
                <Link
                  href="/app/settings/system"
                  className="mb-px flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                >
                  System Settings
                </Link>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-border-default p-3">
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg border border-border-default bg-transparent p-2 text-xs text-text-secondary hover:bg-bg-elevated"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[60px] flex-none items-center justify-between gap-4 border-b border-border-default px-6">
          {actor.type === "staff" ? (
            <form action="/app/search" className="max-w-[360px] flex-1">
              <input
                name="q"
                placeholder="Search clients, projects, leads…"
                className="w-full rounded-lg border border-border-default bg-bg-card px-3 py-2 text-[13px] text-text-secondary outline-none focus:border-accent-primary"
              />
            </form>
          ) : (
            <span className="text-sm text-text-secondary">client</span>
          )}
          <div className="flex items-center gap-3">
            {actor.type === "staff" && <ActionRequiredBell items={actionRequiredItems} />}
            {actor.type === "staff" && <NotificationsBell notifications={notifications ?? []} />}
            {actor.type === "staff" ? (
              <Link
                href="/app/settings/profile"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold font-data text-accent-primary hover:opacity-80"
                aria-label="Profile"
              >
                {initials}
              </Link>
            ) : (
              <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-soft text-[12.5px] font-bold font-data text-accent-primary">
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-10 py-6">{children}</main>
      </div>
    </div>
  );
}
