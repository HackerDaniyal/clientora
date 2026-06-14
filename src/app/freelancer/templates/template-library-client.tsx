"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase";
import {
  IconPlus, IconTrash, IconFileDescription, IconFileInvoice, IconFileText,
  IconSearch, IconFilter, IconDownload, IconTemplate,
  IconLayoutGrid, IconCheck, IconChevronRight, IconBuildingStore,
  IconBriefcase, IconPalette, IconCode, IconCamera, IconLeaf,
} from "@tabler/icons-react";
import ProposalTemplate from "@/components/documents/ProposalTemplate";
import InvoiceTemplate from "@/components/documents/InvoiceTemplate";
import ContractTemplate from "@/components/documents/ContractTemplate";
import {
  defaultProposal, defaultInvoice, defaultContract,
  type DocumentType,
} from "@/components/documents/types";
import { PREBUILT_TEMPLATES, type PrebuiltTemplate } from "@/components/documents/prebuiltTemplates";

// Lazy-load the full editor (it's heavy)
const DocumentEditor = dynamic(() => import("@/components/documents/DocumentEditor"), { ssr: false });

type Template = {
  id: string;
  name: string;
  type: "proposal" | "invoice" | "contract";
  content: any;
  created_at: string;
};

const TYPE_CONFIG = {
  proposal: {
    label: "Proposal",
    icon: IconFileDescription,
    accent: "bg-blue-50 border-blue-100",
    badge: "bg-blue-100 text-blue-700",
    headerBg: "from-blue-600 to-blue-700",
  },
  invoice: {
    label: "Invoice",
    icon: IconFileInvoice,
    accent: "bg-green-50 border-green-100",
    badge: "bg-green-100 text-green-700",
    headerBg: "from-emerald-600 to-green-700",
  },
  contract: {
    label: "Contract",
    icon: IconFileText,
    accent: "bg-purple-50 border-purple-100",
    badge: "bg-purple-100 text-purple-700",
    headerBg: "from-purple-600 to-purple-700",
  },
};

const INDUSTRY_ICONS: Record<string, React.ElementType> = {
  "Web Development": IconCode,
  "Branding & Design": IconPalette,
  "Marketing": IconBuildingStore,
  "Consulting": IconBriefcase,
  "Creative Production": IconCamera,
  "Software Development": IconCode,
  "Design Retainer": IconPalette,
  "Content Writing": IconLeaf,
};

function TemplatePreviewCard({
  template,
  onOpen,
  onDelete,
  deleting,
}: {
  template: Template;
  onOpen: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const cfg = TYPE_CONFIG[template.type];
  const Icon = cfg.icon;

  // Render a tiny scaled preview of the actual template
  const previewData =
    template.type === "proposal"
      ? { ...defaultProposal, ...(template.content as any) }
      : template.type === "invoice"
      ? { ...defaultInvoice, ...(template.content as any) }
      : { ...defaultContract, ...(template.content as any) };

  return (
    <div className={`card border rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${cfg.accent}`}>
      {/* Card Header */}
      <div className={`bg-gradient-to-br ${cfg.headerBg} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <Icon size={18} className="text-white/90" />
          <span className="text-[13px] font-semibold text-white">{template.name}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-white p-1 rounded"
        >
          <IconTrash size={14} />
        </button>
      </div>

      {/* Scaled Document Preview */}
      <div
        onClick={onOpen}
        className="bg-white mx-3 my-3 rounded-lg border border-gray-100 overflow-hidden shadow-sm cursor-pointer"
        style={{ height: 200 }}
      >
        <div
          style={{ transform: "scale(0.28)", transformOrigin: "top left", width: "357%", pointerEvents: "none" }}
        >
          {template.type === "proposal" && <ProposalTemplate data={previewData} />}
          {template.type === "invoice" && <InvoiceTemplate data={previewData} />}
          {template.type === "contract" && <ContractTemplate data={previewData} />}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-tertiary">
            {new Date(template.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-brand-accent hover:text-brand-accent rounded-lg text-[11px] font-medium text-text-secondary transition-colors"
          >
            <IconDownload size={12} />
            Open & Export
          </button>
        </div>
      </div>
    </div>
  );
}

function PrebuiltTemplateCard({
  template,
  onUse,
  onPreview,
}: {
  template: PrebuiltTemplate;
  onUse: () => void;
  onPreview: () => void;
}) {
  const cfg = TYPE_CONFIG[template.type];
  const Icon = cfg.icon;
  const IndustryIcon = INDUSTRY_ICONS[template.industry] ?? IconBriefcase;

  const previewData =
    template.type === "proposal"
      ? { ...defaultProposal, ...(template.content as any) }
      : template.type === "invoice"
      ? { ...defaultInvoice, ...(template.content as any) }
      : { ...defaultContract, ...(template.content as any) };

  return (
    <div className="group bg-white border border-[#e5e5e5] rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.10)] hover:border-[#c8e6d8]">
      {/* Brand top strip — single brand color, no per-type variation */}
      <div className="h-[3px] w-full" style={{ background: "#1a3d2b" }} />

      {/* Document micro-preview */}
      <div
        className="relative mx-4 mt-4 rounded-lg overflow-hidden border border-[#e5e5e5] cursor-pointer"
        style={{ height: 170, background: "#f5fbf7" }}
        onClick={onPreview}
      >
        <div
          style={{ transform: "scale(0.28)", transformOrigin: "top left", width: "357%", pointerEvents: "none" }}
        >
          {template.type === "proposal" && <ProposalTemplate data={previewData} />}
          {template.type === "invoice" && <InvoiceTemplate data={previewData} />}
          {template.type === "contract" && <ContractTemplate data={previewData} />}
        </div>
        {/* Hover overlay — brand green tint, not black */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2"
          style={{ background: "linear-gradient(to top, rgba(26,61,43,0.18), transparent)" }}
        >
          <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: "#1a3d2b", color: "#fff" }}
          >
            Click to preview
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[13px] font-medium leading-tight" style={{ color: "#1a1a1a" }}>
            {template.name}
          </h3>
          {/* Type badge — design system semantic colors */}
          <span
            className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
            style={{
              background: template.type === "proposal" ? "#d4f0e2" : template.type === "invoice" ? "#d4f0e2" : "#eef8f2",
              color: "#0d5c35",
            }}
          >
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <IndustryIcon size={11} style={{ color: "#9a9a9a" }} />
          <span className="text-[11px] font-medium" style={{ color: "#9a9a9a" }}>{template.industry}</span>
        </div>

        <p className="text-[12px] leading-relaxed flex-1 mb-4" style={{ color: "#5a5a5a" }}>
          {template.description}
        </p>

        {/* Actions — design system button styles */}
        <div className="flex items-center gap-2 mt-auto">
          <button
            onClick={onPreview}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "0.5px solid #e5e5e5",
              background: "transparent",
              color: "#5a5a5a",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1a3d2b"; (e.currentTarget as HTMLButtonElement).style.color = "#1a3d2b"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e5e5"; (e.currentTarget as HTMLButtonElement).style.color = "#5a5a5a"; }}
          >
            Preview
          </button>
          <button
            onClick={onUse}
            className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ padding: "7px 14px", borderRadius: 8, background: "#1a3d2b", border: "none" }}
          >
            <IconPlus size={12} />
            Use Template
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplateLibraryClient({
  initialTemplates,
  freelancerId,
}: {
  initialTemplates: Template[];
  freelancerId: string;
}) {
  const supabase = createClient();
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"my-templates" | "prebuilt">("prebuilt");
  const [prebuiltFilter, setPrebuiltFilter] = useState<string>("all");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorType, setEditorType] = useState<DocumentType>("proposal");
  const [editorInitialData, setEditorInitialData] = useState<any>(null);
  const [editorTemplateName, setEditorTemplateName] = useState("");

  const filteredTemplates = templates.filter((t) => {
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredPrebuilt = PREBUILT_TEMPLATES.filter((t) => {
    return prebuiltFilter === "all" || t.type === prebuiltFilter;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    setDeleting(id);
    await supabase.from("document_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleting(null);
  };

  const openEditor = (type: DocumentType, template?: Template | PrebuiltTemplate) => {
    setEditorType(type);
    setEditorInitialData(template?.content ?? null);
    setEditorTemplateName(template?.name ?? "");
    setEditorOpen(true);
  };

  // Called by DocumentEditor when "Save" is hit — saves as a new template
  const handleSaveTemplate = async (docType: DocumentType, title: string, content: Record<string, unknown>) => {
    const name = editorTemplateName || title;
    const { data } = await supabase
      .from("document_templates")
      .insert({ freelancer_id: freelancerId, name, type: docType, content })
      .select()
      .single();
    if (data) setTemplates((prev) => [data as Template, ...prev]);
    setEditorOpen(false);
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setActiveTab("prebuilt")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "prebuilt"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-text-secondary hover:text-brand-dark"
          }`}
        >
          <IconTemplate size={15} />
          Prebuilt Templates
          <span className="ml-1 bg-brand-dark text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {PREBUILT_TEMPLATES.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("my-templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
            activeTab === "my-templates"
              ? "bg-white text-brand-dark shadow-sm"
              : "text-text-secondary hover:text-brand-dark"
          }`}
        >
          <IconLayoutGrid size={15} />
          My Templates
          {templates.length > 0 && (
            <span className="ml-1 bg-gray-300 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {templates.length}
            </span>
          )}
        </button>
      </div>

      {/* ── PREBUILT TEMPLATES TAB ── */}
      {activeTab === "prebuilt" && (
        <div>
          {/* Header row — flat, design-system aligned */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl mb-6"
            style={{ background: "#eef8f2", border: "0.5px solid #a8e8c6" }}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.5)", border: "0.5px solid #a8e8c6" }}
                >
                  <IconTemplate size={13} style={{ color: "#1a6b45" }} />
                </div>
                <span
                  className="text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: "#1a6b45", letterSpacing: "0.08em" }}
                >
                  Template Library
                </span>
              </div>
              <h2 className="text-[16px] font-medium mb-0.5" style={{ color: "#1a1a1a" }}>
                Professional Templates, Ready to Use
              </h2>
              <p className="text-[13px] max-w-lg" style={{ color: "#5a5a5a", lineHeight: 1.6 }}>
                Choose from {PREBUILT_TEMPLATES.length} expertly crafted templates across proposals, invoices, and contracts. Open any template, customize it, then save it to your library.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {(["proposal", "invoice", "contract"] as const).map((type) => {
                const count = PREBUILT_TEMPLATES.filter(t => t.type === type).length;
                const cfg = TYPE_CONFIG[type];
                return (
                  <div key={type} className="flex items-center gap-2 text-[12px]" style={{ color: "#1a6b45" }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#1a9960" }} />
                    {count} {cfg.label} templates
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[12px] font-medium text-text-tertiary mr-1">Filter:</span>
            {["all", "proposal", "invoice", "contract"].map((type) => (
              <button
                key={type}
                onClick={() => setPrebuiltFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all ${
                  prebuiltFilter === type
                    ? "bg-brand-dark text-white border-brand-dark"
                    : "bg-white text-text-secondary border-gray-200 hover:border-gray-400"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== "all" && (
                  <span className="ml-1.5 opacity-60">
                    ({PREBUILT_TEMPLATES.filter(t => t.type === type).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Prebuilt Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPrebuilt.map((template) => (
              <PrebuiltTemplateCard
                key={template.id}
                template={template}
                onPreview={() => openEditor(template.type, template)}
                onUse={() => openEditor(template.type, template)}
              />
            ))}
          </div>

          {/* Info note — design system: success tint */}
          <div
            className="mt-6 flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "#eef8f2", border: "0.5px solid #a8e8c6" }}
          >
            <IconCheck size={15} className="shrink-0 mt-0.5" style={{ color: "#1a9960" }} />
            <p className="text-[12px] leading-relaxed" style={{ color: "#1a3d2b", lineHeight: 1.6 }}>
              <span className="font-medium">How it works:</span>{" "}Click &ldquo;Use Template&rdquo; to open the document editor pre-filled with professional content. Customize the details, then hit{" "}
              <span className="font-medium">Save as Template</span> to add it to your personal library, or export it directly as a PDF.
            </p>
          </div>
        </div>
      )}

      {/* ── MY TEMPLATES TAB ── */}
      {activeTab === "my-templates" && (
        <div>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <IconFilter size={14} className="text-text-tertiary" />
              {["all", "proposal", "invoice", "contract"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                    filterType === type
                      ? "bg-brand-dark text-white border-brand-dark"
                      : "bg-white text-text-secondary border-brand-light hover:border-brand-dark"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Create New Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {(["proposal", "invoice", "contract"] as const).map((type) => {
              const cfg = TYPE_CONFIG[type];
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  onClick={() => openEditor(type)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all hover:shadow-md bg-white group ${
                    type === "proposal"
                      ? "border-blue-200 hover:border-blue-400"
                      : type === "invoice"
                      ? "border-green-200 hover:border-green-400"
                      : "border-purple-200 hover:border-purple-400"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.badge}`}>
                    <Icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-semibold text-brand-dark">New {cfg.label}</p>
                    <p className="text-[11px] text-text-tertiary">Create from scratch</p>
                  </div>
                  <IconPlus size={16} className="ml-auto text-text-tertiary group-hover:text-brand-dark transition-colors" />
                </button>
              );
            })}
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((template) => (
                <TemplatePreviewCard
                  key={template.id}
                  template={template}
                  onOpen={() => openEditor(template.type, template)}
                  onDelete={() => handleDelete(template.id)}
                  deleting={deleting === template.id}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-16 border-dashed border-2">
              <IconTemplate size={48} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
              <p className="text-text-secondary text-lg">
                {search || filterType !== "all" ? "No matching templates" : "No saved templates yet"}
              </p>
              <p className="text-text-tertiary text-sm mt-2 mb-5">
                {search || filterType !== "all"
                  ? "Try adjusting your search or filters."
                  : "Save templates from the editor, or start from a prebuilt one."}
              </p>
              {!search && filterType === "all" && (
                <button
                  onClick={() => setActiveTab("prebuilt")}
                  className="inline-flex items-center gap-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
                  style={{ padding: "9px 18px", borderRadius: 8, background: "#1a3d2b", border: "none" }}
                >
                  <IconTemplate size={14} />
                  Browse Prebuilt Templates
                  <IconChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Full Document Editor Modal */}
      {editorOpen && (
        <DocumentEditor
          type={editorType}
          initialData={editorInitialData}
          onSave={handleSaveTemplate}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
