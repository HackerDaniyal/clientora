import React, { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import WorkspaceClient from "./workspace-client";

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const accountRole = profile?.role || "freelancer";
  const dashboardRoute =
    accountRole === "client" ? "/client/dashboard" : "/freelancer/dashboard";

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select(
      `
      *,
      freelancer:profiles!workspaces_freelancer_id_fkey(full_name),
      client:profiles!workspaces_client_id_fkey(full_name)
    `
    )
    .eq("id", params.id)
    .single();

  if (workspaceError || !workspace) {
    redirect(`${dashboardRoute}?error=Workspace not found`);
  }

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", params.id)
    .eq("user_id", user.id);

  const isOwner =
    workspace.freelancer_id === user.id || workspace.client_id === user.id;

  const hasAccess = isOwner || (memberships?.length ?? 0) > 0;

  if (!hasAccess) {
    redirect(`${dashboardRoute}?error=Access denied`);
  }

  const hasEditorMembership =
    memberships?.some((m) => m.role === "editor") ?? false;

  // Workspace owners (freelancer/client) always get editor — never overridden by a viewer membership row
  const memberRole = isOwner || hasEditorMembership ? "editor" : "viewer";

  const isFreelancerOnWorkspace = workspace.freelancer_id === user.id;
  const isClientOnWorkspace = workspace.client_id === user.id;
  const canCreateTasks = isClientOnWorkspace || isFreelancerOnWorkspace || hasEditorMembership;
  const canToggleTasks =
    isFreelancerOnWorkspace || (hasEditorMembership && accountRole !== "client");

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      `
      *,
      assignee:assigned_to(full_name),
      creator:created_by(full_name)
    `
    )
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false });

  const messagesSelect = `
      id,
      workspace_id,
      sender_id,
      content,
      created_at,
      file_url,
      file_name,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
      reads:message_reads(user_id, delivered_at, read_at)
    `;

  let messagesResult = await supabase
    .from("messages")
    .select(messagesSelect)
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: true })
    .limit(100);

  if (messagesResult.error?.message?.includes("message_reads")) {
    messagesResult = await supabase
      .from("messages")
      .select(
        `
      id,
      workspace_id,
      sender_id,
      content,
      created_at,
      file_url,
      file_name,
      sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
    `
      )
      .eq("workspace_id", params.id)
      .order("created_at", { ascending: true })
      .limit(100);
  }

  const messages = messagesResult.data;

  const { data: members } = await supabase
    .from("workspace_members")
    .select(
      `
      *,
      profiles:user_id(full_name, avatar_url)
    `
    )
    .eq("workspace_id", params.id);

  const { data: activityLog } = await supabase
    .from("activity_log")
    .select(
      `
      *,
      user:user_id(full_name, avatar_url)
    `
    )
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: documents } = await supabase
    .from("workspace_documents")
    .select("*")
    .eq("workspace_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-surface flex items-center justify-center">
          Loading workspace...
        </div>
      }
    >
      <WorkspaceClient
        workspace={workspace}
        tasks={tasks || []}
        messages={messages || []}
        members={members || []}
        activityLog={activityLog || []}
        documents={documents || []}
        userRole={memberRole}
        workspaceId={params.id}
        currentUserId={user.id}
        accountRole={accountRole}
        canCreateTasks={canCreateTasks}
        canToggleTasks={canToggleTasks}
      />
    </Suspense>
  );
}
