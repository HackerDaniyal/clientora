import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileSettingsForm from "@/components/ProfileSettingsForm";

export default async function ClientSettings() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profileData = {
    id: user.id,
    full_name: profile?.full_name || null,
    bio: profile?.bio || null,
    avatar_url: profile?.avatar_url || null,
    phone: profile?.phone || null,
    location: profile?.location || null,
    website: profile?.website || null,
    skills: profile?.skills || null,
    role: profile?.role || "client",
    email: profile?.email || user.email || "",
    created_at: profile?.created_at || user.created_at || "",
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Settings</h1>
        <p className="text-sm text-text-secondary">Manage your profile and account preferences.</p>
      </header>

      <ProfileSettingsForm profile={profileData} />
    </div>
  );
}
