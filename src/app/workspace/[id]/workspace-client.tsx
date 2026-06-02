"use client";

import React, { useMemo, useState, useEffect } from "react";
import { 
  IconLayoutDashboard, 
  IconFiles, 
  IconChecklist, 
  IconMessageCircle, 
  IconUsers,
  IconFileText,
  IconArrowLeft,
  IconPlus,
  IconTrash,
  IconCheck,
  IconSend,
  IconDownload,
  IconClock,
  IconChartBar,
  IconEye
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { createTask, toggleTask, inviteMember, removeMember, createDocument, sendDocument, deleteDocument } from "./actions";
import WorkspaceChat, { type ChatMessage } from "@/components/workspace/WorkspaceChat";
import DocumentEditor from "@/components/documents/DocumentEditor";
import type { DocumentType } from "@/components/documents/types";
import ProposalTemplate from "@/components/documents/ProposalTemplate";
import InvoiceTemplate from "@/components/documents/InvoiceTemplate";
import ContractTemplate from "@/components/documents/ContractTemplate";

interface WorkspaceClientProps {
  workspace: any;
  tasks: any[];
  messages: any[];
  members: any[];
  activityLog: any[];
  userRole: string;
  workspaceId: string;
  documents?: any[];
  currentUserId: string;
  accountRole: string;
  canCreateTasks: boolean;
  canToggleTasks: boolean;
}

type TabType = "overview" | "assets" | "todo" | "chat" | "documents" | "members";

export default function WorkspaceClient({
  workspace,
  tasks: initialTasks,
  messages: initialMessages,
  members: initialMembers,
  activityLog: initialActivityLog,
  userRole,
  workspaceId,
  documents: initialDocuments = [],
  accountRole,
  canCreateTasks,
  canToggleTasks,
}: WorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialTab = (searchParams.get("tab") as TabType) || "overview";
  const [activeTab, setActiveTab] = useState<TabType>(
    ["overview", "assets", "todo", "chat", "documents", "members"].includes(initialTab)
      ? initialTab
      : "overview"
  );
  const [tasks, setTasks] = useState(initialTasks);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages as ChatMessage[]);
  const [members, setMembers] = useState(initialMembers);
  const [activityLog, setActivityLog] = useState(initialActivityLog);
  const [documents, setDocuments] = useState(initialDocuments);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [editorDocType, setEditorDocType] = useState<DocumentType>('proposal');
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);

  type AssetFile = { name: string; url: string; path?: string };
  const projectAssets: { label: string; files: AssetFile[] }[] = (() => {
    const raw = workspace.form_data;
    let formData: { assets?: Record<string, unknown> } | null = null;
    if (raw) {
      if (typeof raw === "string") {
        try {
          formData = JSON.parse(raw) as { assets?: Record<string, unknown> };
        } catch {
          formData = null;
        }
      } else if (typeof raw === "object") {
        formData = raw as { assets?: Record<string, unknown> };
      }
    }
    const assets = formData?.assets as
      | {
          logo?: AssetFile;
          references?: AssetFile[];
          documents?: AssetFile[];
        }
      | undefined;
    if (!assets) return [];
    const items: { label: string; files: AssetFile[] }[] = [];
    if (assets.logo?.url) items.push({ label: "Logo", files: [assets.logo] });
    
    const references = Array.isArray(assets.references) ? assets.references : [];
    if (references.length) items.push({ label: "References", files: references });
    
    const documents = Array.isArray(assets.documents) ? assets.documents : [];
    if (documents.length) items.push({ label: "Documents", files: documents });
    
    return items;
  })();
  const allAssetFiles = projectAssets.flatMap((g) => g.files);

  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    if (workspace.freelancer_id) ids.add(workspace.freelancer_id);
    if (workspace.client_id) ids.add(workspace.client_id);
    for (const m of members ?? []) {
      const uid = m.user_id as string | undefined;
      if (uid) ids.add(uid);
    }
    return Array.from(ids);
  }, [workspace.freelancer_id, workspace.client_id, members]);

  // Realtime subscriptions
  useEffect(() => {
    // Subscribe to tasks
    const tasksChannel = supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `workspace_id=eq.${workspaceId}` },
        (payload) => {
          console.log('Task update:', payload);
          fetchTasks();
        }
      )
      .subscribe();

    // Subscribe to activity log
    const activityChannel = supabase
      .channel('activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `workspace_id=eq.${workspaceId}` },
        () => {
          fetchActivityLog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(activityChannel);
    };
  }, [workspaceId]);

  const fetchTasks = async () => {
    const { data } = await supabase
      .from("tasks")
      .select("*, assignee:assigned_to(full_name), creator:created_by(full_name)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  };

  const fetchActivityLog = async () => {
    const { data } = await supabase
      .from("activity_log")
      .select("*, user:user_id(full_name, avatar_url)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setActivityLog(data);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    try {
      await createTask(workspaceId, newTaskTitle, newTaskPriority);
      setNewTaskTitle("");
      await fetchTasks();
    } catch {
      alert("Failed to create task");
    }
    setLoading(false);
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await toggleTask(taskId, completed);
      await fetchTasks();
    } catch {
      alert("Failed to update task");
    }
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("workspace_members")
      .select("*, profiles:user_id(full_name, avatar_url)")
      .eq("workspace_id", workspaceId);
    if (data) setMembers(data);
  };

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from("workspace_documents")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      await inviteMember(workspaceId, inviteEmail, "viewer");
      setInviteEmail("");
      await fetchMembers();
      alert("Member invited!");
    } catch {
      alert("Failed to invite member. Check the email is registered.");
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(memberId, workspaceId);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch {
      alert("Failed to remove member");
    }
  };

  const handleDownloadAllAssets = () => {
    allAssetFiles.forEach((file) => {
      if (file.url) window.open(file.url, "_blank");
    });
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: IconLayoutDashboard },
    { id: "assets" as TabType, label: "Assets", icon: IconFiles },
    { id: "todo" as TabType, label: "To-Do", icon: IconChecklist },
    { id: "chat" as TabType, label: "Chat", icon: IconMessageCircle },
    { id: "documents" as TabType, label: "Documents", icon: IconFileText },
    { id: "members" as TabType, label: "Members", icon: IconUsers },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "medium": return "bg-blue-100 text-blue-700";
      case "low": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "badge bg-green-100 text-green-700";
      case "review": return "badge bg-blue-100 text-blue-700";
      case "completed": return "badge bg-purple-100 text-purple-700";
      case "archived": return "badge bg-gray-100 text-gray-700";
      default: return "badge bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* Header */}
      <div className="bg-white border-b border-brand-light/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-brand-light/30 rounded-lg transition-colors"
              >
                <IconArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-brand-dark">{workspace.name}</h1>
                <p className="text-sm text-text-secondary">{workspace.project_type}</p>
              </div>
            </div>
            <div className={getStatusBadge(workspace.status)}>
              {workspace.status}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-brand-light/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-[14px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-brand-accent text-brand-accent"
                      : "border-transparent text-text-secondary hover:text-brand-dark"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <IconChartBar size={24} className="text-brand-accent" />
                  <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Status</h3>
                </div>
                <p className="text-2xl font-semibold text-brand-dark capitalize">{workspace.status}</p>
                <p className="text-sm text-text-secondary mt-1">Stage: {workspace.pipeline_stage}</p>
              </div>

              <div className="card bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <IconChecklist size={24} className="text-brand-accent" />
                  <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Tasks</h3>
                </div>
                <p className="text-2xl font-semibold text-brand-dark">{tasks.length}</p>
                <p className="text-sm text-text-secondary mt-1">
                  {tasks.filter(t => t.status === "completed").length} completed
                </p>
              </div>

              <div className="card bg-white p-6">
                <div className="flex items-center gap-3 mb-3">
                  <IconMessageCircle size={24} className="text-brand-accent" />
                  <h3 className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Messages</h3>
                </div>
                <p className="text-2xl font-semibold text-brand-dark">{messages.length}</p>
                <p className="text-sm text-text-secondary mt-1">In conversation</p>
              </div>
            </div>

            {/* Activity Log */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Activity Log</h3>
              <div className="space-y-4">
                {activityLog.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">No activity yet</p>
                ) : (
                  activityLog.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-brand-light/30 last:border-0">
                      <div className="w-8 h-8 bg-brand-light/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <IconClock size={16} className="text-brand-dark" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] text-brand-dark">
                          <strong>{activity.user?.full_name || "Unknown"}</strong> {activity.action}
                        </p>
                        <p className="text-[12px] text-text-tertiary mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Assets Tab */}
        {activeTab === "assets" && (
          <div className="space-y-6">
            {projectAssets.length > 0 ? (
              <>
                <div className="flex justify-end">
                  <button
                    onClick={handleDownloadAllAssets}
                    className="pill-btn-outline inline-flex items-center gap-2"
                  >
                    <IconDownload size={18} />
                    Open All Files
                  </button>
                </div>
                {projectAssets.map((group) => (
                  <div key={group.label} className="card bg-white p-6">
                    <h3 className="text-lg font-semibold text-brand-dark mb-4">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {group.files.map((file, idx) => (
                        <a
                          key={`${file.path || file.url}-${idx}`}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-lg border border-brand-light/50 hover:border-brand-accent transition-colors"
                        >
                          <span className="text-[14px] text-brand-dark truncate">{file.name}</span>
                          <IconDownload size={16} className="text-brand-accent shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="card bg-white p-8 text-center">
                <IconFiles size={64} className="mx-auto text-text-tertiary opacity-20 mb-4" />
                <h3 className="text-lg font-medium text-brand-dark mb-2">Project Assets</h3>
                <p className="text-text-secondary">No assets uploaded with this project yet.</p>
              </div>
            )}
          </div>
        )}

        {/* To-Do Tab */}
        {activeTab === "todo" && (
          <div className="space-y-6">
            {/* Add Task Form */}
            {canCreateTasks && (
              <div className="card bg-white p-6">
                <h3 className="text-lg font-semibold text-brand-dark mb-4">Add New Task</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title..."
                    className="flex-1 bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <button
                    onClick={handleCreateTask}
                    disabled={loading || !newTaskTitle.trim()}
                    className="pill-btn bg-brand-accent text-white disabled:opacity-50"
                  >
                    <IconPlus size={18} />
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Tasks ({tasks.length})</h3>
              {tasks.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No tasks yet.{" "}
                  {canCreateTasks
                    ? accountRole === "client"
                      ? "Add a task for your freelancer."
                      : "Create one above!"
                    : ""}
                </p>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                        task.status === "completed"
                          ? "bg-brand-surface border-brand-light/30 opacity-60"
                          : "bg-white border-brand-light/50 hover:border-brand-accent"
                      }`}
                    >
                      {canToggleTasks && (
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.status === "completed")}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            task.status === "completed"
                              ? "bg-brand-mid border-brand-mid text-white"
                              : "border-brand-light hover:border-brand-accent"
                          }`}
                          aria-label={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
                        >
                          {task.status === "completed" && <IconCheck size={14} />}
                        </button>
                      )}
                      <div className="flex-1">
                        <p className={`text-[14px] font-medium text-brand-dark ${task.status === "completed" ? "line-through" : ""}`}>
                          {task.title}
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                          {task.creator?.full_name
                            ? `Added by ${task.creator.full_name}`
                            : "Added by team"}
                        </p>
                        {task.due_date && (
                          <p className="text-[12px] text-text-tertiary mt-1">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <span className={`badge text-[11px] ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === "chat" && (
          <WorkspaceChat
            workspaceId={workspaceId}
            initialMessages={messages}
            participantIds={participantIds}
            canSend={userRole === "editor"}
            onMessagesUpdated={setMessages}
          />
        )}


        {/* Documents Tab */}
        {activeTab === "documents" && (
          <div className="space-y-6">
            {/* Create Document Buttons */}
            {userRole === "editor" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => { setEditorDocType('proposal'); setShowDocEditor(true); }}
                  className="card bg-white p-6 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-brand-accent"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <IconFileText size={24} className="text-blue-600" />
                  </div>
                  <h4 className="text-[15px] font-medium text-brand-dark mb-1">New Proposal</h4>
                  <p className="text-[12px] text-text-secondary">Professional proposal with template</p>
                </button>

                <button
                  onClick={() => { setEditorDocType('invoice'); setShowDocEditor(true); }}
                  className="card bg-white p-6 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-brand-accent"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <IconFileText size={24} className="text-green-600" />
                  </div>
                  <h4 className="text-[15px] font-medium text-brand-dark mb-1">New Invoice</h4>
                  <p className="text-[12px] text-text-secondary">Professional invoice with template</p>
                </button>

                <button
                  onClick={() => { setEditorDocType('contract'); setShowDocEditor(true); }}
                  className="card bg-white p-6 hover:shadow-md transition-all text-left border-2 border-transparent hover:border-brand-accent"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <IconFileText size={24} className="text-purple-600" />
                  </div>
                  <h4 className="text-[15px] font-medium text-brand-dark mb-1">New Contract</h4>
                  <p className="text-[12px] text-text-secondary">Professional agreement with template</p>
                </button>
              </div>
            )}

            {/* Documents List */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">All Documents ({documents.length})</h3>
              {documents.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No documents yet. {userRole === "editor" && "Create one above!"}</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border border-brand-light/50 hover:border-brand-accent transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          doc.type === 'proposal' ? 'bg-blue-100' :
                          doc.type === 'invoice' ? 'bg-green-100' :
                          'bg-purple-100'
                        }`}>
                          <IconFileText size={20} className={
                            doc.type === 'proposal' ? 'text-blue-600' :
                            doc.type === 'invoice' ? 'text-green-600' :
                            'text-purple-600'
                          } />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-brand-dark">{doc.title}</p>
                          <p className="text-[12px] text-text-tertiary">
                            {doc.document_number} · {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {doc.amount && (
                          <span className="text-[14px] font-semibold text-brand-dark">${doc.amount}</span>
                        )}
                        <span className={`badge text-[11px] ${
                          doc.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          doc.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                          doc.status === 'viewed' ? 'bg-purple-100 text-purple-700' :
                          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                          doc.status === 'paid' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {doc.status}
                        </span>
                        {userRole === "editor" && doc.status === 'draft' && (
                          <button
                            onClick={async () => {
                              await sendDocument(doc.id);
                              await fetchDocuments();
                            }}
                            className="p-2 hover:bg-brand-accent/10 text-brand-accent rounded-lg transition-colors"
                            title="Send to client"
                          >
                            <IconSend size={16} />
                          </button>
                        )}
                        {userRole === "editor" && (
                          <button
                            onClick={async () => {
                              await deleteDocument(doc.id, workspaceId);
                              await fetchDocuments();
                            }}
                            className="p-2 hover:bg-red-100 text-text-secondary hover:text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <IconTrash size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-2 hover:bg-brand-light/30 text-text-secondary rounded-lg transition-colors"
                          title="View"
                        >
                          <IconEye size={16} />
                        </button>
                        <a
                          href={`/api/documents/${doc.id}/export`}
                          className="p-2 hover:bg-brand-tint text-brand-mid rounded-lg transition-colors inline-flex"
                          title="Export document"
                          download
                        >
                          <IconDownload size={16} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-6">
            {/* Invite Member */}
            {userRole === "editor" && (
              <div className="card bg-white p-6">
                <h3 className="text-lg font-semibold text-brand-dark mb-4">Invite Member</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address..."
                    className="flex-1 bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                  />
                  <button
                    onClick={handleInviteMember}
                    disabled={loading || !inviteEmail.trim()}
                    className="pill-btn bg-brand-accent text-white disabled:opacity-50"
                  >
                    <IconPlus size={18} />
                    Invite
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Team Members ({members.length})</h3>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border border-brand-light/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-accent/20 rounded-full flex items-center justify-center">
                        <span className="text-[14px] font-medium text-brand-accent">
                          {member.profiles?.full_name?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-brand-dark">
                          {member.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-[12px] text-text-tertiary">
                          {member.profiles?.email || "No email"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="badge text-[11px] bg-brand-light/30 text-brand-dark">
                        {member.role}
                      </span>
                      {userRole === "editor" && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 hover:bg-red-100 text-text-secondary hover:text-red-600 rounded-lg transition-colors"
                        >
                          <IconTrash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Document Modal — Renders Template with Saved Data */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <div>
                <h3 className="text-[15px] font-semibold text-brand-dark">{viewingDocument.title}</h3>
                <p className="text-[11px] text-text-tertiary capitalize">
                  {viewingDocument.type} · {viewingDocument.document_number} · {viewingDocument.status}
                </p>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <span className="text-text-tertiary text-lg leading-none">&times;</span>
              </button>
            </div>
            <div className="p-6">
              {viewingDocument.type === 'proposal' && viewingDocument.content?.companyName && (
                <ProposalTemplate data={viewingDocument.content} />
              )}
              {viewingDocument.type === 'invoice' && viewingDocument.content?.invoiceNumber && (
                <InvoiceTemplate data={viewingDocument.content} />
              )}
              {viewingDocument.type === 'contract' && viewingDocument.content?.projectScope && (
                <ContractTemplate data={viewingDocument.content} />
              )}
              {(!viewingDocument.content?.companyName && !viewingDocument.content?.invoiceNumber && !viewingDocument.content?.projectScope) && (
                <div className="text-center py-12">
                  <p className="text-text-secondary mb-2">This document was created with the old format.</p>
                  {viewingDocument.content?.description && (
                    <p className="text-[14px] text-text-secondary whitespace-pre-wrap max-w-lg mx-auto">
                      {viewingDocument.content.description}
                    </p>
                  )}
                  {viewingDocument.amount != null && (
                    <p className="text-2xl font-semibold text-brand-dark mt-4">${viewingDocument.amount}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Editor Modal */}
      {showDocEditor && (
        <DocumentEditor
          type={editorDocType}
          workspaceName={workspace.name}
          clientName={workspace.client?.full_name}
          freelancerName={workspace.freelancer?.full_name}
          freelancerEmail={undefined}
          onSave={async (docType, title, content) => {
            await createDocument(
              workspaceId,
              docType,
              title,
              content,
              docType === 'invoice' ? (content as any).totalAmount : undefined,
              docType === 'invoice' ? (content as any).dueDate : undefined
            );
            await fetchDocuments();
          }}
          onClose={() => setShowDocEditor(false)}
        />
      )}
    </div>
  );
}
