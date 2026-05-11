import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconBriefcase, IconArrowRight, IconUsers, IconChartBar } from "@tabler/icons-react";

export default async function FreelancerWorkspaces() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch all workspaces for this freelancer
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select(`
      *,
      client:profiles!workspaces_client_id_fkey(full_name, email)
    `)
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Workspaces</h1>
        <p className="text-sm text-text-secondary">Manage all your active and completed project workspaces.</p>
      </header>

      {workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.id}`}
              className="card bg-white hover:shadow-lg transition-all border-2 border-transparent hover:border-brand-accent group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-brand-accent/20 rounded-lg flex items-center justify-center">
                  <IconBriefcase size={24} className="text-brand-accent" />
                </div>
                <span className={`badge text-[11px] ${
                  workspace.status === 'active' ? 'bg-green-100 text-green-700' :
                  workspace.status === 'review' ? 'bg-blue-100 text-blue-700' :
                  workspace.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {workspace.status}
                </span>
              </div>

              <h3 className="text-[16px] font-medium text-brand-dark mb-2 group-hover:text-brand-accent transition-colors">
                {workspace.name}
              </h3>
              
              <p className="text-[12px] text-text-tertiary mb-4">
                {workspace.project_type || 'Project'}
              </p>

              <div className="space-y-2 pt-4 border-t border-brand-light/30">
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <IconUsers size={14} />
                  <span>{workspace.client?.full_name || 'Client'}</span>
                </div>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <IconChartBar size={14} />
                  <span>{workspace.pipeline_stage || 'In Progress'}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[12px] text-text-tertiary">
                <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
                <IconArrowRight size={16} className="text-text-tertiary group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 border-dashed border-2">
          <IconBriefcase size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">No workspaces yet</p>
          <p className="text-text-tertiary text-sm mt-2 mb-6">Accept a project request to create your first workspace.</p>
          <Link href="/freelancer/requests" className="pill-btn inline-flex items-center gap-2">
            View Requests
            <IconArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
