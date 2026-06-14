"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase";
import { IconTag, IconX, IconPlus } from "@tabler/icons-react";

const PRESET_TAGS = [
  { label: "VIP", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  { label: "High Value", color: "bg-green-100 text-green-700 border-green-200" },
  { label: "At Risk", color: "bg-red-100 text-red-700 border-red-200" },
  { label: "New", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Recurring", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Inactive", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

function tagColor(label: string) {
  return PRESET_TAGS.find((t) => t.label === label)?.color || "bg-brand-accent/10 text-brand-dark border-brand-accent/20";
}

export default function ClientTagManager({
  freelancerId,
  clientId,
  initialTags,
}: {
  freelancerId: string;
  clientId: string;
  initialTags: string[];
}) {
  const supabase = createClient();
  const [tags, setTags] = useState<string[]>(initialTags);
  const [showPicker, setShowPicker] = useState(false);
  const [customTag, setCustomTag] = useState("");

  const addTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || tags.includes(trimmed)) return;
    await supabase
      .from("client_tags")
      .upsert({ freelancer_id: freelancerId, client_id: clientId, tag: trimmed });
    setTags((prev) => [...prev, trimmed]);
    setCustomTag("");
  };

  const removeTag = async (tag: string) => {
    await supabase
      .from("client_tags")
      .delete()
      .eq("freelancer_id", freelancerId)
      .eq("client_id", clientId)
      .eq("tag", tag);
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tagColor(tag)}`}
          >
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:opacity-70 ml-0.5">
              <IconX size={10} />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-text-tertiary border border-dashed border-brand-light hover:border-brand-accent hover:text-brand-accent transition-colors"
        >
          <IconTag size={10} />
          Add tag
        </button>
      </div>

      {showPicker && (
        <div className="absolute z-20 top-8 left-0 bg-white border border-brand-light rounded-xl shadow-xl p-3 w-56">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Quick Tags</p>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_TAGS.filter((p) => !tags.includes(p.label)).map((preset) => (
              <button
                key={preset.label}
                onClick={() => { addTag(preset.label); setShowPicker(false); }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${preset.color} hover:opacity-80 transition-opacity`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { addTag(customTag); setShowPicker(false); } }}
              className="input-field flex-1 text-[11px] py-1 px-2"
              placeholder="Custom tag..."
            />
            <button
              onClick={() => { addTag(customTag); setShowPicker(false); }}
              className="pill-btn text-[11px] px-2 py-1"
            >
              <IconPlus size={12} />
            </button>
          </div>
          <button onClick={() => setShowPicker(false)} className="mt-2 w-full text-[10px] text-text-tertiary hover:text-brand-dark">Close</button>
        </div>
      )}
    </div>
  );
}
