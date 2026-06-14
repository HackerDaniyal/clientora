import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UsersClient from "./users-client";

export default async function AdminUsers() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect(`/${profile?.role || "freelancer"}/dashboard`);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at, avatar_url, is_disabled")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">User Management</h1>
        <p className="text-sm text-text-secondary">Search, filter, and manage platform users.</p>
      </header>

      <UsersClient initialUsers={users || []} />
    </div>
  );
}
