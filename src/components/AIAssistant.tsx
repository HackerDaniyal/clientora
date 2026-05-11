"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconX,
  IconSend,
  IconTrash,
  IconUser,
  IconRobot,
  IconLoader2,
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

export default function AIAssistant({ userRole, workspaceId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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
          workspaceId,
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
        title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? (
          <IconX size={24} className="text-white" />
        ) : (
          <IconSparkles size={24} className="text-white" />
        )}
      </button>

      {/* Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-brand-light flex flex-col overflow-hidden animate-fade-in">
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
                className="p-2 hover:bg-brand-light/50 text-text-tertiary rounded-lg transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-surface">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <IconLoader2 size={24} className="animate-spin text-brand-accent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconSparkles size={32} className="text-purple-500" />
                </div>
                <p className="text-[14px] font-medium text-brand-dark mb-2">How can I help you today?</p>
                <p className="text-[12px] text-text-secondary max-w-[280px] mx-auto">
                  {userRole === "freelancer"
                    ? "Ask me about proposals, invoices, contracts, client management, or task tracking."
                    : "Ask me about your documents, project status, or how to use the platform."}
                </p>
                <div className="mt-6 space-y-2">
                  {userRole === "freelancer" ? (
                    <>
                      <button
                        onClick={() => { setInput("How do I create a proposal?"); inputRef.current?.focus(); }}
                        className="block w-full text-left text-[12px] p-3 rounded-lg bg-white border border-brand-light hover:border-brand-accent hover:shadow-sm transition-all text-text-secondary"
                      >
                        How do I create a proposal?
                      </button>
                      <button
                        onClick={() => { setInput("How do I track project progress?"); inputRef.current?.focus(); }}
                        className="block w-full text-left text-[12px] p-3 rounded-lg bg-white border border-brand-light hover:border-brand-accent hover:shadow-sm transition-all text-text-secondary"
                      >
                        How do I track project progress?
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setInput("Where can I see my documents?"); inputRef.current?.focus(); }}
                        className="block w-full text-left text-[12px] p-3 rounded-lg bg-white border border-brand-light hover:border-brand-accent hover:shadow-sm transition-all text-text-secondary"
                      >
                        Where can I see my documents?
                      </button>
                      <button
                        onClick={() => { setInput("How do I check project status?"); inputRef.current?.focus(); }}
                        className="block w-full text-left text-[12px] p-3 rounded-lg bg-white border border-brand-light hover:border-brand-accent hover:shadow-sm transition-all text-text-secondary"
                      >
                        How do I check project status?
                      </button>
                    </>
                  )}
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
