"use client";

import React, { useState } from "react";
import { IconCopy, IconCheck } from "@tabler/icons-react";

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className="p-2 text-text-secondary hover:text-brand-dark hover:bg-brand-light/20 rounded-small transition-all"
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <IconCheck size={18} stroke={2} className="text-brand-accent" />
      ) : (
        <IconCopy size={18} stroke={2} />
      )}
    </button>
  );
}
