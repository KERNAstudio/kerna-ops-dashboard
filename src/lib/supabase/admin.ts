import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client — bypasses RLS. Server-only, never import from a Client Component.
// Per CLAUDE.md, RBAC is enforced in the app-layer guard() pipeline (src/lib/auth/guard.ts),
// not solely by RLS policies, so guarded server code reads through this client after guard()
// has already authorized the request. RLS stays enabled with no policies as a locked-down
// default for any direct client-side access we haven't explicitly opened up.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
