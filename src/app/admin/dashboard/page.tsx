import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./admin-dashboard-client";

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



  // Prepare chart data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  const signupsData: { date: string; count: number }[] = [];
  const now = new Date();
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const dayStr = d.toISOString().split("T")[0];
    const count = recentProfiles?.filter((p) => p.created_at.startsWith(dayStr)).length || 0;
    signupsData.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count,
    });
  }

  const { data: requests } = await supabase
    .from("project_requests")
    .select("status");

  const reqStatusCounts = (requests || []).reduce((acc: any, req) => {
    acc[req.status] = (acc[req.status] || 0) + 1;
    return acc;
  }, {});

  const requestsData = [
    { status: "accepted", count: reqStatusCounts["accepted"] || 0, color: "var(--color-status-success)" },
    { status: "pending", count: reqStatusCounts["pending"] || 0, color: "var(--color-status-warning)" },
    { status: "rejected", count: reqStatusCounts["rejected"] || 0, color: "var(--color-status-danger)" },
    { status: "info_needed", count: reqStatusCounts["info_needed"] || 0, color: "var(--color-status-pending)" }, // Assuming pending color
  ].filter(d => d.count > 0 || d.status === "accepted" || d.status === "pending" || d.status === "rejected");


  const initialStats = {
    totalUsers: totalUsers || 0,
    freelancerCount: freelancerCount || 0,
    clientCount: clientCount || 0,
    totalWorkspaces: totalWorkspaces || 0,
    activeWorkspaces: activeWorkspaces || 0,
    pendingRequests: pendingRequests || 0,
  };

  return (
    <AdminDashboardClient
      initialStats={initialStats}
      initialRecentUsers={recentUsers || []}
      initialSignupsData={signupsData}
      initialRequestsData={requestsData}
    />
  );
}
