"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const fullName = (formData.get("full_name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim() || null;
  const website = (formData.get("website") as string)?.trim() || null;
  const skillsRaw = (formData.get("skills") as string)?.trim() || "";
  const skills = skillsRaw ? skillsRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  if (!fullName) throw new Error("Full name is required");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, bio, phone, location, website, skills })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/freelancer/settings");
  revalidatePath("/client/settings");
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) throw new Error("No file selected");

  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) throw new Error("File too large (max 2MB)");

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "0" });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = urlData.publicUrl;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/freelancer/settings");
  revalidatePath("/client/settings");
  revalidatePath("/admin/settings");
  return { success: true, avatarUrl };
}

export async function changePassword(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const newPassword = (formData.get("new_password") as string)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string)?.trim();

  if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters");
  if (newPassword !== confirmPassword) throw new Error("Passwords don't match");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);

  return { success: true };
}
