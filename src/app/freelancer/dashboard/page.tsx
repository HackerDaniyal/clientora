import React from "react";
import Link from "next/link";
import { IconPlus, IconUsers, IconHourglass, IconBriefcase, IconArrowRight } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FreelancerDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [
    { data: linkedClients },
    { data: workspaces },
    { data: pendingRequests },
  ] = await Promise.all([
    supabase
      .from("client_freelancer_links")
      .select(
        `
      *,
      client:profiles!client_freelancer_links_client_id_fkey(full_name, avatar_url),
      referral_code:referral_codes(code)
    `
      )
      .eq("freelancer_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("workspaces")
      .select(
        `
      *,
      client:profiles!workspaces_client_id_fkey(full_name)
    `
      )
      .eq("freelancer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_requests")
      .select("id")
      .eq("freelancer_id", user.id)
      .eq("status", "pending"),
  ]);

  const totalClients = linkedClients?.length || 0;
  const activeProjects = workspaces?.filter((w) => w.status === "active").length || 0;
  const pendingCount = pendingRequests?.length || 0;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-brand-dark">Freelancer Dashboard</h1>
          <p className="text-sm text-text-secondary">Welcome back, here&apos;s what&apos;s happening today.</p>
        </div>
        <Link href="/freelancer/referrals" className="pill-btn">
          <IconPlus size={16} stroke={2} />
          Generate Referral Code
        </Link>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconUsers size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Total Clients
            </span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{totalClients}</p>
        </div>
        <Link
          href="/freelancer/requests?status=pending"
          className="card hover:border-brand-accent transition-colors block"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconHourglass size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Pending Requests
            </span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{pendingCount}</p>
          {pendingCount > 0 && (
            <p className="text-[11px] text-brand-mid mt-2 font-medium">Review requests →</p>
          )}
        </Link>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconBriefcase size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Active Projects
            </span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{activeProjects}</p>
        </div>
      </section>

      {pendingCount > 0 && (
        <section className="card border-brand-accent/30 bg-brand-surface">
          <div className="flex justify-between items-center">
            <p className="text-[13px] text-brand-dark">
              You have <strong>{pendingCount}</strong> pending project request
              {pendingCount === 1 ? "" : "s"} waiting for review.
            </p>
            <Link href="/freelancer/requests?status=pending" className="pill-btn text-[12px]">
              View Pending
            </Link>
          </div>
        </section>
      )}

      {activeProjects > 0 && (
        <section className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title mb-0 border-0 pb-0">Active Workspaces</h3>
            <Link href="/freelancer/requests" className="text-[12px] text-brand-mid hover:underline font-medium">
              View All Requests →
            </Link>
          </div>
          <div className="space-y-3">
            {workspaces?.slice(0, 5).map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspace/${workspace.id}`}
                className="flex items-center gap-4 py-3 border-b border-brand-light last:border-0 hover:bg-brand-surface rounded-lg px-3 -mx-3 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-accent/20 flex items-center justify-center text-brand-accent">
                  <IconBriefcase size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-brand-dark">{workspace.name}</p>
                  <p className="text-[11px] text-text-tertiary">
                    {workspace.client?.full_name || "Unknown Client"} ·{" "}
                    {workspace.project_type || "Project"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      workspace.status === "active"
                        ? "badge-success"
                        : workspace.status === "review"
                          ? "badge-info"
                          : workspace.status === "completed"
                            ? "badge-purple"
                            : "badge-neutral"
                    }`}
                  >
                    {workspace.status}
                  </span>
                  <IconArrowRight
                    size={16}
                    className="text-text-tertiary group-hover:text-brand-accent transition-colors"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {totalClients > 0 && (
        <section className="card">
          <h3 className="section-title">Your Clients</h3>
          <div className="space-y-3 mt-4">
            {linkedClients?.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-4 py-3 border-b border-brand-light last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-brand-light/30 flex items-center justify-center text-brand-dark font-medium">
                  {link.client?.full_name?.charAt(0) || "C"}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-brand-dark">
                    {link.client?.full_name || "Unknown Client"}
                  </p>
                  <p className="text-[11px] text-text-tertiary">
                    Linked on {new Date(link.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="badge badge-accent">Active</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalClients === 0 && (
        <section className="card text-center py-12 border-dashed border-2">
          <IconUsers size={48} stroke={1.5} className="mx-auto text-text-tertiary mb-3 opacity-20" />
          <p className="text-text-secondary mb-2">No clients yet. Share your referral code to get started!</p>
          <Link href="/freelancer/referrals" className="text-brand-dark underline text-[13px] font-medium">
            Go to Referrals →
          </Link>
        </section>
      )}
    </div>
  );
}
