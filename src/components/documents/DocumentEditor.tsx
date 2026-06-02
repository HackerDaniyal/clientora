"use client";

import React, { useRef, useState, useCallback } from "react";
import {
  IconX,
  IconDownload,
  IconFileTypeDoc,
  IconFileTypePdf,
  IconDeviceFloppy,
  IconPlus,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import ProposalTemplate from "./ProposalTemplate";
import InvoiceTemplate from "./InvoiceTemplate";
import ContractTemplate from "./ContractTemplate";
import {
  type DocumentType,
  type ProposalData,
  type InvoiceData,
  type ContractData,
  defaultProposal,
  defaultInvoice,
  defaultContract,
  uid,
  fmt,
  calcSubtotal,
  calcTax,
  calcTotal,
} from "./types";
import { exportPDF, exportProposalDOC, exportInvoiceDOC, exportContractDOC } from "@/lib/document-export";

type Props = {
  type: DocumentType;
  workspaceName?: string;
  clientName?: string;
  freelancerName?: string;
  freelancerEmail?: string;
  onSave?: (docType: DocumentType, title: string, content: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
};

export default function DocumentEditor({ type, workspaceName, clientName, freelancerName, freelancerEmail, onSave, onClose }: Props) {
  // ── State ──
  const [proposal, setProposal] = useState<ProposalData>(() => ({
    ...defaultProposal,
    projectName: workspaceName ?? defaultProposal.projectName,
    clientName: clientName ?? defaultProposal.clientName,
    freelancerName: freelancerName ?? defaultProposal.freelancerName,
    freelancerEmail: freelancerEmail ?? defaultProposal.freelancerEmail,
  }));
  const [invoice, setInvoice] = useState<InvoiceData>(() => ({
    ...defaultInvoice,
    clientName: clientName ?? defaultInvoice.clientName,
    freelancerName: freelancerName ?? defaultInvoice.freelancerName,
    freelancerEmail: freelancerEmail ?? defaultInvoice.freelancerEmail,
  }));
  const [contract, setContract] = useState<ContractData>(() => ({
    ...defaultContract,
    projectName: workspaceName ?? defaultContract.projectName,
    clientName: clientName ?? defaultContract.clientName,
    freelancerName: freelancerName ?? defaultContract.freelancerName,
    freelancerEmail: freelancerEmail ?? defaultContract.freelancerEmail,
  }));

  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ general: true, items: true, extras: false, clauses: false });
  const previewRef = useRef<HTMLDivElement>(null);

  const toggleSection = (key: string) => setOpenSections((p) => ({ ...p, [key]: !p[key] }));

  // ── PDF / DOC Export ──
  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    try {
      const name = type === "proposal" ? proposal.projectName : type === "invoice" ? invoice.invoiceNumber : contract.projectName;
      await exportPDF(previewRef.current, `${type}-${name}.pdf`);
    } catch (e) {
      console.error("PDF export error:", e);
      alert("PDF export failed. Try again.");
    }
    setExporting(false);
  }, [type, proposal, invoice, contract, exporting]);

  const handleExportDOC = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      if (type === "proposal") await exportProposalDOC(proposal, `proposal-${proposal.projectName}.docx`);
      else if (type === "invoice") await exportInvoiceDOC(invoice, `invoice-${invoice.invoiceNumber}.docx`);
      else await exportContractDOC(contract, `contract-${contract.projectName}.docx`);
    } catch (e) {
      console.error("DOC export error:", e);
      alert("DOC export failed. Try again.");
    }
    setExporting(false);
  }, [type, proposal, invoice, contract, exporting]);

  // ── Save to DB ──
  const handleSave = useCallback(async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      if (type === "proposal") {
        const title = `Proposal — ${proposal.projectName}`;
        await onSave(type, title, proposal as unknown as Record<string, unknown>);
      } else if (type === "invoice") {
        const title = `Invoice ${invoice.invoiceNumber}`;
        await onSave(type, title, invoice as unknown as Record<string, unknown>);
      } else {
        const title = `Contract — ${contract.projectName}`;
        await onSave(type, title, contract as unknown as Record<string, unknown>);
      }
      onClose();
    } catch {
      alert("Failed to save document");
    }
    setSaving(false);
  }, [type, proposal, invoice, contract, onSave, onClose, saving]);

  // ── Shared input helpers ──
  const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition";
  const labelCls = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1";
  const textareaCls = `${inputCls} resize-none`;

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition"
      >
        {title}
        {openSections[id] ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
      </button>
      {openSections[id] && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      {/* ── Left Panel: Editor ── */}
      <div className="w-[420px] bg-gray-50 flex flex-col border-r border-gray-200 shrink-0">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-800 capitalize">{type} Editor</h2>
            <p className="text-[11px] text-gray-400">Fill in the details, preview on the right</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <IconX size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto">
          {type === "proposal" && <ProposalFields data={proposal} setData={setProposal} Section={Section} Field={Field} inputCls={inputCls} textareaCls={textareaCls} />}
          {type === "invoice" && <InvoiceFields data={invoice} setData={setInvoice} Section={Section} Field={Field} inputCls={inputCls} textareaCls={textareaCls} />}
          {type === "contract" && <ContractFields data={contract} setData={setContract} Section={Section} Field={Field} inputCls={inputCls} textareaCls={textareaCls} />}
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-t border-gray-200">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-[12px] font-medium rounded-lg transition disabled:opacity-50"
          >
            <IconFileTypePdf size={16} /> PDF
          </button>
          <button
            onClick={handleExportDOC}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium rounded-lg transition disabled:opacity-50"
          >
            <IconFileTypeDoc size={16} /> DOC
          </button>
          <div className="flex-1" />
          {onSave && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-mid hover:bg-brand-green text-white text-[12px] font-medium rounded-lg transition disabled:opacity-50"
            >
              <IconDeviceFloppy size={16} /> {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* ── Right Panel: Preview ── */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <span className="text-[13px] font-medium text-gray-600">Live Preview</span>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
            >
              <IconDownload size={14} /> Download PDF
            </button>
            <button
              onClick={handleExportDOC}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
            >
              <IconDownload size={14} /> Download DOC
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={previewRef} className="bg-white shadow-lg mx-auto" style={{ maxWidth: 800 }}>
            {type === "proposal" && <ProposalTemplate data={proposal} />}
            {type === "invoice" && <InvoiceTemplate data={invoice} />}
            {type === "contract" && <ContractTemplate data={contract} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
//  PROPOSAL FIELDS
// ════════════════════════════════════════════════════════
function ProposalFields({ data, setData, Section, Field, inputCls, textareaCls }: {
  data: ProposalData; setData: React.Dispatch<React.SetStateAction<ProposalData>>;
  Section: (p: { id: string; title: string; children: React.ReactNode }) => JSX.Element;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  inputCls: string; textareaCls: string;
}) {
  const upd = <K extends keyof ProposalData>(key: K, val: ProposalData[K]) => setData((p) => ({ ...p, [key]: val }));

  return (
    <>
      <Section id="general" title="General Information">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Company Name"><input className={inputCls} value={data.companyName} onChange={(e) => upd("companyName", e.target.value)} /></Field>
          <Field label="Your Name"><input className={inputCls} value={data.freelancerName} onChange={(e) => upd("freelancerName", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email"><input className={inputCls} value={data.freelancerEmail} onChange={(e) => upd("freelancerEmail", e.target.value)} /></Field>
          <Field label="Phone"><input className={inputCls} value={data.freelancerPhone} onChange={(e) => upd("freelancerPhone", e.target.value)} /></Field>
        </div>
        <Field label="Website"><input className={inputCls} value={data.freelancerWebsite} onChange={(e) => upd("freelancerWebsite", e.target.value)} /></Field>
        <Field label="Project Name"><input className={inputCls} value={data.projectName} onChange={(e) => upd("projectName", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client Name"><input className={inputCls} value={data.clientName} onChange={(e) => upd("clientName", e.target.value)} /></Field>
          <Field label="Client Email"><input className={inputCls} value={data.clientEmail} onChange={(e) => upd("clientEmail", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input type="date" className={inputCls} value={data.date} onChange={(e) => upd("date", e.target.value)} /></Field>
          <Field label="Valid Until"><input type="date" className={inputCls} value={data.validUntil} onChange={(e) => upd("validUntil", e.target.value)} /></Field>
        </div>
      </Section>

      <Section id="content" title="Proposal Content">
        <Field label="Introduction"><textarea className={textareaCls} rows={3} value={data.introduction} onChange={(e) => upd("introduction", e.target.value)} /></Field>
        <Field label="Project Understanding"><textarea className={textareaCls} rows={3} value={data.projectUnderstanding} onChange={(e) => upd("projectUnderstanding", e.target.value)} /></Field>
        <Field label="Scope Items">
          <div className="space-y-2">
            {data.scopeItems.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={item} onChange={(e) => { const arr = [...data.scopeItems]; arr[i] = e.target.value; upd("scopeItems", arr); }} />
                <button onClick={() => upd("scopeItems", data.scopeItems.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><IconTrash size={14} /></button>
              </div>
            ))}
            <button onClick={() => upd("scopeItems", [...data.scopeItems, ""])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add item</button>
          </div>
        </Field>
      </Section>

      <Section id="timeline" title="Timeline">
        <div className="space-y-2">
          {data.timeline.map((row, i) => (
            <div key={row.id} className="flex gap-2 items-start">
              <input className={inputCls} placeholder="Phase" value={row.phase} onChange={(e) => { const arr = [...data.timeline]; arr[i] = { ...arr[i], phase: e.target.value }; upd("timeline", arr); }} />
              <input className={`${inputCls} w-24`} placeholder="Duration" value={row.duration} onChange={(e) => { const arr = [...data.timeline]; arr[i] = { ...arr[i], duration: e.target.value }; upd("timeline", arr); }} />
              <button onClick={() => upd("timeline", data.timeline.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><IconTrash size={14} /></button>
            </div>
          ))}
          <button onClick={() => upd("timeline", [...data.timeline, { id: uid(), phase: "", duration: "", deliverables: "" }])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add phase</button>
        </div>
      </Section>

      <Section id="items" title="Pricing">
        <div className="space-y-2">
          {data.pricing.map((item, i) => (
            <div key={item.id} className="flex gap-2 items-center">
              <input className={`${inputCls} flex-1`} placeholder="Description" value={item.description} onChange={(e) => { const arr = [...data.pricing]; arr[i] = { ...arr[i], description: e.target.value }; upd("pricing", arr); }} />
              <input type="number" className={`${inputCls} w-16`} placeholder="Qty" value={item.quantity} onChange={(e) => { const arr = [...data.pricing]; arr[i] = { ...arr[i], quantity: Number(e.target.value) }; upd("pricing", arr); }} />
              <input type="number" className={`${inputCls} w-24`} placeholder="Rate" value={item.rate} onChange={(e) => { const arr = [...data.pricing]; arr[i] = { ...arr[i], rate: Number(e.target.value) }; upd("pricing", arr); }} />
              <span className="text-[12px] text-gray-500 w-20 text-right">{fmt(item.quantity * item.rate)}</span>
              <button onClick={() => upd("pricing", data.pricing.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><IconTrash size={14} /></button>
            </div>
          ))}
          <button onClick={() => upd("pricing", [...data.pricing, { id: uid(), description: "", quantity: 1, rate: 0 }])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add line item</button>
        </div>
        <div className="flex gap-3 pt-2">
          <Field label="Tax Rate (%)"><input type="number" className={inputCls} value={data.taxRate} onChange={(e) => upd("taxRate", Number(e.target.value))} /></Field>
        </div>
        <div className="text-right text-[13px] font-semibold text-gray-700 pt-1">
          Subtotal: {fmt(calcSubtotal(data.pricing))}
          {data.taxRate > 0 && <span className="ml-3 text-gray-500">Tax: {fmt(calcTax(calcSubtotal(data.pricing), data.taxRate))}</span>}
          <span className="ml-3 text-brand-dark">Total: {fmt(calcTotal(data.pricing, data.taxRate))}</span>
        </div>
      </Section>

      <Section id="extras" title="Terms & Notes">
        <Field label="Terms & Conditions"><textarea className={textareaCls} rows={4} value={data.terms} onChange={(e) => upd("terms", e.target.value)} /></Field>
        <Field label="Additional Notes"><textarea className={textareaCls} rows={2} value={data.notes} onChange={(e) => upd("notes", e.target.value)} /></Field>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════
//  INVOICE FIELDS
// ════════════════════════════════════════════════════════
function InvoiceFields({ data, setData, Section, Field, inputCls, textareaCls }: {
  data: InvoiceData; setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  Section: (p: { id: string; title: string; children: React.ReactNode }) => JSX.Element;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  inputCls: string; textareaCls: string;
}) {
  const upd = <K extends keyof InvoiceData>(key: K, val: InvoiceData[K]) => setData((p) => ({ ...p, [key]: val }));

  return (
    <>
      <Section id="general" title="Invoice Details">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invoice Number"><input className={inputCls} value={data.invoiceNumber} onChange={(e) => upd("invoiceNumber", e.target.value)} /></Field>
          <Field label="Company Name"><input className={inputCls} value={data.companyName} onChange={(e) => upd("companyName", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your Name"><input className={inputCls} value={data.freelancerName} onChange={(e) => upd("freelancerName", e.target.value)} /></Field>
          <Field label="Email"><input className={inputCls} value={data.freelancerEmail} onChange={(e) => upd("freelancerEmail", e.target.value)} /></Field>
        </div>
        <Field label="Phone"><input className={inputCls} value={data.freelancerPhone} onChange={(e) => upd("freelancerPhone", e.target.value)} /></Field>
        <Field label="Your Address"><textarea className={textareaCls} rows={2} value={data.freelancerAddress} onChange={(e) => upd("freelancerAddress", e.target.value)} /></Field>
      </Section>

      <Section id="client" title="Client Information">
        <Field label="Client Name"><input className={inputCls} value={data.clientName} onChange={(e) => upd("clientName", e.target.value)} /></Field>
        <Field label="Client Email"><input className={inputCls} value={data.clientEmail} onChange={(e) => upd("clientEmail", e.target.value)} /></Field>
        <Field label="Client Address"><textarea className={textareaCls} rows={2} value={data.clientAddress} onChange={(e) => upd("clientAddress", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Issue Date"><input type="date" className={inputCls} value={data.issueDate} onChange={(e) => upd("issueDate", e.target.value)} /></Field>
          <Field label="Due Date"><input type="date" className={inputCls} value={data.dueDate} onChange={(e) => upd("dueDate", e.target.value)} /></Field>
        </div>
      </Section>

      <Section id="items" title="Line Items">
        <div className="space-y-2">
          {data.items.map((item, i) => (
            <div key={item.id} className="flex gap-2 items-center">
              <input className={`${inputCls} flex-1`} placeholder="Description" value={item.description} onChange={(e) => { const arr = [...data.items]; arr[i] = { ...arr[i], description: e.target.value }; upd("items", arr); }} />
              <input type="number" className={`${inputCls} w-16`} placeholder="Qty" value={item.quantity} onChange={(e) => { const arr = [...data.items]; arr[i] = { ...arr[i], quantity: Number(e.target.value) }; upd("items", arr); }} />
              <input type="number" className={`${inputCls} w-24`} placeholder="Rate" value={item.rate} onChange={(e) => { const arr = [...data.items]; arr[i] = { ...arr[i], rate: Number(e.target.value) }; upd("items", arr); }} />
              <span className="text-[12px] text-gray-500 w-20 text-right">{fmt(item.quantity * item.rate)}</span>
              <button onClick={() => upd("items", data.items.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><IconTrash size={14} /></button>
            </div>
          ))}
          <button onClick={() => upd("items", [...data.items, { id: uid(), description: "", quantity: 1, rate: 0 }])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add item</button>
        </div>
        <div className="flex gap-3 pt-2">
          <Field label="Tax Rate (%)"><input type="number" className={inputCls} value={data.taxRate} onChange={(e) => upd("taxRate", Number(e.target.value))} /></Field>
        </div>
        <div className="text-right text-[13px] font-semibold text-gray-700 pt-1">
          Subtotal: {fmt(calcSubtotal(data.items))}
          {data.taxRate > 0 && <span className="ml-3 text-gray-500">Tax: {fmt(calcTax(calcSubtotal(data.items), data.taxRate))}</span>}
          <span className="ml-3 text-brand-dark">Total: {fmt(calcTotal(data.items, data.taxRate))}</span>
        </div>
      </Section>

      <Section id="extras" title="Payment & Notes">
        <Field label="Payment Terms"><textarea className={textareaCls} rows={2} value={data.paymentTerms} onChange={(e) => upd("paymentTerms", e.target.value)} /></Field>
        <Field label="Bank Name"><input className={inputCls} value={data.bankName} onChange={(e) => upd("bankName", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Account Number"><input className={inputCls} value={data.accountNumber} onChange={(e) => upd("accountNumber", e.target.value)} /></Field>
          <Field label="Routing Number"><input className={inputCls} value={data.routingNumber} onChange={(e) => upd("routingNumber", e.target.value)} /></Field>
        </div>
        <Field label="Notes"><textarea className={textareaCls} rows={2} value={data.notes} onChange={(e) => upd("notes", e.target.value)} /></Field>
      </Section>
    </>
  );
}

// ════════════════════════════════════════════════════════
//  CONTRACT FIELDS
// ════════════════════════════════════════════════════════
function ContractFields({ data, setData, Section, Field, inputCls, textareaCls }: {
  data: ContractData; setData: React.Dispatch<React.SetStateAction<ContractData>>;
  Section: (p: { id: string; title: string; children: React.ReactNode }) => JSX.Element;
  Field: (p: { label: string; children: React.ReactNode }) => JSX.Element;
  inputCls: string; textareaCls: string;
}) {
  const upd = <K extends keyof ContractData>(key: K, val: ContractData[K]) => setData((p) => ({ ...p, [key]: val }));

  return (
    <>
      <Section id="general" title="Parties & Project">
        <Field label="Project Name"><input className={inputCls} value={data.projectName} onChange={(e) => upd("projectName", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Effective Date"><input type="date" className={inputCls} value={data.effectiveDate} onChange={(e) => upd("effectiveDate", e.target.value)} /></Field>
          <Field label="Completion Date"><input type="date" className={inputCls} value={data.completionDate} onChange={(e) => upd("completionDate", e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Your Name"><input className={inputCls} value={data.freelancerName} onChange={(e) => upd("freelancerName", e.target.value)} /></Field>
          <Field label="Your Email"><input className={inputCls} value={data.freelancerEmail} onChange={(e) => upd("freelancerEmail", e.target.value)} /></Field>
        </div>
        <Field label="Your Address"><textarea className={textareaCls} rows={2} value={data.freelancerAddress} onChange={(e) => upd("freelancerAddress", e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Client Name"><input className={inputCls} value={data.clientName} onChange={(e) => upd("clientName", e.target.value)} /></Field>
          <Field label="Client Email"><input className={inputCls} value={data.clientEmail} onChange={(e) => upd("clientEmail", e.target.value)} /></Field>
        </div>
        <Field label="Client Address"><textarea className={textareaCls} rows={2} value={data.clientAddress} onChange={(e) => upd("clientAddress", e.target.value)} /></Field>
      </Section>

      <Section id="scope" title="Scope & Deliverables">
        <Field label="Project Scope"><textarea className={textareaCls} rows={4} value={data.projectScope} onChange={(e) => upd("projectScope", e.target.value)} /></Field>
        <Field label="Deliverables">
          <div className="space-y-2">
            {data.deliverables.map((d, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={d} onChange={(e) => { const arr = [...data.deliverables]; arr[i] = e.target.value; upd("deliverables", arr); }} />
                <button onClick={() => upd("deliverables", data.deliverables.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><IconTrash size={14} /></button>
              </div>
            ))}
            <button onClick={() => upd("deliverables", [...data.deliverables, ""])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add deliverable</button>
          </div>
        </Field>
      </Section>

      <Section id="payment" title="Payment Schedule">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Total Amount ($)"><input type="number" className={inputCls} value={data.totalAmount} onChange={(e) => upd("totalAmount", Number(e.target.value))} /></Field>
          <Field label="Revision Limit"><input type="number" className={inputCls} value={data.revisionLimit} onChange={(e) => upd("revisionLimit", Number(e.target.value))} /></Field>
        </div>
        <div className="space-y-2">
          {data.paymentSchedule.map((m, i) => (
            <div key={m.id} className="flex gap-2 items-center">
              <input className={`${inputCls} flex-1`} placeholder="Milestone" value={m.milestone} onChange={(e) => { const arr = [...data.paymentSchedule]; arr[i] = { ...arr[i], milestone: e.target.value }; upd("paymentSchedule", arr); }} />
              <input type="number" className={`${inputCls} w-24`} placeholder="Amount" value={m.amount} onChange={(e) => { const arr = [...data.paymentSchedule]; arr[i] = { ...arr[i], amount: Number(e.target.value) }; upd("paymentSchedule", arr); }} />
              <button onClick={() => upd("paymentSchedule", data.paymentSchedule.filter((_, j) => j !== i))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg shrink-0"><IconTrash size={14} /></button>
            </div>
          ))}
          <button onClick={() => upd("paymentSchedule", [...data.paymentSchedule, { id: uid(), milestone: "", amount: 0, dueDate: "" }])} className="flex items-center gap-1 text-[12px] text-brand-mid font-medium hover:underline"><IconPlus size={14} /> Add milestone</button>
        </div>
      </Section>

      <Section id="clauses" title="Legal Clauses">
        <Field label="Confidentiality"><textarea className={textareaCls} rows={3} value={data.confidentialityClause} onChange={(e) => upd("confidentialityClause", e.target.value)} /></Field>
        <Field label="Termination"><textarea className={textareaCls} rows={3} value={data.terminationClause} onChange={(e) => upd("terminationClause", e.target.value)} /></Field>
        <Field label="Limitation of Liability"><textarea className={textareaCls} rows={3} value={data.liabilityClause} onChange={(e) => upd("liabilityClause", e.target.value)} /></Field>
        <Field label="Governing Law"><input className={inputCls} value={data.governingLaw} onChange={(e) => upd("governingLaw", e.target.value)} /></Field>
        <Field label="Additional Terms"><textarea className={textareaCls} rows={3} value={data.additionalTerms} onChange={(e) => upd("additionalTerms", e.target.value)} /></Field>
      </Section>
    </>
  );
}
