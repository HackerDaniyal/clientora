"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import JSZip from "jszip";
import { saveAs } from "file-saver";
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
  IconEye,
  IconPencil,
  IconUpload,
  IconPhoto,
  IconFile,
  IconRocket,
  IconCloudUpload,
  IconSparkles,
  IconCircleCheck,
  IconCircleX,
  IconInfoCircle,
  IconCalendar,
  IconUser,
  IconFilter,
  IconGripVertical,
  IconChevronDown,
  IconChevronRight,
  IconX,
  IconDotsVertical,
  IconAlertCircle,
  IconMessage
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { createTask, toggleTask, updateTask, deleteTask, reorderTasks, addTaskComment, deleteTaskComment, inviteMember, removeMember, changeMemberRole, createDocument, updateDocument, sendDocument, deleteDocument, updateWorkspaceAssets, sendAssetsToFreelancer, markAsPaid, acceptProposal, counterOfferProposal, submitWorkspaceReview } from "./actions";
import { useToast } from "@/components/ToastProvider";
import type { ChatMessage } from "@/components/workspace/WorkspaceChat";
import type { DocumentType } from "@/components/documents/types";

// ── Dynamic (code-split) imports ────────────────────────────────────────────
// These heavy components are only loaded when the user navigates to the
// relevant tab, keeping the initial JS bundle small.
const WorkspaceChat = dynamic(() => import("@/components/workspace/WorkspaceChat"), {
  loading: () => <TabSkeleton />,
  ssr: false,
});
const TimeTracker = dynamic(() => import("@/components/workspace/TimeTracker"), {
  loading: () => <div className="h-40 rounded-xl bg-brand-light/30 animate-pulse" />,
  ssr: false,
});
const DocumentEditor = dynamic(() => import("@/components/documents/DocumentEditor"), {
  loading: () => <TabSkeleton />,
  ssr: false,
});
const ProposalTemplate = dynamic(() => import("@/components/documents/ProposalTemplate"), {
  loading: () => <div className="h-64 rounded-xl bg-brand-light/30 animate-pulse" />,
  ssr: false,
});
const InvoiceTemplate = dynamic(() => import("@/components/documents/InvoiceTemplate"), {
  loading: () => <div className="h-64 rounded-xl bg-brand-light/30 animate-pulse" />,
  ssr: false,
});
const ContractTemplate = dynamic(() => import("@/components/documents/ContractTemplate"), {
  loading: () => <div className="h-64 rounded-xl bg-brand-light/30 animate-pulse" />,
  ssr: false,
});

// Shared skeleton for tab loading states
function TabSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-1/3 rounded-lg bg-brand-light/40" />
      <div className="h-32 rounded-xl bg-brand-light/30" />
      <div className="h-24 rounded-xl bg-brand-light/20" />
    </div>
  );
}

// Re-export document export utilities (imported lazily inline where needed)
import { exportPDF, exportProposalDOC, exportInvoiceDOC, exportContractDOC } from "@/lib/document-export";

interface WorkspaceClientProps {
  workspace: any;
  tasks: any[];
  messages: any[];
  members: any[];
  activityLog: any[];
  userRole: string;
  workspaceId: string;
  documents?: any[];
  timeLogs?: any[];
  review?: any;
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
  timeLogs: initialTimeLogs = [],
  review: initialReview = null,
  currentUserId,
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
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFilter, setTaskFilter] = useState<{ status: string; priority: string; assignee: string }>({ status: "all", priority: "all", assignee: "all" });
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [commentTaskId, setCommentTaskId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [review, setReview] = useState(initialReview);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [editorDocType, setEditorDocType] = useState<DocumentType>('proposal');
  const [viewingDocument, setViewingDocument] = useState<any | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterOfferNotes, setCounterOfferNotes] = useState('');
  const viewPreviewRef = useRef<HTMLDivElement>(null);
  const [workspaceData, setWorkspaceData] = useState(workspace);

  type AssetFile = { name: string; url: string; path?: string; size?: number };
  const projectAssets: { label: string; files: AssetFile[] }[] = (() => {
    const raw = workspaceData.form_data;
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

  // Local state for newly uploaded assets (merges with server-side assets)
  const [localAssets, setLocalAssets] = useState<{ logo?: AssetFile | null; references?: AssetFile[]; documents?: AssetFile[] }>({});
  const [assetUploading, setAssetUploading] = useState<string | null>(null);
  const [uploadMsgIdx, setUploadMsgIdx] = useState(0);
  const uploadMessages = [
    "Beaming up your files…",
    "Polishing pixels…",
    "Wrapping with a bow…",
    "Unleashing awesomeness…",
    "Almost there…",
    "Feeding the cloud…",
    "Making it shine…",
  ];

  // Rotate upload messages
  useEffect(() => {
    if (!assetUploading) return;
    const timer = setInterval(() => {
      setUploadMsgIdx((i) => (i + 1) % uploadMessages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [assetUploading]);

  useEffect(() => {
    if (workspaceData?.status === 'completed' && accountRole === 'client' && !review) {
      setShowReviewModal(true);
    }
  }, [workspaceData?.status, accountRole, review]);

  // Merge server-side assets with locally uploaded ones
  const mergedAssets: { label: string; files: AssetFile[] }[] = (() => {
    const map = new Map<string, AssetFile[]>();
    for (const group of projectAssets) {
      map.set(group.label, [...group.files]);
    }
    // Merge local uploads
    if (localAssets.logo?.url) {
      const existing = map.get("Logo") || [];
      if (!existing.find(f => f.url === localAssets.logo!.url)) existing.push(localAssets.logo);
      map.set("Logo", existing);
    }
    const localRefs = localAssets.references || [];
    if (localRefs.length) {
      const existing = map.get("References") || [];
      for (const ref of localRefs) {
        if (!existing.find(f => f.url === ref.url)) existing.push(ref);
      }
      map.set("References", existing);
    }
    const localDocs = localAssets.documents || [];
    if (localDocs.length) {
      const existing = map.get("Documents") || [];
      for (const doc of localDocs) {
        if (!existing.find(f => f.url === doc.url)) existing.push(doc);
      }
      map.set("Documents", existing);
    }
    return Array.from(map.entries()).map(([label, files]) => ({ label, files }));
  })();
  const allAssetFiles = mergedAssets.flatMap((g) => g.files);

  // Upload file to Supabase storage
  const uploadAssetFile = async (file: File, folder: string): Promise<AssetFile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { showToast("You must be logged in to upload", 'error'); return null; }
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${user.id}/${workspaceId}/${folder}/${fileName}`;
    setAssetUploading(file.name);
    const { error } = await supabase.storage.from('project-assets').upload(filePath, file, { cacheControl: '3600', upsert: false });
    setAssetUploading(null);
    if (error) { showToast(`Failed to upload ${file.name}: ${error.message}`, 'error'); return null; }
    const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(filePath);
    return { name: file.name, path: filePath, url: publicUrl, size: file.size };
  };

  const handleAssetLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("Logo must be under 10MB", 'error'); return; }
    const uploaded = await uploadAssetFile(file, 'logos');
    if (uploaded) {
      const updated = { ...localAssets, logo: uploaded };
      setLocalAssets(updated);
      setHasNewUploads(true);
      try {
        await updateWorkspaceAssets(workspaceId, { logo: { name: uploaded.name, url: uploaded.url, path: uploaded.path } });
      } catch (err: any) {
        console.error('Failed to save logo to DB:', err);
        showToast('File uploaded but failed to save. It will be sent with assets.', 'info');
      }
    }
  };

  const handleAssetImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const uploaded: AssetFile[] = [];
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) { showToast(`${file.name} is too large (max 10MB)`, 'error'); continue; }
      const result = await uploadAssetFile(file, 'references');
      if (result) uploaded.push(result);
    }
    if (uploaded.length) {
      const updated = { ...localAssets, references: [...(localAssets.references || []), ...uploaded] };
      setLocalAssets(updated);
      setHasNewUploads(true);
      try {
        await updateWorkspaceAssets(workspaceId, { references: uploaded.map(f => ({ name: f.name, url: f.url, path: f.path })) });
      } catch (err: any) {
        console.error('Failed to save images to DB:', err);
        showToast('Files uploaded but failed to save. They will be sent with assets.', 'info');
      }
    }
  };

  const handleAssetDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const uploaded: AssetFile[] = [];
    for (const file of selectedFiles) {
      if (file.size > 10 * 1024 * 1024) { showToast(`${file.name} is too large (max 10MB)`, 'error'); continue; }
      const result = await uploadAssetFile(file, 'documents');
      if (result) uploaded.push(result);
    }
    if (uploaded.length) {
      const updated = { ...localAssets, documents: [...(localAssets.documents || []), ...uploaded] };
      setLocalAssets(updated);
      setHasNewUploads(true);
      try {
        await updateWorkspaceAssets(workspaceId, { documents: uploaded.map(f => ({ name: f.name, url: f.url, path: f.path })) });
      } catch (err: any) {
        console.error('Failed to save documents to DB:', err);
        showToast('Files uploaded but failed to save. They will be sent with assets.', 'info');
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Assets sent state
  const [sendingAssets, setSendingAssets] = useState(false);
  const [hasNewUploads, setHasNewUploads] = useState(false);
  const [assetsSent, setAssetsSent] = useState<boolean>(() => {
    const raw = workspaceData.form_data;
    let fd: Record<string, unknown> | null = null;
    if (raw) {
      fd = typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, unknown>;
    }
    return !!fd?.assets_sent_at;
  });

  // Global toast
  const { showToast } = useToast();

  // Download file as blob (saves to PC instead of opening in new tab)
  const downloadFileAsBlob = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  // Download all asset files as a single ZIP archive
  const [zipping, setZipping] = useState(false);
  const downloadAllAsZip = async () => {
    setZipping(true);
    try {
      const zip = new JSZip();
      const fetchPromises = mergedAssets.map(async (group) => {
        const folder = zip.folder(group.label) || zip;
        const filePromises = group.files.map(async (file, idx) => {
          if (!file.url) return;
          try {
            const response = await fetch(file.url);
            const blob = await response.blob();
            // Avoid duplicate file names within the same folder
            let fileName = file.name || `file-${idx + 1}`;
            const existingNames = group.files.slice(0, idx).map(f => f.name);
            if (existingNames.includes(fileName)) {
              const ext = fileName.lastIndexOf('.') > 0 ? fileName.slice(fileName.lastIndexOf('.')) : '';
              const base = ext ? fileName.slice(0, -ext.length) : fileName;
              fileName = `${base}_${idx + 1}${ext}`;
            }
            folder.file(fileName, blob);
          } catch (err) {
            console.warn(`Failed to fetch ${file.name}:`, err);
          }
        });
        await Promise.all(filePromises);
      });
      await Promise.all(fetchPromises);

      const content = await zip.generateAsync({ type: 'blob' });
      const projectName = workspaceData.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'project';
      saveAs(content, `${projectName}_assets.zip`);
      showToast('ZIP downloaded successfully', 'success');
    } catch (err) {
      console.error('ZIP creation failed:', err);
      showToast('Failed to create ZIP archive', 'error');
    } finally {
      setZipping(false);
    }
  };

  // Handle send assets — passes merged assets directly to server action
  const handleSendAssets = async () => {
    setSendingAssets(true);
    try {
      // Build complete asset data from both server-side and local uploads
      const serverAssets: Record<string, unknown> = {};
      for (const group of projectAssets) {
        if (group.label === 'Logo' && group.files[0]) {
          serverAssets.logo = { name: group.files[0].name, url: group.files[0].url, path: group.files[0].path };
        } else if (group.label === 'References') {
          serverAssets.references = group.files.map(f => ({ name: f.name, url: f.url, path: f.path }));
        } else if (group.label === 'Documents') {
          serverAssets.documents = group.files.map(f => ({ name: f.name, url: f.url, path: f.path }));
        }
      }
      // Merge local uploads
      if (localAssets.logo) {
        serverAssets.logo = { name: localAssets.logo.name, url: localAssets.logo.url, path: localAssets.logo.path };
      }
      if (localAssets.references?.length) {
        const existing = (serverAssets.references as Array<{ url: string }> || []);
        const newRefs = localAssets.references.filter(r => !existing.find((e: any) => e.url === r.url));
        serverAssets.references = [...existing, ...newRefs.map(f => ({ name: f.name, url: f.url, path: f.path }))];
      }
      if (localAssets.documents?.length) {
        const existing = (serverAssets.documents as Array<{ url: string }> || []);
        const newDocs = localAssets.documents.filter(d => !existing.find((e: any) => e.url === d.url));
        serverAssets.documents = [...existing, ...newDocs.map(f => ({ name: f.name, url: f.url, path: f.path }))];
      }

      await sendAssetsToFreelancer(workspaceId, serverAssets as any);
      setAssetsSent(true);
      setHasNewUploads(false);
      showToast('Assets sent to freelancer successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send assets', 'error');
    }
    setSendingAssets(false);
  };

  // Update assetsSent when workspaceData changes (realtime)
  useEffect(() => {
    const raw = workspaceData.form_data;
    let fd: Record<string, unknown> | null = null;
    if (raw) {
      fd = typeof raw === 'string' ? JSON.parse(raw) : raw as Record<string, unknown>;
    }
    setAssetsSent(!!fd?.assets_sent_at);
  }, [workspaceData]);

  const participantIds = useMemo(() => {
    const ids = new Set<string>();
    if (workspaceData.freelancer_id) ids.add(workspaceData.freelancer_id);
    if (workspaceData.client_id) ids.add(workspaceData.client_id);
    for (const m of members ?? []) {
      const uid = m.user_id as string | undefined;
      if (uid) ids.add(uid);
    }
    return Array.from(ids);
  }, [workspaceData.freelancer_id, workspaceData.client_id, members]);

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

    // Subscribe to task comments (refetch tasks to get updated comments)
    const commentsChannel = supabase
      .channel('task-comments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_comments' },
        () => {
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

    // Subscribe to workspace updates (for asset uploads)
    const workspaceChannel = supabase
      .channel('workspace-assets')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'workspaces', filter: `id=eq.${workspaceId}` },
        (payload: any) => {
          console.log('Workspace update:', payload);
          fetchWorkspace();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(workspaceChannel);
    };
  }, [workspaceId]);

  // Polling fallback for assets tab — ensures freelancer sees updates even without realtime
  useEffect(() => {
    if (activeTab !== 'assets') return;
    const interval = setInterval(() => {
      fetchWorkspace();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, workspaceId]);

  // Broadcast workspace context to the AI Assistant (so it shows workspace-aware suggestions)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('ai-workspace-context', { detail: { workspaceId } }));
    return () => {
      // Clear context when leaving the workspace page
      window.dispatchEvent(new CustomEvent('ai-workspace-context', { detail: { workspaceId: '' } }));
    };
  }, [workspaceId]);

  const fetchTasks = async () => {
    // Try with comments and sort_order first
    const { data, error } = await supabase
      .from("tasks")
      .select("*, assignee:assigned_to(full_name, avatar_url), creator:created_by(full_name), comments:task_comments(id, content, created_at, user:user_id(full_name, avatar_url))")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: true });

    if (data) {
      setTasks(data);
      return;
    }

    // Fallback: without comments, order by created_at
    const { data: fallbackData } = await supabase
      .from("tasks")
      .select("*, assignee:assigned_to(full_name, avatar_url), creator:created_by(full_name)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (fallbackData) setTasks(fallbackData);
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

  const fetchWorkspace = async () => {
    const { data } = await supabase
      .from("workspaces")
      .select(`
        *,
        freelancer:profiles!workspaces_freelancer_id_fkey(full_name),
        client:profiles!workspaces_client_id_fkey(full_name)
      `)
      .eq("id", workspaceId)
      .single();
    if (data) setWorkspaceData(data);
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    try {
      await createTask(
        workspaceId,
        newTaskTitle,
        newTaskPriority,
        newTaskDescription || undefined,
        newTaskDueDate || undefined,
        newTaskAssignee || undefined
      );
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskDescription("");
      setNewTaskDueDate("");
      setNewTaskAssignee("");
      setShowTaskForm(false);
      await fetchTasks();
      showToast('Task created!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error');
    }
    setLoading(false);
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const srcIdx = result.source.index;
    const dstIdx = result.destination.index;
    if (srcIdx === dstIdx) return;

    const newTasks = [...tasks];
    const [moved] = newTasks.splice(srcIdx, 1);
    newTasks.splice(dstIdx, 0, moved);

    // Optimistic update
    setTasks(newTasks);

    // Batch update sort_order
    const updates = newTasks.map((t, i) => ({ id: t.id, sort_order: i }));
    try {
      await reorderTasks(updates);
    } catch {
      setTasks(tasks); // revert on error
      showToast('Failed to reorder tasks', 'error');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Record<string, unknown>) => {
    try {
      await updateTask(taskId, updates as any);
      await fetchTasks();
      showToast('Task updated!', 'success');
      setEditingTask(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      await fetchTasks();
      showToast('Task deleted', 'success');
      setTaskMenuOpen(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleAddComment = async (taskId: string) => {
    if (!commentText.trim()) return;
    try {
      await addTaskComment(taskId, commentText);
      setCommentText("");
      await fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to add comment', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteTaskComment(commentId);
      await fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete comment', 'error');
    }
  };

  const handleSubmitReview = async () => {
    if (reviewRating < 1 || reviewRating > 5) {
      showToast('Please select a rating', 'error');
      return;
    }
    if (!reviewComment.trim()) {
      showToast('Please enter a comment', 'error');
      return;
    }
    try {
      setLoading(true);
      await submitWorkspaceReview(workspaceId, reviewRating, reviewComment);
      setReview({ rating: reviewRating, comment: reviewComment });
      setShowReviewModal(false);
      showToast('Review submitted successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Workspace participants for assignee selector
  const assigneeOptions = useMemo(() => {
    const opts: { id: string; name: string }[] = [];
    if (workspace?.freelancer_id) {
      opts.push({ id: workspace.freelancer_id, name: workspace.freelancer?.full_name || 'Freelancer' });
    }
    if (workspace?.client_id) {
      opts.push({ id: workspace.client_id, name: workspace.client?.full_name || 'Client' });
    }
    members.forEach((m: any) => {
      if (m.profiles?.full_name) {
        opts.push({ id: m.user_id, name: m.profiles.full_name });
      }
    });
    return opts;
  }, [workspace, members]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      if (taskFilter.status !== 'all' && t.status !== taskFilter.status) return false;
      if (taskFilter.priority !== 'all' && t.priority !== taskFilter.priority) return false;
      if (taskFilter.assignee !== 'all' && (t.assigned_to || 'unassigned') !== taskFilter.assignee) return false;
      return true;
    });
  }, [tasks, taskFilter]);

  const handleToggleTask = async (taskId: string, isCurrentlyCompleted: boolean) => {
    // Optimistic update — toggle just this one task instantly
    const newStatus = isCurrentlyCompleted ? 'todo' : 'completed';
    const prevTasks = [...tasks];
    setTasks(tasks.map(t =>
      t.id === taskId
        ? { ...t, status: newStatus, completed_at: isCurrentlyCompleted ? null : new Date().toISOString() }
        : t
    ));

    // Undo function — reverts to previous state
    const undo = () => {
      setTasks(prevTasks);
      showToast('Change reverted', 'info');
    };

    try {
      await toggleTask(taskId, isCurrentlyCompleted);
      showToast(
        isCurrentlyCompleted ? 'Task reopened' : 'Task marked complete!',
        'success',
        undo
      );
      // Background refresh to stay in sync
      await fetchTasks();
    } catch (err: any) {
      // Revert on error
      setTasks(prevTasks);
      showToast(err.message || 'Failed to update task', 'error');
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
      const result = await inviteMember(workspaceId, inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("viewer");
      await fetchMembers();
      
      if (result.emailSent) {
        showToast(`Member invited & email sent!`, 'success');
      } else if (result.emailError) {
        showToast(`Member added but email failed: ${result.emailError}`, 'error');
      } else if (result.emailSkipped) {
        showToast(`Member added (email not configured)`, 'info');
      } else {
        showToast(`Member invited as ${inviteRole}!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to invite member', 'error');
    }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member?")) return;
    try {
      await removeMember(memberId, workspaceId);
      setMembers(members.filter((m) => m.id !== memberId));
      showToast('Member removed', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: string) => {
    try {
      await changeMemberRole(memberId, workspaceId, newRole);
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      showToast(`Role changed to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to change role', 'error');
    }
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
      case "urgent": return "badge-danger";
      case "high": return "badge-warning";
      case "medium": return "badge-info";
      case "low": return "badge-neutral";
      default: return "badge-neutral";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return "badge badge-success";
      case "review": return "badge badge-info";
      case "completed": return "badge badge-purple";
      case "archived": return "badge badge-neutral";
      default: return "badge badge-neutral";
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
                aria-label="Go back"
              >
                <IconArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-brand-dark">{workspaceData.name}</h1>
                <p className="text-sm text-text-secondary">{workspaceData.project_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {review && (
                <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-amber-200 fill-current'}`} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="text-amber-700 font-medium text-[12px] ml-1">{review.rating}.0</span>
                </div>
              )}
              <div className={getStatusBadge(workspaceData.status)}>
                {workspaceData.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-brand-light/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
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
                <p className="text-2xl font-semibold text-brand-dark capitalize">{workspaceData.status}</p>
                <p className="text-sm text-text-secondary mt-1">Stage: {workspaceData.pipeline_stage}</p>
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

            {/* Time Tracker */}
            <TimeTracker
              workspaceId={workspaceId}
              initialTimeLogs={initialTimeLogs}
              currentUserId={currentUserId}
            />

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
            {/* Upload Section — Client Only */}
            {accountRole === 'client' && (
              <div className="card bg-white p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-brand-tint rounded-xl flex items-center justify-center">
                    <IconCloudUpload size={22} className="text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-dark">Upload Assets</h3>
                    <p className="text-[11px] text-text-tertiary">Upload files, then send them to your freelancer</p>
                  </div>
                </div>

                {/* Playful Upload Animation */}
                {assetUploading ? (
                  <div className="my-6 py-8 flex flex-col items-center justify-center">
                    <div className="relative mb-5">
                      <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center">
                        <IconRocket size={32} className="text-brand-accent animate-rocket" />
                      </div>
                      <div className="absolute inset-0 w-16 h-16 bg-brand-accent/20 rounded-full animate-pulse-ring" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-bounce-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                      ))}
                    </div>
                    <p className="text-[13px] text-brand-dark font-medium animate-float" key={uploadMsgIdx}>
                      {uploadMessages[uploadMsgIdx]}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-1">{assetUploading}</p>
                    <div className="w-48 h-1.5 bg-brand-light/30 rounded-full mt-4 overflow-hidden">
                      <div className="h-full w-full rounded-full animate-shimmer" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                    <label className="group relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-brand-light rounded-xl bg-brand-surface cursor-pointer hover:border-brand-accent hover:bg-brand-tint/30 transition-all">
                      <div className="w-12 h-12 bg-brand-tint rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconUpload size={22} className="text-brand-dark" />
                      </div>
                      <span className="text-[12px] text-brand-dark font-medium">Upload Logo</span>
                      <span className="text-[10px] text-text-tertiary">PNG / SVG • Max 10MB</span>
                      <input type="file" accept=".png,.svg,.jpg,.jpeg" onChange={handleAssetLogoUpload} className="hidden" />
                    </label>
                    <label className="group relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-brand-light rounded-xl bg-brand-surface cursor-pointer hover:border-brand-accent hover:bg-brand-tint/30 transition-all">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconPhoto size={22} className="text-blue-600" />
                      </div>
                      <span className="text-[12px] text-brand-dark font-medium">Reference Images</span>
                      <span className="text-[10px] text-text-tertiary">Multiple allowed</span>
                      <input type="file" accept="image/*" multiple onChange={handleAssetImageUpload} className="hidden" />
                    </label>
                    <label className="group relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-brand-light rounded-xl bg-brand-surface cursor-pointer hover:border-brand-accent hover:bg-brand-tint/30 transition-all">
                      <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconFile size={22} className="text-amber-600" />
                      </div>
                      <span className="text-[12px] text-brand-dark font-medium">Documents</span>
                      <span className="text-[10px] text-text-tertiary">PDF, DOCX, XLSX, ZIP…</span>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar" multiple onChange={handleAssetDocUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Freelancer info — read only */}
            {accountRole !== 'client' && assetsSent && mergedAssets.length > 0 && (
              <div className="flex items-center gap-2 text-[12px] text-text-tertiary">
                <IconSparkles size={14} className="text-brand-accent" />
                <span>Assets sent by the client. Click download to save files to your PC.</span>
              </div>
            )}

            {/* Client: File List (view-only) + Send button */}
            {accountRole === 'client' && mergedAssets.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-brand-dark">
                    {mergedAssets.reduce((sum, g) => sum + g.files.length, 0)} file{mergedAssets.reduce((sum, g) => sum + g.files.length, 0) !== 1 ? 's' : ''} uploaded
                  </p>
                  {assetsSent && !hasNewUploads ? (
                    <div className="flex items-center gap-2 text-[12px] text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                      <IconCircleCheck size={16} />
                      Sent to freelancer
                    </div>
                  ) : (
                    <button
                      onClick={handleSendAssets}
                      disabled={sendingAssets}
                      className="pill-btn bg-brand-accent text-white disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      {sendingAssets ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <IconSend size={16} />
                          {assetsSent ? 'Send New Assets' : 'Send All Assets'}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {mergedAssets.map((group) => {
                  const isImage = group.label === "Logo" || group.label === "References";
                  return (
                    <div key={group.label} className="card bg-white p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          group.label === "Logo" ? "bg-brand-tint" :
                          group.label === "References" ? "bg-blue-50" : "bg-amber-50"
                        }`}>
                          {group.label === "Logo" ? <IconPhoto size={14} className="text-brand-dark" /> :
                           group.label === "References" ? <IconPhoto size={14} className="text-blue-600" /> :
                           <IconFile size={14} className="text-amber-600" />}
                        </div>
                        <h3 className="text-[14px] font-semibold text-brand-dark">{group.label}</h3>
                        <span className="text-[11px] text-text-tertiary bg-brand-surface px-2 py-0.5 rounded-full">
                          {group.files.length} file{group.files.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {isImage ? (
                        <div className={`grid gap-3 ${group.label === "Logo" ? "grid-cols-1 max-w-[200px]" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
                          {group.files.map((file, idx) => (
                            <div key={`${file.path || file.url}-${idx}`} className="group relative block rounded-xl overflow-hidden border border-brand-light/50">
                              <div className="aspect-square bg-brand-surface flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                              <div className="p-2">
                                <p className="text-[10px] text-text-tertiary truncate">{file.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {group.files.map((file, idx) => (
                            <div key={`${file.path || file.url}-${idx}`} className="flex items-center justify-between p-3.5 rounded-xl border border-brand-light/50 bg-brand-surface/30">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                  <IconFile size={18} className="text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium text-brand-dark truncate">{file.name}</p>
                                  {file.size && <p className="text-[10px] text-text-tertiary">{formatFileSize(file.size)}</p>}
                                </div>
                              </div>
                              <span className="text-[10px] text-text-tertiary bg-brand-surface px-2 py-0.5 rounded-full">Uploaded</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Freelancer: Assets with download */}
            {accountRole !== 'client' && assetsSent && mergedAssets.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-brand-dark">
                    {mergedAssets.reduce((sum, g) => sum + g.files.length, 0)} file{mergedAssets.reduce((sum, g) => sum + g.files.length, 0) !== 1 ? 's' : ''} received
                  </p>
                  <button
                    onClick={downloadAllAsZip}
                    disabled={zipping}
                    className="pill-btn-outline inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    <IconDownload size={16} />
                    {zipping ? 'Creating ZIP…' : 'Download All as ZIP'}
                  </button>
                </div>

                {mergedAssets.map((group) => {
                  const isImage = group.label === "Logo" || group.label === "References";
                  return (
                    <div key={group.label} className="card bg-white p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          group.label === "Logo" ? "bg-brand-tint" :
                          group.label === "References" ? "bg-blue-50" : "bg-amber-50"
                        }`}>
                          {group.label === "Logo" ? <IconPhoto size={14} className="text-brand-dark" /> :
                           group.label === "References" ? <IconPhoto size={14} className="text-blue-600" /> :
                           <IconFile size={14} className="text-amber-600" />}
                        </div>
                        <h3 className="text-[14px] font-semibold text-brand-dark">{group.label}</h3>
                        <span className="text-[11px] text-text-tertiary bg-brand-surface px-2 py-0.5 rounded-full">
                          {group.files.length} file{group.files.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {isImage ? (
                        <div className={`grid gap-3 ${group.label === "Logo" ? "grid-cols-1 max-w-[200px]" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
                          {group.files.map((file, idx) => (
                            <button
                              key={`${file.path || file.url}-${idx}`}
                              onClick={() => downloadFileAsBlob(file.url, file.name)}
                              className="group relative block rounded-xl overflow-hidden border border-brand-light/50 hover:border-brand-accent transition-all hover:shadow-md text-left"
                            >
                              <div className="aspect-square bg-brand-surface flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
                                  <IconDownload size={20} className="text-white" />
                                  <span className="text-[10px] text-white font-medium">{file.name.length > 18 ? file.name.slice(0, 15) + '…' : file.name}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {group.files.map((file, idx) => (
                            <button
                              key={`${file.path || file.url}-${idx}`}
                              onClick={() => downloadFileAsBlob(file.url, file.name)}
                              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-brand-light/50 hover:border-brand-accent hover:bg-brand-surface/50 transition-all group text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                                  <IconFile size={18} className="text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium text-brand-dark truncate">{file.name}</p>
                                  {file.size && <p className="text-[10px] text-text-tertiary">{formatFileSize(file.size)}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[11px] text-brand-accent font-medium">Download</span>
                                <IconDownload size={14} className="text-brand-accent" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {/* Empty states */}
            {mergedAssets.length > 0 && accountRole !== 'client' && !assetsSent && (
              <div className="card bg-white p-10 text-center">
                <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconFiles size={36} className="text-brand-light" />
                </div>
                <h3 className="text-lg font-medium text-brand-dark mb-2">Assets Not Yet Sent</h3>
                <p className="text-[13px] text-text-secondary">The client has uploaded files but hasn’t sent them yet. They’ll appear here once sent.</p>
              </div>
            )}

            {mergedAssets.length === 0 && (
              <div className="card bg-white p-10 text-center">
                <div className="w-20 h-20 bg-brand-surface rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconFiles size={36} className="text-brand-light" />
                </div>
                <h3 className="text-lg font-medium text-brand-dark mb-2">Project Assets</h3>
                {accountRole === 'client' ? (
                  <p className="text-[13px] text-text-secondary">Upload files above, then click “Send All Assets” to share with your freelancer.</p>
                ) : (
                  <p className="text-[13px] text-text-secondary">No assets uploaded by the client yet.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* To-Do Tab */}
        {activeTab === "todo" && (
          <div className="space-y-6">
            {/* Add Task Button / Form */}
            {canCreateTasks && (
              <div className="card bg-white p-6">
                {!showTaskForm ? (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="w-full py-3 border-2 border-dashed border-brand-light rounded-lg text-[14px] text-text-secondary hover:border-brand-accent hover:text-brand-accent transition-all flex items-center justify-center gap-2"
                  >
                    <IconPlus size={18} />
                    Add New Task
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-brand-dark">New Task</h3>
                      <button onClick={() => setShowTaskForm(false)} className="p-1 rounded-lg hover:bg-gray-100 text-text-tertiary">
                        <IconX size={18} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                    />
                    <textarea
                      value={newTaskDescription}
                      onChange={(e) => setNewTaskDescription(e.target.value)}
                      placeholder="Description (optional)..."
                      rows={2}
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent resize-none"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                      />
                      <select
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                      >
                        <option value="">Unassigned</option>
                        {assigneeOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => { setShowTaskForm(false); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskDueDate(""); setNewTaskAssignee(""); }}
                        className="px-4 py-2 text-[13px] text-text-secondary hover:text-brand-dark transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateTask}
                        disabled={loading || !newTaskTitle.trim()}
                        className="pill-btn bg-brand-accent text-white disabled:opacity-50 px-6"
                      >
                        <IconPlus size={16} />
                        Create Task
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="card bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <IconFilter size={16} className="text-text-tertiary" />
                <select
                  value={taskFilter.status}
                  onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}
                  className="bg-brand-surface border border-brand-light rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-brand-accent"
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={taskFilter.priority}
                  onChange={(e) => setTaskFilter({ ...taskFilter, priority: e.target.value })}
                  className="bg-brand-surface border border-brand-light rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-brand-accent"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={taskFilter.assignee}
                  onChange={(e) => setTaskFilter({ ...taskFilter, assignee: e.target.value })}
                  className="bg-brand-surface border border-brand-light rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-brand-accent"
                >
                  <option value="all">All Assignees</option>
                  <option value="unassigned">Unassigned</option>
                  {assigneeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
                <span className="text-[11px] text-text-tertiary ml-auto">{filteredTasks.length} of {tasks.length} tasks</span>
              </div>
            </div>

            {/* Tasks List (Drag-and-Drop) */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Tasks ({filteredTasks.length})</h3>
              {filteredTasks.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  {tasks.length === 0
                    ? "No tasks yet. Create one above!"
                    : "No tasks match the current filters."}
                </p>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="tasks">
                    {(provided) => (
                      <div className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                        {filteredTasks.map((task: any, index: number) => {
                          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                          const comments: any[] = task.comments || [];
                          const isCommentOpen = commentTaskId === task.id;

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={!canToggleTasks}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`rounded-lg border transition-all select-none ${
                                    snapshot.isDragging ? 'shadow-lg border-brand-accent bg-white' : ''
                                  } ${
                                    task.status === 'completed'
                                      ? 'bg-brand-surface/50 border-brand-light/30 opacity-60'
                                      : 'bg-white border-brand-light/50 hover:border-brand-accent/30'
                                  }`}
                                >
                                  {/* Task Row */}
                                  <div className="flex items-center gap-3 p-4">
                                    {/* Drag Handle */}
                                    {canToggleTasks && (
                                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-text-tertiary/50 hover:text-text-tertiary">
                                        <IconGripVertical size={16} />
                                      </div>
                                    )}

                                    {/* Status Toggle */}
                                    {canToggleTasks ? (
                                      <button
                                        onClick={() => handleToggleTask(task.id, task.status === 'completed')}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                          task.status === 'completed'
                                            ? 'bg-brand-mid border-brand-mid text-white'
                                            : task.status === 'in_progress'
                                              ? 'border-brand-accent bg-brand-accent/10'
                                              : 'border-brand-light hover:border-brand-accent'
                                        }`}
                                      >
                                        {task.status === 'completed' && <IconCheck size={14} strokeWidth={3} />}
                                        {task.status === 'in_progress' && <div className="w-2 h-2 rounded-full bg-brand-accent" />}
                                      </button>
                                    ) : (
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                        task.status === 'completed' ? 'bg-brand-mid border-brand-mid text-white' : 'border-brand-light'
                                      }`}>
                                        {task.status === 'completed' && <IconCheck size={14} strokeWidth={3} />}
                                      </div>
                                    )}

                                    {/* Task Info */}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-[14px] font-medium text-brand-dark ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                        {task.title}
                                      </p>
                                      {task.description && (
                                        <p className="text-[12px] text-text-tertiary mt-0.5 truncate">{task.description}</p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        {/* Due Date */}
                                        {task.due_date && (
                                          <span className={`text-[11px] flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-text-tertiary'}`}>
                                            <IconCalendar size={11} />
                                            {new Date(task.due_date).toLocaleDateString()}
                                            {isOverdue && ' (overdue)'}
                                          </span>
                                        )}
                                        {/* Assignee */}
                                        {task.assignee?.full_name && (
                                          <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                                            <IconUser size={11} />
                                            {task.assignee.full_name}
                                          </span>
                                        )}
                                        {/* Creator */}
                                        <span className="text-[10px] text-text-tertiary">
                                          by {task.creator?.full_name || 'team'}
                                        </span>
                                        {/* Status badge */}
                                        {task.status === 'in_progress' && (
                                          <span className="text-[10px] bg-brand-accent/10 text-brand-mid px-2 py-0.5 rounded-full font-medium">In Progress</span>
                                        )}
                                        {/* Comments toggle button */}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setCommentTaskId(isCommentOpen ? null : task.id); }}
                                          className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full transition-colors ${
                                            isCommentOpen
                                              ? 'bg-brand-accent/15 text-brand-mid'
                                              : 'text-text-tertiary hover:bg-gray-100'
                                          }`}
                                        >
                                          <IconMessage size={12} />
                                          {comments.length > 0 && <span>{comments.length}</span>}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Priority Badge */}
                                    <span className={`badge text-[10px] ${getPriorityColor(task.priority)}`}>
                                      {task.priority}
                                    </span>

                                    {/* Action Menu */}
                                    <div className="relative">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setTaskMenuOpen(taskMenuOpen === task.id ? null : task.id); }}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 text-text-tertiary transition-colors"
                                      >
                                        <IconDotsVertical size={16} />
                                      </button>
                                      {taskMenuOpen === task.id && (
                                        <>
                                          <div className="fixed inset-0 z-40" onClick={() => setTaskMenuOpen(null)} />
                                          <div className="absolute right-0 top-8 z-50 bg-white rounded-lg shadow-lg border border-gray-100 py-1 w-44">
                                            {canToggleTasks && task.status !== 'completed' && (
                                              <button
                                                onClick={() => { handleUpdateTask(task.id, { status: task.status === 'in_progress' ? 'todo' : 'in_progress' }); setTaskMenuOpen(null); }}
                                                className="w-full px-3 py-2 text-[12px] text-left hover:bg-gray-50 flex items-center gap-2 text-brand-dark"
                                              >
                                                <IconClock size={14} className="text-brand-accent" />
                                                {task.status === 'in_progress' ? 'Mark as To Do' : 'Mark In Progress'}
                                              </button>
                                            )}
                                            <button
                                              onClick={() => { setEditingTask(task); setTaskMenuOpen(null); }}
                                              className="w-full px-3 py-2 text-[12px] text-left hover:bg-gray-50 flex items-center gap-2 text-brand-dark"
                                            >
                                              <IconPencil size={14} className="text-text-secondary" />
                                              Edit Task
                                            </button>
                                            <button
                                              onClick={() => { setCommentTaskId(isCommentOpen ? null : task.id); setTaskMenuOpen(null); }}
                                              className="w-full px-3 py-2 text-[12px] text-left hover:bg-gray-50 flex items-center gap-2 text-brand-dark"
                                            >
                                              <IconMessage size={14} className="text-text-secondary" />
                                              {isCommentOpen ? 'Hide Comments' : 'Comments'}
                                            </button>
                                            {userRole === 'editor' && (
                                              <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="w-full px-3 py-2 text-[12px] text-left hover:bg-red-50 flex items-center gap-2 text-red-500"
                                              >
                                                <IconTrash size={14} />
                                                Delete
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Comments Section */}
                                  {isCommentOpen && (
                                    <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
                                      {comments.length > 0 ? (
                                        <div className="space-y-3 mb-3">
                                          {comments.map((c: any) => (
                                            <div key={c.id} className="flex items-start gap-2">
                                              <div className="w-6 h-6 rounded-full bg-brand-surface flex items-center justify-center text-[9px] font-bold text-brand-mid shrink-0">
                                                {(c.user?.full_name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[12px] font-medium text-brand-dark">{c.user?.full_name || 'Unknown'}</span>
                                                  <span className="text-[10px] text-text-tertiary">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-[12px] text-text-secondary mt-0.5">{c.content}</p>
                                              </div>
                                              {c.user_id === currentUserId && (
                                                <button
                                                  onClick={() => handleDeleteComment(c.id)}
                                                  className="p-1 rounded hover:bg-gray-200 text-text-tertiary"
                                                >
                                                  <IconX size={12} />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[12px] text-text-tertiary mb-3">No comments yet.</p>
                                      )}
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={commentTaskId === task.id ? commentText : ''}
                                          onChange={(e) => setCommentText(e.target.value)}
                                          placeholder="Add a comment..."
                                          className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-brand-accent"
                                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(task.id)}
                                        />
                                        <button
                                          onClick={() => handleAddComment(task.id)}
                                          disabled={!commentText.trim()}
                                          className="p-2 bg-brand-accent text-white rounded-lg disabled:opacity-50"
                                        >
                                          <IconSend size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingTask(null)}>
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-brand-dark">Edit Task</h3>
                <button onClick={() => setEditingTask(null)} className="p-1 rounded-lg hover:bg-gray-100 text-text-tertiary">
                  <IconX size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-medium text-text-secondary mb-1 block">Title</label>
                  <input
                    type="text"
                    defaultValue={editingTask.title}
                    id="edit-task-title"
                    className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-medium text-text-secondary mb-1 block">Description</label>
                  <textarea
                    defaultValue={editingTask.description || ''}
                    id="edit-task-desc"
                    rows={3}
                    className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Priority</label>
                    <select
                      defaultValue={editingTask.priority}
                      id="edit-task-priority"
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Status</label>
                    <select
                      defaultValue={editingTask.status}
                      id="edit-task-status"
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Due Date</label>
                    <input
                      type="date"
                      defaultValue={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''}
                      id="edit-task-due"
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary mb-1 block">Assignee</label>
                    <select
                      defaultValue={editingTask.assigned_to || ''}
                      id="edit-task-assignee"
                      className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    >
                      <option value="">Unassigned</option>
                      {assigneeOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-2 text-[13px] text-text-secondary hover:text-brand-dark transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const title = (document.getElementById('edit-task-title') as HTMLInputElement)?.value;
                      const description = (document.getElementById('edit-task-desc') as HTMLTextAreaElement)?.value;
                      const priority = (document.getElementById('edit-task-priority') as HTMLSelectElement)?.value;
                      const status = (document.getElementById('edit-task-status') as HTMLSelectElement)?.value;
                      const due_date = (document.getElementById('edit-task-due') as HTMLInputElement)?.value || null;
                      const assigned_to = (document.getElementById('edit-task-assignee') as HTMLSelectElement)?.value || null;
                      handleUpdateTask(editingTask.id, { title, description, priority, status, due_date, assigned_to });
                    }}
                    className="pill-btn bg-brand-accent text-white px-6"
                  >
                    <IconCheck size={16} />
                    Save Changes
                  </button>
                </div>
              </div>
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
            {/* Client hint */}
            {accountRole === 'client' && (
              <p className="text-[12px] text-text-tertiary italic">Documents are created by your freelancer. You can view and download them here.</p>
            )}

            {/* Documents List */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">All Documents ({documents.length})</h3>
              {documents.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No documents yet. {userRole === 'editor' && accountRole !== 'client' && 'Create one above!'}</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc: any) => (
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
                        <span className={`badge ${
                          doc.status === 'draft' ? 'badge-neutral' :
                          doc.status === 'sent' ? 'badge-info' :
                          doc.status === 'viewed' ? 'badge-purple' :
                          doc.status === 'approved' ? 'badge-success' :
                          doc.status === 'paid' ? 'badge-success' :
                          'badge-neutral'
                        }`}>
                          {doc.status}
                        </span>
                        {userRole === 'editor' && accountRole !== 'client' && doc.status === 'draft' && (
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
                        {userRole === 'editor' && accountRole !== 'client' && doc.type === 'invoice' && (doc.status === 'sent' || doc.status === 'viewed') && (
                          <button
                            onClick={async () => {
                              await markAsPaid(doc.id, workspaceId);
                              await fetchDocuments();
                            }}
                            className="p-2 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                            title="Mark as Paid"
                          >
                            <IconCheck size={16} />
                          </button>
                        )}
                        {userRole === 'editor' && accountRole !== 'client' && (
                          <button
                            onClick={() => {
                              setEditorDocType(doc.type as DocumentType);
                              setEditingDocumentId(doc.id);
                              setShowDocEditor(true);
                            }}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Edit document"
                          >
                            <IconPencil size={16} />
                          </button>
                        )}
                        {userRole === 'editor' && accountRole !== 'client' && (
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
                        <button
                          onClick={() => setViewingDocument(doc)}
                          className="p-2 hover:bg-brand-tint text-brand-mid rounded-lg transition-colors inline-flex"
                          title="View & Download PDF"
                        >
                          <IconDownload size={16} />
                        </button>
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
            {/* Invite Member — freelancer only */}
            {accountRole === 'freelancer' && (
              <div className="card bg-white p-6">
                <h3 className="text-lg font-semibold text-brand-dark mb-4">Invite Member</h3>
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address..."
                    className="flex-1 bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                    onKeyDown={(e) => e.key === "Enter" && handleInviteMember()}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="bg-brand-surface border border-brand-light rounded-lg px-4 py-2.5 outline-none focus:border-brand-accent"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={handleInviteMember}
                    disabled={loading || !inviteEmail.trim()}
                    className="pill-btn bg-brand-accent text-white disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <IconPlus size={18} />
                    )}
                    Invite
                  </button>
                </div>
                <p className="text-[11px] text-text-tertiary mt-2">
                  The user must have a registered account. They'll receive a notification when added.
                </p>
              </div>
            )}

            {/* Workspace Owners */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">Workspace Owners</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border border-brand-light/50 bg-brand-tint/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-dark/10 rounded-full flex items-center justify-center">
                      <span className="text-[14px] font-medium text-brand-dark">
                        {workspace?.freelancer?.full_name?.charAt(0) || "F"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-brand-dark">
                        {workspace?.freelancer?.full_name || "Freelancer"}
                      </p>
                      <p className="text-[12px] text-text-tertiary">Freelancer · Owner</p>
                    </div>
                  </div>
                  <span className="badge text-[11px] bg-brand-dark/10 text-brand-dark font-semibold">
                    Owner
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-brand-light/50 bg-brand-tint/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-accent/10 rounded-full flex items-center justify-center">
                      <span className="text-[14px] font-medium text-brand-accent">
                        {workspace?.client?.full_name?.charAt(0) || "C"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-brand-dark">
                        {workspace?.client?.full_name || "Client"}
                      </p>
                      <p className="text-[12px] text-text-tertiary">Client · Owner</p>
                    </div>
                  </div>
                  <span className="badge text-[11px] bg-brand-accent/10 text-brand-dark font-semibold">
                    Owner
                  </span>
                </div>
              </div>
            </div>

            {/* Added Members */}
            <div className="card bg-white p-6">
              <h3 className="text-lg font-semibold text-brand-dark mb-4">
                Team Members ({members.length})
              </h3>
              {members.length === 0 ? (
                <p className="text-text-secondary text-center py-8">
                  No additional members yet.
                  {accountRole === 'freelancer' ? " Invite someone above." : ""}
                </p>
              ) : (
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
                      <div className="flex items-center gap-2">
                        {accountRole === 'freelancer' ? (
                          <>
                            <select
                              value={member.role}
                              onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                              className="bg-brand-surface border border-brand-light rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-brand-accent cursor-pointer"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="editor">Editor</option>
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-2 hover:bg-red-100 text-text-secondary hover:text-red-600 rounded-lg transition-colors"
                            >
                              <IconTrash size={16} />
                            </button>
                          </>
                        ) : (
                          <span className={`badge text-[11px] ${
                            member.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-brand-light/30 text-brand-dark'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div className="flex items-center gap-2">
                {viewingDocument.content && (
                  <>
                    <button
                      onClick={async () => {
                        if (!viewPreviewRef.current) return;
                        try {
                          await exportPDF(viewPreviewRef.current, `${viewingDocument.type}-${viewingDocument.document_number}.pdf`);
                        } catch {
                          alert("PDF export failed");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                    >
                      <IconDownload size={14} /> PDF
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const d = viewingDocument;
                          if (d.type === 'proposal') await exportProposalDOC(d.content, `${d.type}-${d.document_number}.docx`);
                          else if (d.type === 'invoice') await exportInvoiceDOC(d.content, `${d.type}-${d.document_number}.docx`);
                          else await exportContractDOC(d.content, `${d.type}-${d.document_number}.docx`);
                        } catch {
                          alert("DOC export failed");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                    >
                      <IconDownload size={14} /> DOC
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                >
                  <span className="text-text-tertiary text-lg leading-none">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6" ref={viewPreviewRef}>
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

            {/* Client Proposal Actions */}
            {accountRole === 'client' && viewingDocument.type === 'proposal' && (viewingDocument.status === 'sent' || viewingDocument.status === 'viewed') && viewingDocument.status !== 'approved' && (
              <div className="border-t border-brand-light/30 p-6 bg-brand-surface/30 space-y-4">
                {viewingDocument.content?.counterOfferNotes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-[12px] font-medium text-amber-700 mb-1">Your Counter Offer Notes:</p>
                    <p className="text-[13px] text-amber-800 whitespace-pre-wrap">{viewingDocument.content.counterOfferNotes}</p>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await acceptProposal(viewingDocument.id, workspaceId);
                        setViewingDocument(null);
                        showToast('Proposal accepted! Workspace is now In Progress.', 'success');
                        await fetchDocuments();
                      } catch {
                        showToast('Failed to accept proposal', 'error');
                      }
                    }}
                    className="flex-1 pill-btn bg-brand-mid hover:bg-brand-green text-white"
                  >
                    <IconCheck size={18} />
                    Accept Proposal
                  </button>
                  <button
                    onClick={() => setShowCounterOffer(true)}
                    className="flex-1 pill-btn-outline bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  >
                    <IconMessageCircle size={16} />
                    Counter Offer
                  </button>
                </div>
                {showCounterOffer && (
                  <div className="space-y-3">
                    <textarea
                      value={counterOfferNotes}
                      onChange={(e) => setCounterOfferNotes(e.target.value)}
                      placeholder="Describe your counter offer — what would you like changed?"
                      rows={4}
                      className="w-full bg-white border border-brand-light rounded-lg px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await counterOfferProposal(viewingDocument.id, workspaceId, counterOfferNotes);
                            setShowCounterOffer(false);
                            setCounterOfferNotes('');
                            showToast('Counter offer sent to freelancer', 'success');
                            await fetchDocuments();
                          } catch {
                            showToast('Failed to send counter offer', 'error');
                          }
                        }}
                        disabled={!counterOfferNotes.trim()}
                        className="pill-btn bg-amber-500 text-white disabled:opacity-50"
                      >
                        Send Counter Offer
                      </button>
                      <button
                        onClick={() => { setShowCounterOffer(false); setCounterOfferNotes(''); }}
                        className="pill-btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Document Editor Modal */}
      {showDocEditor && accountRole !== 'client' && (
        <DocumentEditor
          type={editorDocType}
          workspaceName={workspaceData.name}
          clientName={workspaceData.client?.full_name}
          freelancerName={workspaceData.freelancer?.full_name}
          freelancerEmail={undefined}
          initialData={editingDocumentId ? documents.find((d: any) => d.id === editingDocumentId)?.content : null}
          onSave={async (docType, title, content) => {
            if (editingDocumentId) {
              await updateDocument(
                editingDocumentId,
                workspaceId,
                title,
                content,
                docType === 'invoice' ? (content as any).totalAmount : undefined,
                docType === 'invoice' ? (content as any).dueDate : undefined
              );
            } else {
              await createDocument(
                workspaceId,
                docType,
                title,
                content,
                docType === 'invoice' ? (content as any).totalAmount : undefined,
                docType === 'invoice' ? (content as any).dueDate : undefined
              );
            }
            await fetchDocuments();
            setEditingDocumentId(null);
          }}
          onClose={() => { setShowDocEditor(false); setEditingDocumentId(null); }}
        />
      )}

      {/* Client Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-brand-dark">Project Completed!</h3>
              <button onClick={() => setShowReviewModal(false)} className="text-text-secondary hover:text-brand-dark">
                <IconX size={20} />
              </button>
            </div>
            <p className="text-[14px] text-text-secondary mb-6">
              Your workspace has been marked as completed. Please take a moment to leave a review for your freelancer.
            </p>
            <div className="space-y-6">
              <div>
                <label className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-sm"
                    >
                      <svg className={`w-8 h-8 ${star <= reviewRating ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-medium text-text-secondary uppercase tracking-wider mb-2 block">Your Review</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share your experience working on this project..."
                  rows={4}
                  className="w-full bg-brand-surface border border-brand-light rounded-lg px-4 py-3 text-[14px] outline-none focus:border-brand-accent resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSubmitReview}
                  disabled={loading || !reviewComment.trim()}
                  className="flex-1 pill-btn bg-brand-dark text-white disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="pill-btn-outline"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
