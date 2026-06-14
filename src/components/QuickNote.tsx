"use client";

import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { IconNote, IconDeviceFloppy, IconEdit } from "@tabler/icons-react";

export default function QuickNote({
  freelancerId,
  clientId,
  clientName,
}: {
  freelancerId: string;
  clientId: string;
  clientName: string;
}) {
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchNote = async () => {
      const { data } = await supabase
        .from("quick_notes")
        .select("id, content")
        .eq("freelancer_id", freelancerId)
        .eq("client_id", clientId)
        .maybeSingle();
      if (data) {
        setContent(data.content);
        setNoteId(data.id);
      }
    };
    fetchNote();
  }, []);

  useEffect(() => {
    if (editing && textareaRef.current) textareaRef.current.focus();
  }, [editing]);

  const handleSave = async () => {
    setSaving(true);
    if (noteId) {
      await supabase.from("quick_notes").update({ content, updated_at: new Date().toISOString() }).eq("id", noteId);
    } else {
      const { data } = await supabase
        .from("quick_notes")
        .insert({ freelancer_id: freelancerId, client_id: clientId, content })
        .select()
        .single();
      if (data) setNoteId(data.id);
    }
    setSaving(false);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-amber-50 border border-amber-200/70 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconNote size={15} className="text-amber-600" />
          <span className="text-[12px] font-semibold text-amber-700">Quick Note</span>
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-[10px] text-green-600 font-medium animate-fade-in">Saved!</span>}
          {editing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 bg-amber-200/50 rounded-lg px-2 py-1"
            >
              <IconDeviceFloppy size={13} />
              {saving ? "Saving..." : "Save"}
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-600 hover:text-amber-800"
            >
              <IconEdit size={13} />
              Edit
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
            if (e.key === "Enter" && e.metaKey) handleSave();
          }}
          className="w-full bg-transparent text-[12px] text-amber-900 resize-none outline-none min-h-[60px] placeholder-amber-400"
          placeholder={`Notes about ${clientName}... (Cmd+Enter to save)`}
          rows={3}
        />
      ) : (
        <p
          onClick={() => setEditing(true)}
          className="text-[12px] text-amber-800 cursor-text whitespace-pre-wrap min-h-[32px]"
        >
          {content || <span className="text-amber-400/70 italic">Click to add a note...</span>}
        </p>
      )}
    </div>
  );
}
