"use server";

import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyClientPassword } from "@/lib/auth/client-password";
import { createClientSession } from "@/lib/auth/client-session";

export type LoginState = { error: string | null };

// Single /login route (§4 route map) covers both identities: try staff (Supabase Auth)
// first, fall back to the client's custom session. Neither table's email overlaps in
// practice (staff and client accounts are provisioned separately), so this order is safe.
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createServerSupabase();
  const { data: staffAuth, error: staffError } = await supabase.auth.signInWithPassword({ email, password });
  if (!staffError) {
    // Powers the POC Inactivity escalation rule (§5) — last_activity is derived from this.
    await createAdminClient()
      .from("users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", staffAuth.user.id);
    redirect("/app/dashboard");
  }

  const admin = createAdminClient();
  const { data: clientUser } = await admin
    .from("client_users")
    .select("id, client_id, password_hash, active")
    .eq("email", email)
    .maybeSingle();

  if (clientUser?.active && (await verifyClientPassword(password, clientUser.password_hash))) {
    await createClientSession(clientUser.id, clientUser.client_id);
    redirect("/app/dashboard");
  }

  return { error: "Invalid email or password." };
}
