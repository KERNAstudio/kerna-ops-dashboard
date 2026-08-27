import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientSession } from "./client-session";
import type { PermissionCode } from "./permissions";

export type StaffActor = {
  type: "staff";
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: Set<PermissionCode>;
};

export type ClientActor = {
  type: "client";
  clientUserId: string;
  clientId: string;
  email: string;
};

export type Actor = StaffActor | ClientActor;

async function loadStaffActor(authUserId: string): Promise<StaffActor | null> {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("id, name, email, active")
    .eq("id", authUserId)
    .maybeSingle();
  if (!user || !user.active) return null;

  const { data: userRoles } = await admin
    .from("user_roles")
    .select("roles(name, role_permissions(permissions(code)))")
    .eq("user_id", authUserId);

  const roles: string[] = [];
  const permissions = new Set<PermissionCode>();
  for (const row of userRoles ?? []) {
    const role = row.roles;
    if (!role) continue;
    roles.push(role.name);
    for (const rp of role.role_permissions ?? []) {
      const code = rp.permissions?.code;
      if (code) permissions.add(code as PermissionCode);
    }
  }

  return { type: "staff", id: user.id, name: user.name, email: user.email, roles, permissions };
}

async function loadClientActor(): Promise<ClientActor | null> {
  const session = await getClientSession();
  if (!session) return null;

  const admin = createAdminClient();
  const { data: clientUser } = await admin
    .from("client_users")
    .select("id, client_id, email, active")
    .eq("id", session.clientUserId)
    .maybeSingle();
  if (!clientUser || !clientUser.active || clientUser.client_id !== session.clientId) {
    return null;
  }

  return { type: "client", clientUserId: clientUser.id, clientId: clientUser.client_id, email: clientUser.email };
}

// Step 1 of the route guard order (§3): who is making this request, if anyone.
// Staff go through Supabase Auth; clients through the custom cookie session — see
// supabase/migrations/00000000000008_rbac.sql for why these are two separate systems.
export async function getActor(): Promise<Actor | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (authUser) return loadStaffActor(authUser.id);
  return loadClientActor();
}
