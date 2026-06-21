import { saveAs } from "file-saver";
import type { ProposalData, InvoiceData, ContractData } from "@/components/documents/types";
import { calcSubtotal, calcTax, fmt } from "@/components/documents/types";

// ────────────────────────────────────────────────────────────
//  PDF Export — single-page, full-content (no page breaks)
// ────────────────────────────────────────────────────────────
export async function exportPDF(element: HTMLElement, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default;

  // Measure the element's full natural dimensions (px → mm at 96 dpi)
  const px2mm = (px: number) => (px * 25.4) / 96;
  const widthMm  = Math.ceil(px2mm(element.scrollWidth));
  const heightMm = Math.ceil(px2mm(element.scrollHeight));

  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollX: 0,
        scrollY: 0,
      },
      // Custom page size = exact element dimensions → always 1 page
      jsPDF: {
        unit: "mm",
        format: [widthMm, heightMm],
        orientation: "portrait",
      },
    })
    .from(element)
    .save();
}

// ────────────────────────────────────────────────────────────
//  DOC Export (docx library — creates proper .docx files)
// ────────────────────────────────────────────────────────────

/* ── Proposal DOC ── */
export async function exportProposalDOC(data: ProposalData, filename: string) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    ShadingType,
  } = await import("docx");

  const subtotal = calcSubtotal(data.pricing);
  const tax = calcTax(subtotal, data.taxRate);
  const total = subtotal + tax;

  const headerShading = { type: ShadingType.CLEAR, fill: "1E3A5F" };
  const altRowShading = { type: ShadingType.CLEAR, fill: "F8F9FA" };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children: [
          // Cover
          new Paragraph({ spacing: { before: 600, after: 100 }, children: [
            new TextRun({ text: "PROJECT PROPOSAL", size: 20, bold: true, color: "1E3A5F", allCaps: true }),
          ]}),
          new Paragraph({ spacing: { after: 80 }, children: [
            new TextRun({ text: data.projectName, size: 36, bold: true, color: "1E3A5F" }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `Prepared for ${data.clientName}`, size: 22, color: "6B7280" }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: `${data.companyName} — ${data.freelancerName}`, size: 20 }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: data.freelancerEmail, size: 18, color: "6B7280" }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `Date: ${new Date(data.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, size: 18, color: "6B7280" }),
          ]}),

          // Introduction
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Introduction", size: 24, bold: true, color: "1E3A5F" })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: data.introduction, size: 20 })] }),

          // Project Understanding
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Project Understanding", size: 24, bold: true, color: "1E3A5F" })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: data.projectUnderstanding, size: 20 })] }),

          // Scope
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Scope of Work", size: 24, bold: true, color: "1E3A5F" })] }),
          ...data.scopeItems.map((item) => new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [new TextRun({ text: item, size: 20 })],
          })),

          // Timeline
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Project Timeline", size: 24, bold: true, color: "1E3A5F" })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Phase", "Duration", "Key Deliverables"].map((t) =>
                  new TableCell({
                    shading: headerShading,
                    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: "FFFFFF" })] })],
                  })
                ),
              }),
              ...data.timeline.map((r, i) =>
                new TableRow({
                  children: [
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ children: [new TextRun({ text: r.phase, bold: true, size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ children: [new TextRun({ text: r.duration, size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ children: [new TextRun({ text: r.deliverables, size: 20 })] })] }),
                  ],
                })
              ),
            ],
          }),

          // Investment
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Investment", size: 24, bold: true, color: "1E3A5F" })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Description", "Qty", "Rate", "Amount"].map((t) =>
                  new TableCell({
                    shading: headerShading,
                    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: "FFFFFF" })] })],
                  })
                ),
              }),
              ...data.pricing.map((item, i) =>
                new TableRow({
                  children: [
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.quantity), size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(item.rate), size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(item.quantity * item.rate), size: 20 })] })] }),
                  ],
                })
              ),
              // Totals
              new TableRow({ children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Subtotal", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(subtotal), size: 20 })] })] }),
              ]}),
              ...(data.taxRate > 0 ? [new TableRow({ children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Tax (${data.taxRate}%)`, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(tax), size: 20 })] })] }),
              ]})] : []),
              new TableRow({ children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL", bold: true, size: 22 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(total), bold: true, size: 22 })] })] }),
              ]}),
            ],
          }),

          // Terms
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Terms & Conditions", size: 24, bold: true, color: "1E3A5F" })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: data.terms, size: 20 })] }),

          // Acceptance
          new Paragraph({ spacing: { before: 300, after: 120 }, children: [new TextRun({ text: "Acceptance", size: 24, bold: true, color: "1E3A5F" })] }),
          new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "By signing below, both parties agree to the terms outlined in this proposal.", size: 20 })] }),
          new Paragraph({ spacing: { before: 400 }, children: [
            new TextRun({ text: "________________________          ", size: 20 }),
            new TextRun({ text: "________________________", size: 20 }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `${data.freelancerName} — Provider              `, size: 18, color: "6B7280" }),
            new TextRun({ text: `${data.clientName} — Client`, size: 18, color: "6B7280" }),
          ]}),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/* ── Invoice DOC ── */
export async function exportInvoiceDOC(data: InvoiceData, filename: string) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    ShadingType,
  } = await import("docx");

  const subtotal = calcSubtotal(data.items);
  const tax = calcTax(subtotal, data.taxRate);
  const total = subtotal + tax;

  const headerShading = { type: ShadingType.CLEAR, fill: "0F4C81" };
  const altRowShading = { type: ShadingType.CLEAR, fill: "F8FAFC" };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children: [
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: "INVOICE", size: 48, bold: true, color: "0F4C81" }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: `#${data.invoiceNumber}`, size: 22, bold: true }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `Issued: ${new Date(data.issueDate).toLocaleDateString()}  |  Due: ${new Date(data.dueDate).toLocaleDateString()}`, size: 18, color: "6B7280" }),
          ]}),
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: data.companyName, size: 24, bold: true, color: "0F4C81" }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `${data.freelancerName} | ${data.freelancerEmail}`, size: 18, color: "6B7280" }),
          ]}),
          new Paragraph({ spacing: { after: 60 }, children: [
            new TextRun({ text: "Bill To", size: 16, bold: true, color: "9CA3AF" }),
          ]}),
          new Paragraph({ spacing: { after: 40 }, children: [
            new TextRun({ text: data.clientName, size: 22, bold: true }),
          ]}),
          new Paragraph({ spacing: { after: 200 }, children: [
            new TextRun({ text: `${data.clientEmail}\n${data.clientAddress}`, size: 18, color: "6B7280" }),
          ]}),

          // Items table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Description", "Qty", "Rate", "Amount"].map((t) =>
                  new TableCell({
                    shading: headerShading,
                    children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18, color: "FFFFFF" })] })],
                  })
                ),
              }),
              ...data.items.map((item, i) =>
                new TableRow({
                  children: [
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.quantity), size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(item.rate), size: 20 })] })] }),
                    new TableCell({ shading: i % 2 ? altRowShading : undefined, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(item.quantity * item.rate), size: 20 })] })] }),
                  ],
                })
              ),
            ],
          }),

          new Paragraph({ spacing: { before: 200 }, children: [] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Subtotal: ${fmt(subtotal)}`, size: 20 })] }),
          ...(data.taxRate > 0 ? [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Tax (${data.taxRate}%): ${fmt(tax)}`, size: 20 })] })] : []),
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 100 }, children: [
            new TextRun({ text: `Total Due: ${fmt(total)}`, size: 26, bold: true, color: "0F4C81" }),
          ]}),

          ...(data.paymentTerms ? [
            new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: "Payment Terms", size: 18, bold: true, color: "6B7280" })] }),
            new Paragraph({ children: [new TextRun({ text: data.paymentTerms, size: 18, color: "6B7280" })] }),
          ] : []),
          ...(data.bankName ? [
            new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Bank Details", size: 18, bold: true, color: "6B7280" })] }),
            new Paragraph({ children: [new TextRun({ text: `Bank: ${data.bankName}${data.accountNumber ? ` | Account: ${data.accountNumber}` : ""}${data.routingNumber ? ` | Routing: ${data.routingNumber}` : ""}`, size: 18, color: "6B7280" })] }),
          ] : []),
          ...(data.notes ? [
            new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Notes", size: 18, bold: true, color: "6B7280" })] }),
            new Paragraph({ children: [new TextRun({ text: data.notes, size: 18, color: "6B7280" })] }),
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}

/* ── Contract DOC ── */
export async function exportContractDOC(data: ContractData, filename: string) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    AlignmentType,
    ShadingType,
  } = await import("docx");

  const headerShading = { type: ShadingType.CLEAR, fill: "F3F4F6" };

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children: [
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 }, children: [
            new TextRun({ text: "SERVICE AGREEMENT", size: 32, bold: true, color: "111827" }),
          ]}),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [
            new TextRun({ text: `Effective Date: ${new Date(data.effectiveDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, size: 20, color: "6B7280" }),
          ]}),

          // Parties
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `This Agreement is between ${data.freelancerName} ("Service Provider") and ${data.clientName} ("Client").`, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "1. Project Scope", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.projectScope, size: 20 })] }),
          ...data.deliverables.map((d) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: d, size: 20 })] })),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "2. Timeline", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `Project commences ${new Date(data.effectiveDate).toLocaleDateString()} and is expected to complete by ${new Date(data.completionDate).toLocaleDateString()}.`, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "3. Compensation", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `Total: ${fmt(data.totalAmount)}`, size: 20, bold: true })] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: ["Milestone", "Amount", "Due"].map((t) =>
                new TableCell({ shading: headerShading, children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18 })] })] })
              )}),
              ...data.paymentSchedule.map((m) => new TableRow({ children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: m.milestone, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: fmt(m.amount), size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: m.dueDate ? new Date(m.dueDate).toLocaleDateString() : "Upon approval", size: 20 })] })] }),
              ]})),
            ],
          }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "4. Revisions", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: `${data.revisionLimit} rounds of revisions included per deliverable.`, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "5. Confidentiality", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.confidentialityClause, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "6. Termination", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.terminationClause, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "7. Liability", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.liabilityClause, size: 20 })] }),

          new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "8. Governing Law", size: 22, bold: true, color: "111827" })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: `Governed by the laws of ${data.governingLaw}.`, size: 20 })] }),

          ...(data.additionalTerms ? [new Paragraph({ spacing: { before: 240, after: 100 }, children: [new TextRun({ text: "9. Additional Terms", size: 22, bold: true, color: "111827" })] }), new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: data.additionalTerms, size: 20 })] })] : []),

          // Signatures
          new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: "By signing below, both parties agree to the terms of this Agreement.", size: 20 })] }),
          new Paragraph({ spacing: { before: 300 }, children: [
            new TextRun({ text: "________________________          ________________________", size: 20 }),
          ]}),
          new Paragraph({ children: [
            new TextRun({ text: `${data.freelancerName} — Provider              `, size: 18, color: "6B7280" }),
            new TextRun({ text: `${data.clientName} — Client`, size: 18, color: "6B7280" }),
          ]}),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
}
