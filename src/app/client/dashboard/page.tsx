import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ClientDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: link } = await supabase
    .from('client_freelancer_links')
    .select('*')
    .eq('client_id', user?.id)
    .single();

  if (!link) {
    redirect('/client/link');
  }

  // 2. Check if client has a project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', user?.id)
    .single();

  if (!project) {
    redirect('/client/setup-project');
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">My Dashboard</h1>
        <p className="text-sm text-text-secondary">Track your project progress and documents.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-brand-dark text-white">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[11px] opacity-70">Active Project</span>
            <span className="badge bg-brand-accent/20 text-brand-accent text-[9px]">Active</span>
          </div>
          <h2 className="text-lg font-medium mb-1">Brand Redesign</h2>
          <p className="text-[10px] opacity-60 mb-4">Started 12 Apr 2025 · Freelancer: Ahmad Farooq</p>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-[9px] opacity-70 mb-1">
                <span>Progress</span>
                <span>65%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-pill overflow-hidden">
                <div className="h-full bg-brand-accent" style={{ width: "65%" }} />
              </div>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-[9px] opacity-60">Tasks</p>
                <p className="text-[13px] font-medium">13/20</p>
              </div>
              <div>
                <p className="text-[9px] opacity-60">Next Deadline</p>
                <p className="text-[13px] font-medium">30 Jun</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "View Proposal", icon: "📄" },
              { label: "Pay Invoice", icon: "💰" },
              { label: "Chat Support", icon: "💬" },
              { label: "Upload Assets", icon: "📁" },
            ].map((action) => (
              <button key={action.label} className="flex flex-col items-center gap-2 p-4 bg-brand-surface rounded-medium hover:bg-brand-light/30 transition-colors">
                <span className="text-xl">{action.icon}</span>
                <span className="text-[11px] font-medium text-text-secondary">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
