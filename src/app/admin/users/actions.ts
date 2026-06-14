"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleUserStatus(userId: string, isDisabled: boolean) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");
  
  // Verify admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");

  // Attempt to update is_disabled if the column exists
  const { error } = await supabase
    .from("profiles")
    .update({ is_disabled: isDisabled })
    .eq("id", userId);

  if (error) {
    console.error("Error updating is_disabled, it might not exist:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function deleteUser(userId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");
  
  // Verify admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Forbidden");

  // Note: True deletion of a user from auth.users requires service_role key.
  // Here we delete the profile (which might cascade or at least break login if middleware checks it).
  // Some setups allow deleting from profiles. Let's try.
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
  return { success: true };
}
