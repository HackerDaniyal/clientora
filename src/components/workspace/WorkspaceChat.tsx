"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { IconMessageCircle, IconPaperclip, IconSend } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase";
import { sendMessage } from "@/app/workspace/[id]/actions";
import MessageStatusTicks from "./MessageStatusTicks";
import {
  formatMessageDay,
  formatMessageTime,
  getOutgoingMessageStatus,
  isSameDay,
  type MessageReadReceipt,
} from "@/lib/chat/message-status";
import { upsertMessageReceipts } from "@/lib/chat/message-receipts";

export type ChatMessage = {
  id: string;
  workspace_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
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

const MESSAGE_SELECT = `
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const markedDeliveredRef = useRef<Set<string>>(new Set());
  const markedReadRef = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

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
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (fallback.data) {
          const mapped = mapMessageRows(fallback.data as Record<string, unknown>[]);
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

  useEffect(() => {
    scrollToBottom(messages.length <= initialMessages.length ? "auto" : "smooth");
  }, [messages, scrollToBottom, initialMessages.length]);

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
        () => {
          void fetchMessages();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reads",
        },
        () => {
          void fetchMessages();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void fetchMessages();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, supabase, fetchMessages]);

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

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !currentUserId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      workspace_id: workspaceId,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      sender: { full_name: currentUserName },
      reads: [],
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    setSending(true);
    scrollToBottom();

    try {
      await sendMessage(workspaceId, text);
      await fetchMessages();
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(text);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="card bg-white flex flex-col overflow-hidden"
      style={{ height: "calc(100vh - 300px)", minHeight: "420px" }}
    >
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6"
        onScroll={() => markVisibleAsRead()}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <IconMessageCircle size={48} className="mx-auto text-text-tertiary opacity-20 mb-3" />
            <p className="text-text-secondary">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {messages.map((message, index) => {
              const isOwn = message.sender_id === currentUserId;
              const prev = index > 0 ? messages[index - 1] : null;
              const showDay = !prev || !isSameDay(prev.created_at, message.created_at);
              const status = isOwn
                ? getOutgoingMessageStatus(
                    message.id,
                    message.sender_id,
                    message.reads,
                    participantIds
                  )
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
                    className={`flex w-full py-0.5 ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[min(85%,420px)] flex-col gap-0.5 ${
                        isOwn ? "items-end" : "items-start"
                      }`}
                    >
                      {!isOwn && (
                        <span className="text-[11px] font-medium text-text-tertiary px-1">
                          {message.sender?.full_name || "Unknown"}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
                          isOwn
                            ? "bg-brand-dark text-white rounded-br-md"
                            : "bg-brand-surface text-brand-dark border border-brand-light rounded-bl-md"
                        } ${message.id.startsWith("temp-") ? "opacity-80" : ""}`}
                      >
                        {message.content}
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
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {!receiptsAvailable && (
        <p className="px-4 py-1 text-[10px] text-amber-700 bg-amber-50 border-t border-amber-100">
          Read receipts unavailable — run{" "}
          <code className="text-[10px]">docs/migrations/20260530_message_reads.sql</code> in
          Supabase.
        </p>
      )}

      {canSend ? (
        <div className="border-t border-brand-light/50 p-4 bg-white">
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="p-2.5 hover:bg-brand-light/30 rounded-lg transition-colors shrink-0"
              aria-label="Attach file"
            >
              <IconPaperclip size={20} className="text-text-secondary" />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-brand-surface border border-brand-light rounded-full px-4 py-2.5 text-[14px] outline-none focus:border-brand-accent"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={sending}
            />
            <button
              type="button"
              onClick={() => void handleSendMessage()}
              disabled={sending || !newMessage.trim()}
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
    </div>
  );
}
