"use client";

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IconMessageCircle,
  IconPaperclip,
  IconSend,
  IconSearch,
  IconX,
  IconCornerUpRight,
  IconFile,
  IconDownload,
  IconMoodSmile,
  IconEye,
  IconFileText,
  IconExternalLink,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";
import {
  sendMessage,
  toggleMessageReaction,
  uploadChatAttachment,
} from "@/app/workspace/[id]/actions";
import MessageStatusTicks from "./MessageStatusTicks";
import {
  formatMessageDay,
  formatMessageTime,
  getOutgoingMessageStatus,
  isSameDay,
  type MessageReadReceipt,
} from "@/lib/chat/message-status";
import { upsertMessageReceipts } from "@/lib/chat/message-receipts";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ChatMessage = {
  id: string;
  workspace_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  reply_to_id?: string | null;
  reactions?: Record<string, string[]>;
  sender?: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
  reads?: MessageReadReceipt[];
};

type WorkspaceChatProps = {
  workspaceId: string;
  initialMessages: ChatMessage[];
  participantIds: string[];
  canSend: boolean;
  onMessagesUpdated?: (messages: ChatMessage[]) => void;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

const MESSAGE_SELECT = `
  id,
  workspace_id,
  sender_id,
  content,
  created_at,
  file_url,
  file_name,
  reply_to_id,
  reactions,
  sender:profiles!messages_sender_id_fkey(full_name, avatar_url),
  reads:message_reads(user_id, delivered_at, read_at)
`;

const FALLBACK_SELECT = `
  id,
  workspace_id,
  sender_id,
  content,
  created_at,
  file_url,
  file_name,
  reply_to_id,
  reactions,
  sender:profiles!messages_sender_id_fkey(full_name, avatar_url)
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapMessageRows(data: Record<string, unknown>[]): ChatMessage[] {
  return data.map((row) => {
    const sender = row.sender as ChatMessage["sender"] | ChatMessage["sender"][];
    const reads = row.reads as MessageReadReceipt[] | MessageReadReceipt[][] | undefined;
    let normalizedReads: MessageReadReceipt[] = [];
    if (Array.isArray(reads)) {
      normalizedReads = reads.flatMap((r) =>
        Array.isArray(r) ? r : [r]
      ) as MessageReadReceipt[];
    }
    return {
      ...(row as ChatMessage),
      sender: Array.isArray(sender) ? sender[0] ?? null : sender,
      reads: normalizedReads,
    };
  });
}

// highlightText used for search result highlighting
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _highlightText(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function WorkspaceChat({
  workspaceId,
  initialMessages,
  participantIds,
  canSend,
  onMessagesUpdated,
}: WorkspaceChatProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("You");
  const [receiptsAvailable, setReceiptsAvailable] = useState(true);

  // Reply
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // File attachment
  const [pendingFile, setPendingFile] = useState<{ url: string; name: string } | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" } | null>(null);
  const showToast = (msg: string, type: "error" | "success" = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reactions
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);

  // File preview
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  // Typing indicator
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null); // eslint-disable-line @typescript-eslint/no-unused-vars
  const lastTypingBroadcastRef = useRef<number>(0);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const markedDeliveredRef = useRef<Set<string>>(new Set());
  const markedReadRef = useRef<Set<string>>(new Set());
  const isNearBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  /* ------ scroll helpers ------ */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 120;
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  /* ------ fetch messages ------ */
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) {
      if (error.code === "PGRST200" || error.message?.includes("message_reads")) {
        setReceiptsAvailable(false);
        const fallback = await supabase
          .from("messages")
          .select(FALLBACK_SELECT)
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (fallback.data) {
          const mapped = mapMessageRows(fallback.data as Record<string, unknown>[]);
          setMessages(mapped);
          onMessagesUpdated?.(mapped);
        }
      } else if (error.code === "42703" || error.message?.includes("reply_to_id") || error.message?.includes("reactions")) {
        // New columns don't exist yet — fallback without them
        const fallback2 = await supabase
          .from("messages")
          .select(FALLBACK_SELECT.replace(", reply_to_id, reactions", ""))
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (fallback2.data) {
          const mapped = mapMessageRows(fallback2.data as unknown as Record<string, unknown>[]);
          setMessages(mapped);
          onMessagesUpdated?.(mapped);
        }
      } else {
        console.error("fetchMessages:", error);
      }
      return;
    }

    if (data) {
      const mapped = mapMessageRows(data as Record<string, unknown>[]);
      setMessages(mapped);
      onMessagesUpdated?.(mapped);
    }
  }, [supabase, workspaceId, onMessagesUpdated]);

  /* ------ read receipts ------ */
  const markReceipts = useCallback(
    async (messageIds: string[], kind: "delivered" | "read") => {
      if (!currentUserId || !receiptsAvailable || messageIds.length === 0) return;

      const ref = kind === "delivered" ? markedDeliveredRef : markedReadRef;
      const toMark = messageIds.filter((id) => !id.startsWith("temp-") && !ref.current.has(id));
      if (toMark.length === 0) return;

      const now = new Date().toISOString();
      const { error } = await upsertMessageReceipts(supabase, toMark, currentUserId, kind);
      if (error) {
        if (error.code === "42P01") setReceiptsAvailable(false);
        return;
      }

      toMark.forEach((id) => ref.current.add(id));

      if (kind === "read") {
        setMessages((prev) =>
          prev.map((m) => {
            if (!toMark.includes(m.id)) return m;
            const reads = [...(m.reads ?? [])];
            const idx = reads.findIndex((r) => r.user_id === currentUserId);
            const receipt: MessageReadReceipt = {
              user_id: currentUserId,
              delivered_at: now,
              read_at: now,
            };
            if (idx >= 0) reads[idx] = { ...reads[idx], ...receipt };
            else reads.push(receipt);
            return { ...m, reads };
          })
        );
      }
    },
    [currentUserId, receiptsAvailable, supabase]
  );

  const markVisibleAsRead = useCallback(() => {
    if (!currentUserId) return;
    const ids = messages
      .filter((m) => m.sender_id !== currentUserId && !m.id.startsWith("temp-"))
      .map((m) => m.id);
    void markReceipts(ids, "read");
  }, [currentUserId, messages, markReceipts]);

  /* ------ init user ------ */
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (profile?.full_name) setCurrentUserName(profile.full_name);
    };
    void init();
  }, [supabase]);

  /* ------ auto-scroll ------ */
  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom(messages.length <= initialMessages.length ? "auto" : "smooth");
    } else {
      const el = scrollContainerRef.current;
      if (el) {
        const diff = el.scrollHeight - prevScrollHeightRef.current;
        if (diff > 0) el.scrollTop += diff;
      }
    }
    prevScrollHeightRef.current = scrollContainerRef.current?.scrollHeight ?? 0;
  }, [messages, scrollToBottom, initialMessages.length]);

  /* ------ realtime: messages ------ */
  useEffect(() => {
    const channel = supabase
      .channel(`workspace-messages-${workspaceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => { void fetchMessages(); }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `workspace_id=eq.${workspaceId}` },
        () => { void fetchMessages(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reads" },
        () => { void fetchMessages(); }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void fetchMessages();
      });

    return () => { supabase.removeChannel(channel); };
  }, [workspaceId, supabase, fetchMessages]);

  /* ------ realtime: typing indicator via broadcast ------ */
  useEffect(() => {
    if (!currentUserId || !currentUserName) return;

    const channel = supabase.channel(`typing-${workspaceId}`);
    typingChannelRef.current = channel;

    channel.on("broadcast", { event: "typing" }, ({ payload }) => {
      const { userId, userName } = payload as { userId: string; userName: string };
      if (userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, userName);
        return next;
      });
      // Auto-clear after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }, 3000);
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, currentUserId, currentUserName, supabase]);

  /* ------ delivered receipts ------ */
  useEffect(() => {
    if (!currentUserId || !receiptsAvailable) return;
    const incoming = messages
      .filter((m) => m.sender_id !== currentUserId && !m.id.startsWith("temp-"))
      .map((m) => m.id)
      .filter((id) => !markedDeliveredRef.current.has(id));
    if (incoming.length > 0) {
      void upsertMessageReceipts(supabase, incoming, currentUserId, "delivered").then(
        ({ error }) => {
          if (!error) incoming.forEach((id) => markedDeliveredRef.current.add(id));
        }
      );
    }
  }, [messages, currentUserId, receiptsAvailable, supabase]);

  useEffect(() => {
    if (currentUserId) void markVisibleAsRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  /* ------ typing broadcast on input change ------ */
  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current < 2000) return;
    lastTypingBroadcastRef.current = now;
    typingChannelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUserId, userName: currentUserName },
    });
  }, [currentUserId, currentUserName]);

  /* ------ send message ------ */
  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if ((!text && !pendingFile) || !currentUserId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      workspace_id: workspaceId,
      sender_id: currentUserId,
      content: text || (pendingFile ? `📎 ${pendingFile.name}` : ""),
      created_at: new Date().toISOString(),
      file_url: pendingFile?.url,
      file_name: pendingFile?.name,
      reply_to_id: replyTo?.id,
      reactions: {},
      sender: { full_name: currentUserName },
      reads: [],
    };

    setMessages((prev) => [...prev, optimistic]);
    const textToSend = text;
    const fileToSend = pendingFile;
    const replyToSend = replyTo;
    setNewMessage("");
    setPendingFile(null);
    setReplyTo(null);
    setSending(true);
    isNearBottomRef.current = true;
    scrollToBottom();

    try {
      await sendMessage(
        workspaceId,
        textToSend || (fileToSend ? `📎 ${fileToSend.name}` : ""),
        fileToSend?.url,
        fileToSend?.name,
        replyToSend?.id
      );
      await fetchMessages();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(textToSend);
      setPendingFile(fileToSend);
      setReplyTo(replyToSend);
      showToast("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  /* ------ file attachment ------ */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset input

    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large. Maximum size is 10MB.");
      return;
    }

    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('workspaceId', workspaceId);
      fd.append('file', file);
      const result = await uploadChatAttachment(fd);
      setPendingFile(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast(msg || "Upload failed");
    } finally {
      setUploadingFile(false);
    }
  };

  /* ------ reaction toggle ------ */
  const handleReactionToggle = async (messageId: string, emoji: string) => {
    setReactionPickerFor(null);
    try {
      await toggleMessageReaction(messageId, emoji);
      await fetchMessages();
    } catch {
      // silent fail
    }
  };

  /* ------ search filtered messages ------ */
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) =>
      m.content.toLowerCase().includes(q) ||
      m.sender?.full_name?.toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  /* ------ typing users list ------ */
  const typingNames = useMemo(() => {
    const names = Array.from(typingUsers.values());
    if (names.length === 0) return "";
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  }, [typingUsers]);

  /* ------ reply preview lookup ------ */
  const getReplyPreview = useCallback(
    (replyId: string) => messages.find((m) => m.id === replyId),
    [messages]
  );

  /* ================================================================= */
  /*  RENDER                                                            */
  /* ================================================================= */
  return (
    <div
      className="card bg-white flex flex-col overflow-hidden relative"
      style={{ height: "calc(100vh - 300px)", minHeight: "420px" }}
    >
      {/* ---- Toast notification ---- */}
      {toast && (
        <div
          className={`absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-lg shadow-md text-[13px] font-medium flex items-center gap-2 animate-[fadeInDown_0.2s_ease] ${
            toast.type === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <IconX size={14} />
          </button>
        </div>
      )}

      {/* ---- Search bar ---- */}
      <div className="border-b border-brand-light/50 px-4 py-2 flex items-center gap-2">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <IconSearch size={16} className="text-text-tertiary shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-text-tertiary"
              autoFocus
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="p-1 hover:bg-brand-light/30 rounded"
            >
              <IconX size={14} className="text-text-secondary" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <button
              onClick={() => setSearchOpen(true)}
              className="p-1.5 hover:bg-brand-light/30 rounded-lg transition-colors"
              title="Search messages"
            >
              <IconSearch size={16} className="text-text-secondary" />
            </button>
          </>
        )}
      </div>

      {/* ---- Messages area ---- */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
        onScroll={() => { handleScroll(); markVisibleAsRead(); }}
      >
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <IconMessageCircle size={48} className="mx-auto text-text-tertiary opacity-20 mb-3" />
            <p className="text-text-secondary">
              {searchQuery ? "No messages match your search." : "No messages yet. Start the conversation!"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {filteredMessages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const prev = index > 0 ? filteredMessages[index - 1] : null;
              const showDay = !prev || !isSameDay(prev.created_at, message.created_at);
              const status = isOwn
                ? getOutgoingMessageStatus(
                    message.id,
                    message.sender_id,
                    message.reads,
                    participantIds
                  )
                : null;
              const replyPreview = message.reply_to_id
                ? getReplyPreview(message.reply_to_id)
                : null;

              return (
                <React.Fragment key={message.id}>
                  {showDay && (
                    <div className="flex justify-center py-3">
                      <span className="rounded-pill bg-brand-surface px-3 py-1 text-[11px] font-medium text-text-secondary">
                        {formatMessageDay(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div
                    className={`group flex w-full py-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[min(85%,420px)] flex-col gap-0.5 ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Sender name */}
                      {!isOwn && (
                        <span className="text-[11px] font-medium text-text-tertiary px-1">
                          {message.sender?.full_name || "Unknown"}
                        </span>
                      )}

                      {/* Reply preview */}
                      {replyPreview && (
                        <div
                          className={`w-full rounded-lg px-3 py-1.5 text-[11px] mb-0.5 border-l-2 ${
                            isOwn
                              ? "bg-white/10 border-white/30 text-white/70"
                              : "bg-gray-50 border-brand-accent/40 text-text-tertiary"
                          }`}
                        >
                          <span className="font-medium">
                            {replyPreview.sender?.full_name || "Unknown"}
                          </span>
                          <span className="ml-1.5 truncate">
                            {replyPreview.content.length > 60
                              ? replyPreview.content.slice(0, 60) + "…"
                              : replyPreview.content}
                          </span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                          isOwn
                            ? "bg-brand-dark text-white rounded-br-md"
                            : "bg-brand-surface text-brand-dark border border-brand-light rounded-bl-md"
                        } ${message.id.startsWith("temp-") ? "opacity-80" : ""}`}
                      >
                        {/* File attachment */}
                        {message.file_url && message.file_name && (
                          (() => {
                            const ext = message.file_name!.split(".").pop()?.toLowerCase() || "";
                            const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
                            const isPdf = ext === "pdf";

                            return (
                              <div className={`mb-1.5 rounded-lg overflow-hidden ${
                                isOwn ? "bg-white/10" : "bg-gray-50"
                              }`}>
                                {/* Image thumbnail */}
                                {isImage && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewFile({ url: message.file_url!, name: message.file_name! })}
                                    className="w-full block"
                                  >
                                    <img
                                      src={message.file_url!}
                                      alt={message.file_name!}
                                      className="w-full max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  </button>
                                )}

                                {/* File info row */}
                                <div className="flex items-center gap-2 p-2">
                                  {isImage ? (
                                    <IconEye size={16} className={isOwn ? "text-white/70" : "text-brand-accent"} />
                                  ) : (
                                    <IconFile size={16} className={isOwn ? "text-white/70" : "text-text-tertiary"} />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isImage || isPdf) {
                                        setPreviewFile({ url: message.file_url!, name: message.file_name! });
                                      } else {
                                        window.open(message.file_url!, "_blank");
                                      }
                                    }}
                                    className={`text-[12px] truncate flex-1 text-left hover:underline ${
                                      isOwn ? "text-white/80" : "text-text-secondary"
                                    }`}
                                  >
                                    {message.file_name}
                                  </button>
                                  {isImage && (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewFile({ url: message.file_url!, name: message.file_name! })}
                                      className={`p-1 rounded transition-colors ${
                                        isOwn ? "hover:bg-white/20 text-white/70" : "hover:bg-gray-100 text-text-tertiary"
                                      }`}
                                      title="Preview"
                                    >
                                      <IconEye size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(message.file_url!);
                                        const blob = await res.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = blobUrl;
                                        a.download = message.file_name!;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(blobUrl);
                                      } catch {
                                        window.open(message.file_url!, "_blank");
                                      }
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      isOwn ? "hover:bg-white/20 text-white/70" : "hover:bg-gray-100 text-text-tertiary"
                                    }`}
                                    title="Download"
                                  >
                                    <IconDownload size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* Message content with Markdown */}
                        <div className={`prose-chat ${isOwn ? "text-white" : "text-brand-dark"}`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <span>{children}</span>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em>{children}</em>,
                              code: ({ className, children }) => {
                                const isBlock = className?.includes("language-");
                                if (isBlock) {
                                  return (
                                    <pre className={`my-1.5 p-2 rounded-lg text-[12px] overflow-x-auto ${
                                      isOwn ? "bg-white/10 text-white/90" : "bg-gray-100 text-gray-800"
                                    }`}>
                                      <code>{children}</code>
                                    </pre>
                                  );
                                }
                                return (
                                  <code className={`px-1 py-0.5 rounded text-[12px] ${
                                    isOwn ? "bg-white/15 text-white/90" : "bg-gray-100 text-gray-800"
                                  }`}>
                                    {children}
                                  </code>
                                );
                              },
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer"
                                  className={`underline ${isOwn ? "text-white/90" : "text-brand-accent"}`}>
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Timestamp + status */}
                        <div
                          className={`mt-1 flex items-center justify-end gap-1 ${
                            isOwn ? "text-white/70" : "text-text-tertiary"
                          }`}
                        >
                          <time
                            dateTime={message.created_at}
                            className="text-[10px]"
                            title={new Date(message.created_at).toLocaleString()}
                          >
                            {formatMessageTime(message.created_at)}
                          </time>
                          {isOwn && status && (
                            <MessageStatusTicks status={status} className="shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Reactions display */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {Object.entries(message.reactions).map(([emoji, userIds]) => (
                            <button
                              key={emoji}
                              onClick={() => canSend && handleReactionToggle(message.id, emoji)}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] border transition-colors ${
                                userIds.includes(currentUserId || "")
                                  ? isOwn
                                    ? "bg-white/20 border-white/30 text-white"
                                    : "bg-brand-accent/10 border-brand-accent/30 text-brand-dark"
                                  : "bg-gray-50 border-gray-200 text-text-secondary hover:bg-gray-100"
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-medium">{userIds.length}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action buttons (on hover) */}
                      {canSend && !message.id.startsWith("temp-") && (
                        <div className={`flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                          isOwn ? "flex-row-reverse" : ""
                        }`}>
                          {/* Reply */}
                          <button
                            onClick={() => setReplyTo(message)}
                            className="p-1 rounded hover:bg-brand-light/40 transition-colors"
                            title="Reply"
                          >
                            <IconCornerUpRight size={14} className="text-text-tertiary" />
                          </button>
                          {/* React */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setReactionPickerFor(reactionPickerFor === message.id ? null : message.id)
                              }
                              className="p-1 rounded hover:bg-brand-light/40 transition-colors"
                              title="Add reaction"
                            >
                              <IconMoodSmile size={14} className="text-text-tertiary" />
                            </button>
                            {reactionPickerFor === message.id && (
                              <div
                                className={`absolute z-20 bottom-full mb-1 ${
                                  isOwn ? "right-0" : "left-0"
                                } bg-white border border-brand-light rounded-xl shadow-lg px-2 py-1.5 flex gap-1`}
                              >
                                {REACTION_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReactionToggle(message.id, emoji)}
                                    className="text-[18px] hover:scale-125 transition-transform p-0.5"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Typing indicator */}
        {typingNames && (
          <div className="flex items-center gap-2 py-2 px-1">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-brand-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[12px] text-text-tertiary italic">{typingNames}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ---- Receipts warning ---- */}
      {!receiptsAvailable && (
        <p className="px-4 py-1 text-[10px] text-amber-700 bg-amber-50 border-t border-amber-100">
          Read receipts unavailable — run{" "}
          <code className="text-[10px]">docs/migrations/20260530_message_reads.sql</code> in Supabase.
        </p>
      )}

      {/* ---- Input area ---- */}
      {canSend ? (
        <div className="border-t border-brand-light/50 bg-white">
          {/* Reply preview */}
          {replyTo && (
            <div className="flex items-center gap-2 px-4 pt-3">
              <div className="flex-1 flex items-center gap-2 bg-brand-surface rounded-lg px-3 py-2 border-l-2 border-brand-accent">
                <IconCornerUpRight size={14} className="text-brand-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-brand-accent">
                    Replying to {replyTo.sender?.full_name || "Unknown"}
                  </span>
                  <p className="text-[12px] text-text-secondary truncate">{replyTo.content}</p>
                </div>
                <button onClick={() => setReplyTo(null)} className="p-0.5 hover:bg-brand-light/30 rounded">
                  <IconX size={14} className="text-text-tertiary" />
                </button>
              </div>
            </div>
          )}

          {/* Pending file */}
          {pendingFile && (
            <div className="flex items-center gap-2 px-4 pt-2">
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                <IconFile size={14} className="text-blue-600" />
                <span className="text-[12px] text-blue-700 truncate max-w-[200px]">{pendingFile.name}</span>
                <button
                  onClick={() => setPendingFile(null)}
                  className="p-0.5 hover:bg-blue-100 rounded"
                >
                  <IconX size={12} className="text-blue-500" />
                </button>
              </div>
            </div>
          )}

          {/* Input row */}
          <div className="flex gap-2 items-center p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="p-2.5 hover:bg-brand-light/30 rounded-lg transition-colors shrink-0 disabled:opacity-50"
              aria-label="Attach file"
            >
              <IconPaperclip size={20} className="text-text-secondary" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt,.zip,.xls,.xlsx,.ppt,.pptx"
            />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                broadcastTyping();
              }}
              placeholder={
                uploadingFile
                  ? "Uploading file..."
                  : "Type a message... (Markdown supported: **bold**, *italic*, `code`)"
              }
              className="flex-1 bg-brand-surface border border-brand-light rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-brand-accent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={sending || uploadingFile}
            />
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={sending || (!newMessage.trim() && !pendingFile)}
              className="pill-btn bg-brand-mid hover:bg-brand-green text-white rounded-full w-11 h-11 p-0 flex items-center justify-center shrink-0 disabled:opacity-50"
              aria-label="Send message"
            >
              <IconSend size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-brand-light/50 p-4 text-center text-[13px] text-text-secondary">
          You have read-only access to this chat.
        </div>
      )}
      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2 min-w-0">
                <IconFileText size={18} className="text-brand-mid shrink-0" />
                <span className="text-[14px] font-medium text-brand-dark truncate">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(previewFile.url);
                      const blob = await res.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = blobUrl;
                      a.download = previewFile.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(blobUrl);
                    } catch {
                      window.open(previewFile.url, "_blank");
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-text-secondary"
                  title="Download"
                >
                  <IconDownload size={18} />
                </button>
                <a
                  href={previewFile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-text-secondary"
                  title="Open in new tab"
                >
                  <IconExternalLink size={18} />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-text-secondary"
                  title="Close"
                >
                  <IconX size={18} />
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="overflow-auto max-h-[calc(90vh-60px)]">
              {(() => {
                const ext = previewFile.name.split(".").pop()?.toLowerCase() || "";
                const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext);
                const isPdf = ext === "pdf";
                const isVideo = ["mp4", "webm", "ogg"].includes(ext);
                const isAudio = ["mp3", "wav", "ogg", "aac"].includes(ext);

                if (isImage) {
                  return (
                    <div className="flex items-center justify-center p-4 bg-gray-900 min-h-[300px]">
                      <img
                        src={previewFile.url}
                        alt={previewFile.name}
                        className="max-w-full max-h-[calc(90vh-120px)] object-contain"
                      />
                    </div>
                  );
                }
                if (isPdf) {
                  return (
                    <iframe
                      src={`${previewFile.url}#toolbar=1`}
                      className="w-full h-[75vh]"
                      title={previewFile.name}
                    />
                  );
                }
                if (isVideo) {
                  return (
                    <div className="flex items-center justify-center p-4 bg-gray-900 min-h-[300px]">
                      <video controls className="max-w-full max-h-[calc(90vh-120px)]">
                        <source src={previewFile.url} />
                        Your browser does not support video playback.
                      </video>
                    </div>
                  );
                }
                if (isAudio) {
                  return (
                    <div className="flex items-center justify-center p-8">
                      <audio controls className="w-full max-w-md">
                        <source src={previewFile.url} />
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  );
                }
                return (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <IconFile size={48} className="text-text-tertiary mb-4" />
                    <p className="text-[14px] text-text-secondary mb-1">Preview not available for this file type</p>
                    <p className="text-[12px] text-text-tertiary mb-4">.{ext.toUpperCase()} file</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch(previewFile.url);
                          const blob = await res.blob();
                          const blobUrl = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          a.download = previewFile.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(blobUrl);
                        } catch {
                          window.open(previewFile.url, "_blank");
                        }
                      }}
                      className="bg-brand-mid hover:bg-brand-dark text-white font-medium px-6 py-2.5 rounded-full flex items-center gap-2 transition-colors"
                    >
                      <IconDownload size={16} />
                      Download File
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
