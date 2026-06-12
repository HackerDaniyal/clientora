"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  IconSearch,
  IconX,
  IconBriefcase,
  IconUsers,
  IconFileText,
  IconLink,
} from "@tabler/icons-react";

interface SearchResult {
  id: string;
  href: string;
  [key: string]: any;
}

interface SearchResults {
  workspaces: (SearchResult & { name: string; type: string; status: string })[];
  clients: (SearchResult & { name: string; email: string })[];
  documents: (SearchResult & { title: string; type: string; workspace_id: string })[];
  referrals: (SearchResult & { code: string; clicks: number })[];
}

interface FlatResult {
  category: string;
  icon: React.ElementType;
  label: string;
  sublabel: string;
  href: string;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; label: string }> = {
  workspaces: { icon: IconBriefcase, label: "Workspaces" },
  clients: { icon: IconUsers, label: "Clients" },
  documents: { icon: IconFileText, label: "Documents" },
  referrals: { icon: IconLink, label: "Referral Codes" },
};

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Flatten results for keyboard navigation
  const flatResults: FlatResult[] = React.useMemo(() => {
    if (!results) return [];
    const flat: FlatResult[] = [];
    for (const [cat, items] of Object.entries(results)) {
      const meta = CATEGORY_META[cat];
      if (!meta) continue;
      for (const item of items) {
        flat.push({
          category: meta.label,
          icon: meta.icon,
          label: item.name || item.title || item.code,
          sublabel:
            cat === "workspaces"
              ? `${item.type} · ${item.status}`
              : cat === "clients"
                ? item.email
                : cat === "documents"
                  ? item.type
                  : `${item.clicks} clicks`,
          href: item.href,
        });
      }
    }
    return flat;
  }, [results]);

  // Open/close with Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setActiveIdx(0);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((prev) => Math.min(prev + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && flatResults[activeIdx]) {
        e.preventDefault();
        router.push(flatResults[activeIdx].href);
        setOpen(false);
      }
    },
    [flatResults, activeIdx, router]
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-brand-light/40 bg-white text-text-tertiary text-[13px] hover:border-brand-accent/40 hover:text-text-secondary transition-colors w-full"
        aria-label="Search (Ctrl+K)"
      >
        <IconSearch size={16} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-brand-light/50 bg-brand-surface text-text-tertiary">
          ⌘K
        </kbd>
      </button>
    );
  }

  if (!mounted) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[9998]"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-start justify-center pt-[15vh] z-[10000] px-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-brand-light/40 overflow-hidden pointer-events-auto relative">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-light/30">
            <IconSearch size={18} className="text-text-tertiary shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search workspaces, clients, documents..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
              aria-label="Search query"
            />
            {loading && (
              <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" role="status" />
            )}
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-brand-surface" aria-label="Close search">
              <IconX size={16} className="text-text-tertiary" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto p-2">
            {query.trim().length >= 2 && !loading && flatResults.length === 0 && (
              <p className="text-center py-8 text-sm text-text-tertiary">
                No results found for &ldquo;{query}&rdquo;
              </p>
            )}

            {query.trim().length < 2 && (
              <p className="text-center py-8 text-sm text-text-tertiary">
                Type at least 2 characters to search
              </p>
            )}

            {(() => {
              let lastCat = "";
              return flatResults.map((r, i) => {
                const showHeader = r.category !== lastCat;
                lastCat = r.category;
                return (
                  <React.Fragment key={`${r.href}-${i}`}>
                    {showHeader && (
                      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                        {r.category}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        router.push(r.href);
                        setOpen(false);
                      }}
                      onMouseEnter={() => setActiveIdx(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        i === activeIdx ? "bg-brand-accent/10" : "hover:bg-brand-surface/50"
                      }`}
                    >
                      <r.icon size={16} className="text-brand-accent shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-brand-dark truncate">{r.label}</p>
                        <p className="text-[11px] text-text-tertiary truncate">{r.sublabel}</p>
                      </div>
                    </button>
                  </React.Fragment>
                );
              });
            })()}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-brand-light/30 flex items-center gap-4 text-[10px] text-text-tertiary">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
