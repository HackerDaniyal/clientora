import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRole, type AppRole } from "./role";

export async function getSessionRole(
  supabase: SupabaseClient,
  user: User
): Promise<AppRole | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const dbRole = normalizeRole(profile?.role);
  const metaRole = normalizeRole(user.user_metadata?.role as string | undefined);

  // Critical Security Fix: Never trust user_metadata for admin rights
  return dbRole || (metaRole === 'admin' ? null : metaRole);
}
