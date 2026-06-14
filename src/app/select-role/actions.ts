"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { dashboardPath, normalizeRole } from "@/lib/auth/role";

export async function updateRole(prevState: any, formData: FormData) {
  const supabase = createClient();
  const role = normalizeRole(formData.get("role") as string);

  if (!role || (role !== "client" && role !== "freelancer")) {
    return { error: "Please select a valid role." };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated. Please sign in again." };
  }

  // Update profile role and set onboarding_completed to true
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      role, 
      onboarding_completed: true 
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Failed to update role:", updateError);
    return { error: "Failed to update role. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect(dashboardPath(role));
}
