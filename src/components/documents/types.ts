// ── Proposal ──
export interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface ProposalTimeline {
  id: string;
  phase: string;
  duration: string;
  deliverables: string;
}

export interface ProposalData {
  companyName: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerWebsite: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  date: string;
  validUntil: string;
  introduction: string;
  projectUnderstanding: string;
  scopeItems: string[];
  timeline: ProposalTimeline[];
  pricing: ProposalLineItem[];
  taxRate: number;
  terms: string;
  notes: string;
}

// ── Invoice ──
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  companyName: string;
  freelancerName: string;
  freelancerEmail: string;
  freelancerPhone: string;
  freelancerAddress: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceLineItem[];
  taxRate: number;
  notes: string;
  paymentTerms: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
}

// ── Contract ──
export interface PaymentMilestone {
  id: string;
  milestone: string;
  amount: number;
  dueDate: string;
}

export interface ContractData {
  freelancerName: string;
  freelancerAddress: string;
  freelancerEmail: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  projectName: string;
  effectiveDate: string;
  completionDate: string;
  projectScope: string;
  deliverables: string[];
  totalAmount: number;
  paymentSchedule: PaymentMilestone[];
  revisionLimit: number;
  confidentialityClause: string;
  terminationClause: string;
  liabilityClause: string;
  governingLaw: string;
  additionalTerms: string;
}

export type DocumentType = "proposal" | "invoice" | "contract";

// ── Helpers ──
export const uid = () => Math.random().toString(36).slice(2, 10);

export const today = () => new Date().toISOString().split("T")[0];

export const in30Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
};

export const in14Days = () => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
};

// ── Defaults ──
export const defaultProposal: ProposalData = {
  companyName: "Your Company Name",
  freelancerName: "Your Name",
  freelancerEmail: "you@company.com",
  freelancerPhone: "+1 (555) 000-0000",
  freelancerWebsite: "www.yourcompany.com",
  projectName: "Project Name",
  clientName: "Client Name",
  clientEmail: "client@company.com",
  date: today(),
  validUntil: in30Days(),
  introduction:
    "Thank you for considering our services. We are excited about the opportunity to work with you and bring your vision to life. This proposal outlines our understanding of your project, the scope of work, timeline, and investment required.",
  projectUnderstanding:
    "Based on our initial discussions, we understand that you are looking for a comprehensive solution that addresses your specific business needs. Our approach combines strategic thinking with technical expertise to deliver outstanding results.",
  scopeItems: [
    "Discovery & research phase to understand requirements in depth",
    "Design phase including wireframes, mockups, and prototypes",
    "Development phase with regular progress updates",
    "Testing and quality assurance across devices and browsers",
    "Deployment, launch support, and post-launch monitoring",
  ],
  timeline: [
    { id: uid(), phase: "Discovery & Planning", duration: "1–2 weeks", deliverables: "Requirements document, project roadmap" },
    { id: uid(), phase: "Design", duration: "2–3 weeks", deliverables: "Wireframes, visual mockups, prototype" },
    { id: uid(), phase: "Development", duration: "4–6 weeks", deliverables: "Functional application, API integrations" },
    { id: uid(), phase: "Testing & QA", duration: "1–2 weeks", deliverables: "Bug fixes, performance optimization" },
    { id: uid(), phase: "Launch & Support", duration: "1 week", deliverables: "Deployment, documentation, training" },
  ],
  pricing: [
    { id: uid(), description: "Discovery & Planning", quantity: 1, rate: 1500 },
    { id: uid(), description: "UI/UX Design", quantity: 1, rate: 3000 },
    { id: uid(), description: "Frontend Development", quantity: 1, rate: 5000 },
    { id: uid(), description: "Backend Development", quantity: 1, rate: 4500 },
    { id: uid(), description: "Testing & QA", quantity: 1, rate: 1500 },
  ],
  taxRate: 0,
  terms:
    "• 50% deposit required before work begins\n• Remaining balance due upon completion\n• This proposal is valid for 30 days from the date of issue\n• Additional scope changes will be quoted separately\n• All timelines are estimates and may vary based on requirements",
  notes: "",
};

export const defaultInvoice: InvoiceData = {
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  companyName: "Your Company Name",
  freelancerName: "Your Name",
  freelancerEmail: "you@company.com",
  freelancerPhone: "+1 (555) 000-0000",
  freelancerAddress: "123 Business Street, Suite 100\nCity, State 12345",
  clientName: "Client Name",
  clientEmail: "client@company.com",
  clientAddress: "456 Client Avenue\nCity, State 67890",
  issueDate: today(),
  dueDate: in14Days(),
  items: [
    { id: uid(), description: "Discovery & Planning", quantity: 1, rate: 1500 },
    { id: uid(), description: "UI/UX Design", quantity: 40, rate: 85 },
    { id: uid(), description: "Frontend Development", quantity: 60, rate: 95 },
    { id: uid(), description: "Backend Development", quantity: 50, rate: 95 },
  ],
  taxRate: 0,
  notes: "Thank you for your business. Payment is due within 14 days of the invoice date.",
  paymentTerms: "Net 14 — Payment due within 14 days of invoice date.",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
};

export const defaultContract: ContractData = {
  freelancerName: "Your Name",
  freelancerAddress: "123 Business Street, Suite 100\nCity, State 12345",
  freelancerEmail: "you@company.com",
  clientName: "Client Name",
  clientAddress: "456 Client Avenue\nCity, State 67890",
  clientEmail: "client@company.com",
  projectName: "Project Name",
  effectiveDate: today(),
  completionDate: in30Days(),
  projectScope:
    "The Service Provider agrees to perform the following services for the Client: design and development of the project as described in the attached proposal, including all deliverables, milestones, and acceptance criteria agreed upon by both parties.",
  deliverables: [
    "Complete design mockups and prototypes",
    "Fully functional web application",
    "Source code and documentation",
    "Deployment and launch support",
    "30-day post-launch bug fix period",
  ],
  totalAmount: 15500,
  paymentSchedule: [
    { id: uid(), milestone: "Project kickoff (deposit)", amount: 7750, dueDate: today() },
    { id: uid(), milestone: "Design approval", amount: 3875, dueDate: "" },
    { id: uid(), milestone: "Project completion & launch", amount: 3875, dueDate: "" },
  ],
  revisionLimit: 3,
  confidentialityClause:
    "Both parties agree to maintain the confidentiality of all proprietary information shared during the course of this project. This includes but is not limited to business strategies, technical specifications, client data, and any other sensitive materials. This obligation survives the termination of this agreement.",
  terminationClause:
    "Either party may terminate this agreement with 14 days written notice. In the event of termination, the Client shall pay for all work completed up to the termination date. Any deposits paid are non-refundable but will be credited against work completed.",
  liabilityClause:
    "The Service Provider's total liability under this agreement shall not exceed the total fees paid by the Client. The Service Provider shall not be liable for any indirect, incidental, or consequential damages arising from the performance of services under this agreement.",
  governingLaw: "State of California, United States",
  additionalTerms: "",
};

// ── Computed helpers ──
export const calcSubtotal = (items: { quantity: number; rate: number }[]) =>
  items.reduce((sum, i) => sum + i.quantity * i.rate, 0);

export const calcTax = (subtotal: number, rate: number) => subtotal * (rate / 100);

export const calcTotal = (items: { quantity: number; rate: number }[], taxRate: number) => {
  const sub = calcSubtotal(items);
  return sub + calcTax(sub, taxRate);
};

export const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
