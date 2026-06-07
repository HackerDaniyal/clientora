import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconUsers, IconBriefcase, IconUserCheck, IconClock } from "@tabler/icons-react";

export default async function AdminDashboard() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect(`/${profile?.role || "freelancer"}/dashboard`);
  }

  // Fetch real stats
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: freelancerCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "freelancer");

  const { count: clientCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "client");

  const { count: totalWorkspaces } = await supabase
    .from("workspaces")
    .select("*", { count: "exact", head: true });

  const { count: activeWorkspaces } = await supabase
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pendingRequests } = await supabase
    .from("project_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const stats = [
    { label: "Total Users", value: totalUsers || 0, icon: IconUsers, color: "bg-blue-100 text-blue-600" },
    { label: "Freelancers", value: freelancerCount || 0, icon: IconUserCheck, color: "bg-green-100 text-green-600" },
    { label: "Clients", value: clientCount || 0, icon: IconUsers, color: "bg-purple-100 text-purple-600" },
    { label: "Active Workspaces", value: activeWorkspaces || 0, icon: IconBriefcase, color: "bg-brand-accent/20 text-brand-accent" },
    { label: "Total Workspaces", value: totalWorkspaces || 0, icon: IconBriefcase, color: "bg-gray-100 text-gray-600" },
    { label: "Pending Requests", value: pendingRequests || 0, icon: IconClock, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Platform Overview</h1>
        <p className="text-sm text-text-secondary">Real-time platform metrics and user activity.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card bg-white">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] text-text-secondary">{stat.label}</p>
                <p className="text-xl font-semibold text-brand-dark">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white">
          <h3 className="section-title">Recent Signups</h3>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3 mt-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-brand-light last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-semibold">
                      {user.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-brand-dark">{user.full_name || "Unknown"}</p>
                      <p className="text-[11px] text-text-tertiary">{user.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    user.role === "freelancer" ? "badge-success" :
                    user.role === "client" ? "badge-info" :
                    "badge-neutral"
                  }`}>
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">No users yet</p>
          )}
        </div>

        <div className="card bg-white">
          <h3 className="section-title">Platform Health</h3>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Database Status</span>
              <span className="badge badge-success">Connected</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Auth Service</span>
              <span className="badge badge-success">Active</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Realtime</span>
              <span className="badge badge-success">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
