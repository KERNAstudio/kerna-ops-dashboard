"use server";

import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { clearClientSession } from "@/lib/auth/client-session";

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  await clearClientSession();
  redirect("/login");
}
