import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconChecklist, IconCircleCheck, IconClock, IconArrowRight, IconInbox } from "@tabler/icons-react";

export default async function ClientTodos() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch client's workspaces
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id")
    .eq("client_id", user.id);

  const workspaceIds = workspaces?.map(w => w.id) || [];

  // Fetch tasks from client's workspaces
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      workspace:workspaces(name),
      assignee:profiles(full_name)
    `)
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false });

  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
  const pendingTasks = tasks?.filter(t => t.status !== 'completed') || [];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">My Tasks</h1>
        <p className="text-sm text-text-secondary">Track tasks across all your projects.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-white text-center">
          <p className="text-[11px] text-text-secondary mb-1">Total</p>
          <p className="text-[24px] font-semibold text-brand-dark">{tasks?.length || 0}</p>
        </div>
        <div className="card bg-white text-center">
          <p className="text-[11px] text-text-secondary mb-1">Pending</p>
          <p className="text-[24px] font-semibold text-blue-600">{pendingTasks.length}</p>
        </div>
        <div className="card bg-white text-center">
          <p className="text-[11px] text-text-secondary mb-1">Completed</p>
          <p className="text-[24px] font-semibold text-green-600">{completedTasks.length}</p>
        </div>
      </div>

      {tasks && tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {task.status === 'completed' ? <IconCircleCheck size={20} /> : <IconClock size={20} />}
                </div>
                <div className="flex-1">
                  <p className={`text-[14px] font-medium ${task.status === 'completed' ? 'line-through text-text-tertiary' : 'text-brand-dark'}`}>
                    {task.title}
                  </p>
                  <p className="text-[12px] text-text-tertiary">
                    {task.workspace?.name} · {task.assignee?.full_name || 'Unassigned'}
                  </p>
                </div>
                <span className={`badge ${
                  task.priority === 'high' ? 'badge-danger' :
                  task.priority === 'medium' ? 'badge-warning' :
                  'badge-success'
                }`}>
                  {task.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 border-dashed border-2">
          <IconChecklist size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">No tasks yet</p>
          <p className="text-text-tertiary text-sm mt-2 mb-6">Your freelancer will add tasks to your workspace.</p>
          <Link href="/client/workspace" className="pill-btn inline-flex items-center gap-2">
            View Workspaces
            <IconArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
