import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminWorkspaces() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect(`/${profile?.role || "freelancer"}/dashboard`);

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select(`
      id, name, status, project_type, created_at,
      client:profiles!workspaces_client_id_fkey(full_name),
      freelancer:profiles!workspaces_freelancer_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  const profileName = (value: unknown): string => {
    if (!value) return "—";
    if (Array.isArray(value)) return (value[0] as { full_name?: string })?.full_name || "—";
    return (value as { full_name?: string }).full_name || "—";
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">All Workspaces</h1>
        <p className="text-sm text-text-secondary">Every project workspace on the platform.</p>
      </header>

      <div className="space-y-3">
        {(workspaces || []).map((ws) => (
          <div key={ws.id} className="card bg-white flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium text-brand-dark">{ws.name}</p>
              <p className="text-[12px] text-text-tertiary">
                {profileName(ws.client)} · {profileName(ws.freelancer)} ·{" "}
                {new Date(ws.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="badge badge-accent capitalize">{ws.status}</span>
              <Link href={`/workspace/${ws.id}`} className="pill-btn-outline text-[12px] px-3 py-1.5">
                Open
              </Link>
            </div>
          </div>
        ))}
        {(!workspaces || workspaces.length === 0) && (
          <p className="text-center py-8 text-text-secondary card">No workspaces yet.</p>
        )}
      </div>
    </div>
  );
}
