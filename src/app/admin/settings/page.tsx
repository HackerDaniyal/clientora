import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";
import { getPlatformSettings } from "./actions";

export default async function AdminSettings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect(`/${profile?.role || "freelancer"}/dashboard`);

  const profileData = {
    id: user.id,
    full_name: profile?.full_name || null,
    bio: profile?.bio || null,
    avatar_url: profile?.avatar_url || null,
    phone: profile?.phone || null,
    location: profile?.location || null,
    website: profile?.website || null,
    skills: profile?.skills || null,
    role: profile?.role || "admin",
    email: profile?.email || user.email || "",
    created_at: profile?.created_at || user.created_at || "",
  };

  const platformSettings = await getPlatformSettings();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Platform Settings</h1>
        <p className="text-sm text-text-secondary">Manage platform configuration and your admin profile.</p>
      </header>

      <SettingsClient profileData={profileData} initialSettings={platformSettings} />
    </div>
  );
}
