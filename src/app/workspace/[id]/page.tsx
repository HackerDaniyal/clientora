import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceClient from "./workspace-client";

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch workspace
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select(`
      *,
      profiles:freelancer_id(full_name, email),
      client_profiles:client_id(full_name, email)
    `)
    .eq("id", params.id)
    .single();

  if (workspaceError || !workspace) {
    redirect("/freelancer/dashboard?error=Workspace not found");
  }

  // Verify user has access
  const hasAccess = 
    workspace.freelancer_id === user.id || 
    workspace.client_id === user.id;

  if (!hasAccess) {
    redirect("/freelancer/dashboard?error=Access denied");
  }

  // Fetch tasks
  const { data: tasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:assigned_to(full_name),
      creator:created_by(full_name)
    `)
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false });

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      sender:sender_id(full_name, avatar_url)
    `)
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: true })
    .limit(100);

  // Fetch members
  const { data: members } = await supabase
    .from("workspace_members")
    .select(`
      *,
      profiles:user_id(full_name, email, avatar_url)
    `)
    .eq("workspace_id", params.id);

  // Fetch activity log
  const { data: activityLog } = await supabase
    .from("activity_log")
    .select(`
      *,
      user:profiles(full_name, avatar_url)
    `)
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Fetch documents
  const { data: documents } = await supabase
    .from("workspace_documents")
    .select('*')
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false });

  // Determine user role in workspace
  const isFreelancer = workspace.freelancer_id === user.id;
  const memberRole = isFreelancer ? "editor" : "viewer";

  return (
    <WorkspaceClient
      workspace={workspace}
      tasks={tasks || []}
      messages={messages || []}
      members={members || []}
      activityLog={activityLog || []}
      documents={documents || []}
      userRole={memberRole}
      workspaceId={params.id}
    />
  );
}
