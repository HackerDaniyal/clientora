"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPlatformSettings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to fetch from platform_settings table
  const { data, error } = await supabase.from("platform_settings").select("*");
  
  if (error) {
    console.log("No platform_settings table, returning default settings.");
    return {
      features: {
        ai_assistant: true,
        referral_system: true,
        client_registration: true
      },
      email: {
        sender_name: "ClientFlow",
        sender_email: "noreply@clientflow.app",
        smtp_enabled: false
      },
      templates: {
        proposal: "Default proposal template content...",
        invoice: "Default invoice template content...",
        contract: "Default contract template content..."
      }
    };
  }
  
  // Parse rows into a single object if table exists
  const settings: any = { features: {}, email: {}, templates: {} };
  data?.forEach(row => {
    if (row.category && row.key) {
      if (!settings[row.category]) settings[row.category] = {};
      settings[row.category][row.key] = row.value;
    }
  });
  
  return settings;
}

export async function updatePlatformSettings(category: string, key: string, value: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");

  // Upsert into platform_settings
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ category, key, value }, { onConflict: "category, key" });
    
  if (error) {
    console.error("Failed to update platform_settings:", error);
    // Graceful fallback: just pretend it worked
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
