"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconX,
  IconSend,
  IconTrash,
  IconUser,
  IconRobot,
  IconLoader2,
  IconFileText,
  IconCoin,
  IconClipboardText,
  IconChartBar,
  IconMessageCircle,
  IconChecklist,
  IconNotes,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";

interface AIAssistantProps {
  userRole: string;
  workspaceId?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/** Lightweight workspace snapshot used to generate context-aware suggestions */
interface WorkspaceSnapshot {
  id: string;
  name: string;
  projectType: string;
  status: string;
  pipelineStage: string;
  clientName: string;
  freelancerName: string;
  taskCount: number;
  completedTaskCount: number;
  messageCount: number;
  hasProposal: boolean;
  hasInvoice: boolean;
  hasContract: boolean;
  briefSummary: string;
}

interface Suggestion {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

// ── Context-Aware Suggestion Generators ──

const iconSm = (Icon: typeof IconFileText, size = 14) =>
  React.createElement(Icon, { size, className: "text-brand-accent shrink-0" });

function getFreelancerSuggestions(snap: WorkspaceSnapshot | null): Suggestion[] {
  // ── With workspace context ──
  if (snap) {
    const sugs: Suggestion[] = [];

    // Proposal suggestion
    if (!snap.hasProposal) {
      sugs.push({
        label: `Draft a proposal for ${snap.name}`,
        prompt: `Draft a professional proposal for the "${snap.name}" project based on the client brief. Include scope, timeline, and deliverables.`,
        icon: iconSm(IconFileText),
      });
    } else {
      sugs.push({
        label: `Improve the proposal for ${snap.name}`,
        prompt: `Review and suggest improvements for the existing proposal in the "${snap.name}" workspace. How can I make it more compelling?`,
        icon: iconSm(IconFileText),
      });
    }

    // Pricing suggestion
    if (snap.briefSummary) {
      sugs.push({
        label: "Suggest pricing based on the brief",
        prompt: `Based on the project brief for "${snap.name}" (${snap.briefSummary}), suggest a fair pricing structure with tiers (basic, standard, premium).`,
        icon: iconSm(IconCoin),
      });
    } else {
      sugs.push({
        label: "How should I price this project?",
        prompt: `I'm working on a ${snap.projectType || "new"} project called "${snap.name}". How should I structure my pricing?`,
        icon: iconSm(IconCoin),
      });
    }

    // Task / progress suggestion
    if (snap.taskCount > 0) {
      const pct = snap.taskCount > 0 ? Math.round((snap.completedTaskCount / snap.taskCount) * 100) : 0;
      sugs.push({
        label: `Project progress: ${pct}% — what's next?`,
        prompt: `The "${snap.name}" project is ${pct}% complete (${snap.completedTaskCount}/${snap.taskCount} tasks done, status: ${snap.status}). What should I focus on next to keep things on track?`,
        icon: iconSm(IconChecklist),
      });
    } else {
      sugs.push({
        label: "Suggest a task breakdown for this project",
        prompt: `Create a detailed task breakdown for the "${snap.name}" project (${snap.projectType || "general"}). Group tasks by phase and suggest priorities.`,
        icon: iconSm(IconChecklist),
      });
    }

    // Invoice / contract suggestion
    if (!snap.hasInvoice && !snap.hasContract) {
      sugs.push({
        label: "Generate an invoice and contract",
        prompt: `Help me create an invoice and contract for the "${snap.name}" project with client ${snap.clientName || "(client)"}. What information do I need?`,
        icon: iconSm(IconClipboardText),
      });
    } else if (snap.hasInvoice && !snap.hasContract) {
      sugs.push({
        label: "Create a contract for this project",
        prompt: `Help me draft a contract for the "${snap.name}" project. The invoice is already sent — what clauses should I include?`,
        icon: iconSm(IconClipboardText),
      });
    } else {
      sugs.push({
        label: `Summarize activity for ${snap.clientName || "client"}`,
        prompt: `Give me a professional summary of the "${snap.name}" project that I can share with ${snap.clientName || "the client"}. Include status, progress, and next steps.`,
        icon: iconSm(IconChartBar),
      });
    }

    return sugs;
  }

  // ── Without workspace (dashboard level) ──
  return [
    {
      label: "How do I create a winning proposal?",
      prompt: "Give me tips for writing a compelling freelance proposal that wins clients. Include structure, tone, and key sections.",
      icon: iconSm(IconFileText),
    },
    {
      label: "Suggest a pricing strategy",
      prompt: "What pricing models work best for freelancers? Help me choose between hourly, fixed-price, and retainer models.",
      icon: iconSm(IconCoin),
    },
    {
      label: "How do I manage multiple clients?",
      prompt: "What are the best practices for managing multiple freelance clients without dropping the ball? Suggest tools and workflows.",
      icon: iconSm(IconChecklist),
    },
    {
      label: "Draft a client contract template",
      prompt: "Help me create a standard freelance contract template that covers scope, payment terms, revisions, and IP ownership.",
      icon: iconSm(IconClipboardText),
    },
  ];
}

function getClientSuggestions(snap: WorkspaceSnapshot | null): Suggestion[] {
  // ── With workspace context ──
  if (snap) {
    const sugs: Suggestion[] = [];

    // Project status
    sugs.push({
      label: `What's the status of ${snap.name}?`,
      prompt: `Give me a clear summary of the "${snap.name}" project status. What stage is it at, and what's happening next?`,
      icon: iconSm(IconChartBar),
    });

    // Document-related
    if (snap.hasProposal) {
      sugs.push({
        label: "Explain the proposal I received",
        prompt: `Explain the key points of the proposal I received for "${snap.name}". What should I look out for before accepting?`,
        icon: iconSm(IconFileText),
      });
    } else {
      sugs.push({
        label: "When will I receive a proposal?",
        prompt: `I haven't received a proposal yet for "${snap.name}". What's the typical timeline, and what should it include?`,
        icon: iconSm(IconFileText),
      });
    }

    // Invoice-related
    if (snap.hasInvoice) {
      sugs.push({
        label: "Help me understand my invoice",
        prompt: `I have an invoice for "${snap.name}". Help me understand what to check before paying, and what payment terms are standard.`,
        icon: iconSm(IconCoin),
      });
    } else {
      sugs.push({
        label: "What should I know about payments?",
        prompt: `What are the standard payment practices for freelance projects like "${snap.name}"? How do deposits, milestones, and invoicing work?`,
        icon: iconSm(IconCoin),
      });
    }

    // Task / communication suggestion
    if (snap.taskCount > 0) {
      sugs.push({
        label: `Review task progress (${snap.completedTaskCount}/${snap.taskCount} done)`,
        prompt: `Summarize the task progress for "${snap.name}". ${snap.completedTaskCount} of ${snap.taskCount} tasks are completed. What should I follow up on with the freelancer?`,
        icon: iconSm(IconChecklist),
      });
    } else {
      sugs.push({
        label: "How do I communicate with my freelancer?",
        prompt: `What's the best way to communicate project requirements and feedback to my freelancer on "${snap.name}"?`,
        icon: iconSm(IconMessageCircle),
      });
    }

    return sugs;
  }

  // ── Without workspace (dashboard level) ──
  return [
    {
      label: "Where can I see my documents?",
      prompt: "Where do I find proposals, invoices, and contracts shared by my freelancer?",
      icon: iconSm(IconFileText),
    },
    {
      label: "How do I check my project status?",
      prompt: "How can I track the progress of my project? Where do I see tasks and updates?",
      icon: iconSm(IconChartBar),
    },
    {
      label: "How do I upload assets for my project?",
      prompt: "I need to share my logo, brand assets, and reference files with my freelancer. How do I upload them?",
      icon: iconSm(IconNotes),
    },
    {
      label: "How do I message my freelancer?",
      prompt: "How can I chat with my freelancer directly within a workspace?",
      icon: iconSm(IconMessageCircle),
    },
  ];
}

export default function AIAssistant({ userRole, workspaceId: propWorkspaceId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Workspace context — can come from prop OR from custom event broadcast
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(propWorkspaceId || "");
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);

  // Listen for custom event from workspace pages
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.workspaceId) {
        setActiveWorkspaceId(detail.workspaceId);
      }
    };
    window.addEventListener("ai-workspace-context", handler);
    return () => window.removeEventListener("ai-workspace-context", handler);
  }, []);

  // Also listen for the existing open-ai-assistant event
  useEffect(() => {
    const openHandler = () => setIsOpen(true);
    window.addEventListener("open-ai-assistant", openHandler);
    return () => window.removeEventListener("open-ai-assistant", openHandler);
  }, []);

  // Fetch workspace snapshot when activeWorkspaceId changes
  useEffect(() => {
    if (!activeWorkspaceId) {
      setSnapshot(null);
      return;
    }
    let cancelled = false;
    const fetchSnapshot = async () => {
      setLoadingSnapshot(true);
      try {
        // Fetch workspace with participants
        const { data: ws } = await supabase
          .from("workspaces")
          .select(
            "*, client:profiles!workspaces_client_id_fkey(full_name), freelancer:profiles!workspaces_freelancer_id_fkey(full_name)"
          )
          .eq("id", activeWorkspaceId)
          .single();

        if (!ws || cancelled) { setLoadingSnapshot(false); return; }

        const typed = ws as typeof ws & {
          client?: { full_name?: string };
          freelancer?: { full_name?: string };
        };

        // Fetch task counts
        const { data: tasks } = await supabase
          .from("tasks")
          .select("status")
          .eq("workspace_id", activeWorkspaceId);

        // Fetch message count
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspaceId);

        // Fetch document types
        const { data: docs } = await supabase
          .from("workspace_documents")
          .select("type")
          .eq("workspace_id", activeWorkspaceId);

        // Fetch project brief summary
        let briefSummary = "";
        if (ws.request_id) {
          const { data: req } = await supabase
            .from("project_requests")
            .select("form_data")
            .eq("id", ws.request_id)
            .single();
          if (req?.form_data) {
            const fd = req.form_data as Record<string, unknown>;
            const parts: string[] = [];
            if (fd.project_name) parts.push(String(fd.project_name));
            if (fd.project_type) parts.push(String(fd.project_type));
            if (fd.budget_range) parts.push(`Budget: ${fd.budget_range}`);
            if (fd.industry) parts.push(`Industry: ${fd.industry}`);
            briefSummary = parts.join(" • ");
          }
        }

        if (!cancelled) {
          setSnapshot({
            id: activeWorkspaceId,
            name: ws.name || "",
            projectType: ws.project_type || "",
            status: ws.status || "",
            pipelineStage: ws.pipeline_stage || "",
            clientName: typed.client?.full_name || "",
            freelancerName: typed.freelancer?.full_name || "",
            taskCount: tasks?.length || 0,
            completedTaskCount: tasks?.filter((t: { status: string }) => t.status === "completed").length || 0,
            messageCount: msgCount || 0,
            hasProposal: docs?.some((d: { type: string }) => d.type === "proposal") || false,
            hasInvoice: docs?.some((d: { type: string }) => d.type === "invoice") || false,
            hasContract: docs?.some((d: { type: string }) => d.type === "contract") || false,
            briefSummary,
          });
        }
      } catch (err) {
        console.error("Failed to load workspace snapshot for AI:", err);
      }
      setLoadingSnapshot(false);
    };
    fetchSnapshot();
    return () => { cancelled = true; };
  }, [activeWorkspaceId]);

  // Generate context-aware suggestions based on role + workspace snapshot
  const suggestions: Suggestion[] = useMemo(() => {
    if (userRole === "freelancer") {
      return getFreelancerSuggestions(snapshot);
    }
    return getClientSuggestions(snapshot);
  }, [userRole, snapshot]);

  // Welcome subtitle based on context
  const welcomeSubtitle = useMemo(() => {
    if (snapshot) {
      return userRole === "freelancer"
        ? `Working on "${snapshot.name}" — ask me anything about this project.`
        : `Viewing "${snapshot.name}" — I can help with documents, status, and more.`;
    }
    return userRole === "freelancer"
      ? "Ask me about proposals, invoices, contracts, client management, or task tracking."
      : "Ask me about your documents, project status, or how to use the platform.";
  }, [userRole, snapshot]);

  // Load conversation history when opened
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      // Focus input after a short delay
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error loading history:", error);
      } else if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
    setIsLoadingHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        role: "user",
        content: userMessage,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          workspaceId: activeWorkspaceId,
          userRole,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Reload history to get proper IDs
      await loadHistory();
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("Clear all conversation history?")) return;

    try {
      await supabase.from("ai_conversations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      setMessages([]);
    } catch (error) {
      console.error("Error clearing history:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-90"
            : "bg-gradient-to-r from-purple-500 to-brand-accent hover:shadow-xl hover:scale-110"
        }`}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <IconX size={24} className="text-white" />
        ) : (
          <IconSparkles size={24} className="text-white" />
        )}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-brand-light flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-light bg-gradient-to-r from-purple-50 to-brand-light">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-brand-accent flex items-center justify-center">
                <IconRobot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-brand-dark">AI Assistant</h3>
                <p className="text-[11px] text-text-tertiary">Powered by ClientFlow AI</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="p-2 hover:bg-red-50 text-text-tertiary hover:text-red-500 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <IconTrash size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Assistant"
                className="p-2 hover:bg-brand-light/50 text-text-tertiary rounded-lg transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-surface" aria-live="polite" aria-label="AI Assistant conversation">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <IconLoader2 size={24} className="animate-spin text-brand-accent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconSparkles size={32} className="text-purple-500" />
                </div>
                <p className="text-[14px] font-medium text-brand-dark mb-2">
                  {snapshot ? `Working on ${snapshot.name}` : "How can I help you today?"}
                </p>
                <p className="text-[12px] text-text-secondary max-w-[280px] mx-auto">
                  {welcomeSubtitle}
                </p>
                <div className="mt-6 space-y-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(s.prompt); inputRef.current?.focus(); }}
                      className="block w-full text-left text-[12px] p-3 rounded-lg bg-white border border-brand-light hover:border-brand-accent hover:shadow-sm transition-all text-text-secondary"
                    >
                      <span className="flex items-center gap-2">
                        {s.icon}
                        <span>{s.label}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === "user"
                        ? "bg-brand-accent"
                        : "bg-gradient-to-r from-purple-500 to-brand-accent"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <IconUser size={16} className="text-white" />
                    ) : (
                      <IconRobot size={16} className="text-white" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-brand-accent text-white rounded-tr-sm"
                        : "bg-white border border-brand-light text-brand-dark rounded-tl-sm"
                    }`}
                  >
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className={i > 0 ? "mt-1" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-brand-accent flex items-center justify-center flex-shrink-0">
                  <IconRobot size={16} className="text-white" />
                </div>
                <div className="bg-white border border-brand-light rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                    <IconLoader2 size={14} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-brand-light bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-brand-surface border border-brand-light rounded-xl px-4 py-3 text-[13px] outline-none focus:border-brand-accent transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-11 h-11 bg-gradient-to-r from-purple-500 to-brand-accent rounded-xl flex items-center justify-center text-white disabled:opacity-50 hover:shadow-md transition-all"
              >
                {loading ? (
                  <IconLoader2 size={18} className="animate-spin" />
                ) : (
                  <IconSend size={18} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
