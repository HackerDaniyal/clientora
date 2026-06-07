import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconBriefcase, IconArrowRight, IconPlus, IconFileText, IconMessageCircle, IconFileInvoice, IconFolderOpen } from "@tabler/icons-react";

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

  // Fetch workspaces
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .eq('client_id', user?.id)
    .order('created_at', { ascending: false});

  const hasWorkspace = workspaces && workspaces.length > 0;
  const activeWorkspace = workspaces?.find(w => w.status === 'active');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">My Dashboard</h1>
        <p className="text-sm text-text-secondary">Track your project progress and documents.</p>
      </header>

      <div className="space-y-6">
        {/* Active Workspace */}
        {activeWorkspace && (
          <Link
            href={`/workspace/${activeWorkspace.id}`}
            className="card bg-brand-dark text-white hover:shadow-xl transition-all block group"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[11px] opacity-70">Active Workspace</span>
                <h2 className="text-2xl font-semibold mt-1">{activeWorkspace.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-accent">{activeWorkspace.status}</span>
                <IconArrowRight size={20} className="text-brand-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
            
            <p className="text-[12px] opacity-60 mb-4">
              {activeWorkspace.project_type || 'Project'} · Created {new Date(activeWorkspace.created_at).toLocaleDateString()}
            </p>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-[9px] opacity-60">Stage</p>
                <p className="text-[13px] font-medium">{activeWorkspace.pipeline_stage || 'In Progress'}</p>
              </div>
              <div>
                <p className="text-[9px] opacity-60">Tasks</p>
                <p className="text-[13px] font-medium">View in workspace →</p>
              </div>
              <div>
                <p className="text-[9px] opacity-60">Messages</p>
                <p className="text-[13px] font-medium">Chat with team →</p>
              </div>
            </div>
          </Link>
        )}

        {/* All Workspaces */}
        {workspaces && workspaces.length > 1 && (
          <div className="card">
            <h3 className="section-title">All Projects</h3>
            <div className="space-y-3 mt-4">
              {workspaces.map((workspace) => (
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
                      {workspace.project_type || 'Project'} · {new Date(workspace.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge ${
                    workspace.status === 'active' ? 'badge-success' :
                    workspace.status === 'review' ? 'badge-info' :
                    workspace.status === 'completed' ? 'badge-purple' :
                    'badge-neutral'
                  }`}>
                    {workspace.status}
                  </span>
                  <IconArrowRight size={16} className="text-text-tertiary group-hover:text-brand-accent transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card">
          <h3 className="section-title">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/client/setup-project" className="flex flex-col items-center gap-3 p-4 bg-brand-surface rounded-xl hover:bg-brand-tint/40 hover:border-brand-accent/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-brand-tint flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                <IconFileText size={20} className="text-brand-mid" />
              </div>
              <span className="text-[12px] font-medium text-text-secondary">New Project Request</span>
            </Link>
            {activeWorkspace && (
              <Link href={`/workspace/${activeWorkspace.id}`} className="flex flex-col items-center gap-3 p-4 bg-brand-surface rounded-xl hover:bg-brand-tint/40 hover:border-brand-accent/30 border border-transparent transition-all group">
                <div className="w-10 h-10 rounded-lg bg-brand-tint flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                  <IconMessageCircle size={20} className="text-brand-mid" />
                </div>
                <span className="text-[12px] font-medium text-text-secondary">Open Workspace</span>
              </Link>
            )}
            <Link href="/client/documents" className="flex flex-col items-center gap-3 p-4 bg-brand-surface rounded-xl hover:bg-brand-tint/40 hover:border-brand-accent/30 border border-transparent transition-all group">
              <div className="w-10 h-10 rounded-lg bg-brand-tint flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                <IconFileInvoice size={20} className="text-brand-mid" />
              </div>
              <span className="text-[12px] font-medium text-text-secondary">View Invoices</span>
            </Link>
            {activeWorkspace ? (
              <Link href={`/workspace/${activeWorkspace.id}?tab=assets`} className="flex flex-col items-center gap-3 p-4 bg-brand-surface rounded-xl hover:bg-brand-tint/40 hover:border-brand-accent/30 border border-transparent transition-all group">
                <div className="w-10 h-10 rounded-lg bg-brand-tint flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                  <IconFolderOpen size={20} className="text-brand-mid" />
                </div>
                <span className="text-[12px] font-medium text-text-secondary">View Assets</span>
              </Link>
            ) : (
              <Link href="/client/setup-project" className="flex flex-col items-center gap-3 p-4 bg-brand-surface rounded-xl hover:bg-brand-tint/40 hover:border-brand-accent/30 border border-transparent transition-all group">
                <div className="w-10 h-10 rounded-lg bg-brand-tint flex items-center justify-center group-hover:bg-brand-accent/20 transition-colors">
                  <IconFolderOpen size={20} className="text-brand-mid" />
                </div>
                <span className="text-[12px] font-medium text-text-secondary">Upload Assets</span>
              </Link>
            )}
          </div>
        </div>

        {/* No workspace yet */}
        {!hasWorkspace && (
          <div className="card text-center py-12 border-dashed border-2">
            <IconBriefcase size={48} stroke={1.5} className="mx-auto text-text-tertiary mb-3 opacity-20" />
            <p className="text-text-secondary mb-2">No active projects yet.</p>
            <p className="text-text-tertiary text-sm mb-4">Submit a project request to get started!</p>
            <Link href="/client/setup-project" className="pill-btn inline-flex items-center gap-2">
              <IconPlus size={16} />
              Create Project Request
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
