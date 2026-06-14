import { uid, today, in30Days, in14Days } from "./types";
import type { ProposalData, InvoiceData, ContractData, DocumentType } from "./types";

export interface PrebuiltTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  industry: string;
  content: ProposalData | InvoiceData | ContractData;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSALS
// ─────────────────────────────────────────────────────────────────────────────

const webDevProposal: ProposalData = {
  companyName: "PixelCraft Studio",
  freelancerName: "Alex Rivera",
  freelancerEmail: "alex@pixelcraft.io",
  freelancerPhone: "+1 (415) 234-5678",
  freelancerWebsite: "www.pixelcraft.io",
  projectName: "E-Commerce Website Redesign",
  clientName: "Luxe Fashion Co.",
  clientEmail: "procurement@luxefashion.com",
  date: today(),
  validUntil: in30Days(),
  logoUrl: "",
  brandColor: "#1e40af",
  introduction:
    "Thank you for the opportunity to submit this proposal for your e-commerce platform redesign. At PixelCraft Studio, we specialize in creating high-converting, visually stunning digital storefronts that elevate brand identity and maximize revenue. Our proven track record with fashion and retail brands makes us uniquely positioned to transform your online presence.",
  projectUnderstanding:
    "Your current platform suffers from high cart abandonment rates, poor mobile performance, and an outdated visual language that no longer reflects your premium positioning. We aim to rebuild the experience from the ground up — faster, more intuitive, and deeply on-brand — to convert browsers into loyal buyers.",
  scopeItems: [
    "Comprehensive UX audit and competitive analysis of top fashion e-commerce sites",
    "Custom design system: typography, color palette, component library",
    "Responsive storefront pages: Home, Collection, PDP, Cart, Checkout",
    "Shopify/headless CMS integration with existing inventory and payment systems",
    "Performance optimization targeting <2s load time and 90+ Lighthouse score",
    "SEO setup: metadata, schema markup, sitemap, canonical URLs",
    "Post-launch A/B testing framework for conversion optimization",
  ],
  timeline: [
    { id: uid(), phase: "Discovery & Strategy", duration: "1 week", deliverables: "Audit report, sitemap, brief" },
    { id: uid(), phase: "UX Design", duration: "2 weeks", deliverables: "Wireframes, user flows" },
    { id: uid(), phase: "UI Design", duration: "2 weeks", deliverables: "High-fidelity mockups, design system" },
    { id: uid(), phase: "Development", duration: "5 weeks", deliverables: "Fully coded storefront, CMS integration" },
    { id: uid(), phase: "QA & Launch", duration: "1 week", deliverables: "Cross-browser testing, go-live support" },
  ],
  pricing: [
    { id: uid(), description: "Discovery & UX Audit", quantity: 1, rate: 2000 },
    { id: uid(), description: "UI Design (Full Storefront)", quantity: 1, rate: 6500 },
    { id: uid(), description: "Frontend Development", quantity: 1, rate: 8000 },
    { id: uid(), description: "CMS & API Integration", quantity: 1, rate: 4000 },
    { id: uid(), description: "QA Testing & Optimization", quantity: 1, rate: 2500 },
    { id: uid(), description: "Post-Launch Support (30 days)", quantity: 1, rate: 1500 },
  ],
  taxRate: 0,
  terms:
    "• 40% deposit required upon signing to commence work\n• Milestone payments tied to design approval and development completion\n• All source files and assets transferred upon final payment\n• Revisions: up to 3 rounds per phase; additional revisions billed at $120/hr\n• Proposal valid for 30 days from date of issue",
  notes:
    "We are excited to partner with Luxe Fashion Co. and are confident this redesign will significantly improve your conversion metrics. References from past retail clients available upon request.",
};

const brandingProposal: ProposalData = {
  companyName: "Forma Brand Agency",
  freelancerName: "Jordan Lee",
  freelancerEmail: "jordan@formabrand.com",
  freelancerPhone: "+1 (212) 876-5432",
  freelancerWebsite: "www.formabrand.com",
  projectName: "Complete Brand Identity System",
  clientName: "NovaBrew Coffee Roasters",
  clientEmail: "hello@novabrew.com",
  date: today(),
  validUntil: in30Days(),
  logoUrl: "",
  brandColor: "#78350f",
  introduction:
    "NovaBrew Coffee Roasters has built something extraordinary — a specialty coffee experience grounded in craft and community. Yet your brand identity doesn't yet reflect the premium quality of what's in the cup. Forma Brand Agency is here to change that. This proposal outlines a full brand identity engagement that will give NovaBrew a visual and verbal language worthy of your product.",
  projectUnderstanding:
    "You need more than a logo refresh. You need a cohesive identity system that works across packaging, signage, digital, and merchandise — one that communicates warmth, craftsmanship, and sustainability without feeling generic. Our approach is rooted in brand strategy before any visual exploration begins.",
  scopeItems: [
    "Brand strategy workshop: positioning, personality, voice & tone",
    "Logo design: primary, secondary, and favicon variants",
    "Color palette, typography system, and iconography library",
    "Packaging design: coffee bags (3 SKUs), cups, and branded merchandise",
    "Brand guidelines document (60+ pages, digital & print ready)",
    "Social media template kit (12 customizable Figma templates)",
    "Signage and environmental design concepts for café locations",
  ],
  timeline: [
    { id: uid(), phase: "Brand Strategy", duration: "2 weeks", deliverables: "Strategy deck, positioning statement" },
    { id: uid(), phase: "Logo & Identity", duration: "3 weeks", deliverables: "3 logo concepts, refinement rounds" },
    { id: uid(), phase: "System Expansion", duration: "3 weeks", deliverables: "Color, type, iconography, patterns" },
    { id: uid(), phase: "Packaging & Collateral", duration: "3 weeks", deliverables: "Packaging mockups, templates" },
    { id: uid(), phase: "Brand Guidelines", duration: "1 week", deliverables: "Final guidelines PDF + Figma library" },
  ],
  pricing: [
    { id: uid(), description: "Brand Strategy & Research", quantity: 1, rate: 3500 },
    { id: uid(), description: "Logo Design System", quantity: 1, rate: 5000 },
    { id: uid(), description: "Visual Identity Expansion", quantity: 1, rate: 4500 },
    { id: uid(), description: "Packaging Design (3 SKUs)", quantity: 3, rate: 1800 },
    { id: uid(), description: "Brand Guidelines Document", quantity: 1, rate: 2500 },
    { id: uid(), description: "Social Media Template Kit", quantity: 1, rate: 1500 },
  ],
  taxRate: 0,
  terms:
    "• 50% deposit required upon project kickoff\n• 25% due at logo approval milestone\n• Final 25% upon delivery of complete brand files\n• 3 rounds of revisions included per deliverable phase\n• All final files delivered in AI, EPS, PDF, PNG, and SVG formats\n• Client responsible for printing and production costs",
  notes:
    "Forma Brand Agency retains the right to display this work in our portfolio unless a confidentiality agreement is separately executed. We look forward to brewing something great together.",
};

const marketingProposal: ProposalData = {
  companyName: "GrowthHive Marketing",
  freelancerName: "Priya Sharma",
  freelancerEmail: "priya@growthhive.co",
  freelancerPhone: "+1 (646) 345-9012",
  freelancerWebsite: "www.growthhive.co",
  projectName: "6-Month Digital Marketing Retainer",
  clientName: "MedTech Solutions Inc.",
  clientEmail: "marketing@medtechsolutions.com",
  date: today(),
  validUntil: in30Days(),
  logoUrl: "",
  brandColor: "#065f46",
  introduction:
    "GrowthHive Marketing specializes in B2B demand generation for healthcare technology companies. Our data-driven approach combines content marketing, paid acquisition, and conversion rate optimization to build predictable, scalable lead pipelines. This proposal outlines a 6-month engagement designed to increase your qualified leads by 150% and significantly lower your cost-per-acquisition.",
  projectUnderstanding:
    "MedTech Solutions has a strong product but is struggling to cut through the noise in a crowded marketplace. Your current digital presence generates inconsistent leads, and your sales team frequently cites poor lead quality. Our retainer model brings dedicated strategy, execution, and optimization — treating your growth as our own.",
  scopeItems: [
    "Monthly content strategy and editorial calendar",
    "4 long-form SEO blog posts per month (1,500+ words each)",
    "Google Ads and LinkedIn Ads management (up to $15K/mo ad spend)",
    "Monthly landing page creation and A/B testing",
    "Marketing automation setup and email nurture sequence (HubSpot)",
    "Monthly analytics reporting with KPI dashboard",
    "Quarterly strategy review sessions",
  ],
  timeline: [
    { id: uid(), phase: "Onboarding & Audit", duration: "2 weeks", deliverables: "Audit report, ICP definition, strategy" },
    { id: uid(), phase: "Foundation Build", duration: "4 weeks", deliverables: "Ads setup, automation, first content" },
    { id: uid(), phase: "Active Growth (Month 2–4)", duration: "12 weeks", deliverables: "Ongoing execution & optimization" },
    { id: uid(), phase: "Scale (Month 5–6)", duration: "8 weeks", deliverables: "Scaled campaigns, conversion uplift" },
    { id: uid(), phase: "Review & Renewal", duration: "1 week", deliverables: "Final report, renewal proposal" },
  ],
  pricing: [
    { id: uid(), description: "Monthly Retainer Fee", quantity: 6, rate: 4500 },
    { id: uid(), description: "Onboarding & Strategy Setup", quantity: 1, rate: 2500 },
    { id: uid(), description: "Marketing Automation Setup (HubSpot)", quantity: 1, rate: 2000 },
    { id: uid(), description: "Landing Page Design & Development", quantity: 6, rate: 600 },
  ],
  taxRate: 0,
  terms:
    "• Monthly retainer invoiced on the 1st of each month, due within 7 days\n• Minimum 3-month commitment; 30-day cancellation notice thereafter\n• Ad spend billed separately and passed through at cost with no markup\n• Reporting delivered within 5 business days of month end\n• Intellectual property for all created content transfers to client upon payment",
  notes:
    "GrowthHive is currently onboarding a limited number of clients to ensure dedicated service quality. We recommend scheduling a kickoff call within 5 business days of signing to secure your campaign launch date.",
};

// ─────────────────────────────────────────────────────────────────────────────
// INVOICES
// ─────────────────────────────────────────────────────────────────────────────

const consultingInvoice: InvoiceData = {
  invoiceNumber: "INV-2024-001",
  companyName: "Apex Consulting Group",
  freelancerName: "Marcus Chen",
  freelancerEmail: "marcus@apexconsulting.com",
  freelancerPhone: "+1 (312) 456-7890",
  freelancerAddress: "200 N Michigan Avenue, Suite 1800\nChicago, IL 60601",
  clientName: "Vertex Capital Partners",
  clientEmail: "accounts@vertexcapital.com",
  clientAddress: "330 N Wabash Avenue, Floor 28\nChicago, IL 60611",
  issueDate: today(),
  dueDate: in14Days(),
  logoUrl: "",
  brandColor: "#1e293b",
  items: [
    { id: uid(), description: "Strategic Advisory — Q4 2024 (Monthly Retainer)", quantity: 1, rate: 8500 },
    { id: uid(), description: "Board Presentation Preparation (6 hours)", quantity: 6, rate: 400 },
    { id: uid(), description: "Financial Modeling & Analysis", quantity: 1, rate: 3200 },
    { id: uid(), description: "Market Entry Research Report", quantity: 1, rate: 2800 },
    { id: uid(), description: "Travel & Expenses (NYC Meeting)", quantity: 1, rate: 1240 },
  ],
  taxRate: 8.5,
  notes:
    "This invoice covers advisory services rendered during November–December 2024. All engagements were pre-authorized per our Master Services Agreement dated 01/15/2024. Please remit payment via wire transfer using the banking details below.",
  paymentTerms: "Net 14 — Payment due within 14 days of invoice date. Late payments subject to 1.5% monthly interest.",
  bankName: "JPMorgan Chase",
  accountNumber: "••••••7842",
  routingNumber: "021000021",
};

const creativeInvoice: InvoiceData = {
  invoiceNumber: "INV-PC-0087",
  companyName: "Studio Luminos",
  freelancerName: "Sofia Vela",
  freelancerEmail: "sofia@studioluminos.co",
  freelancerPhone: "+1 (503) 789-2345",
  freelancerAddress: "4521 NE Alberta Street\nPortland, OR 97218",
  clientName: "Harmon & Co. Advertising",
  clientEmail: "payables@harmonco.agency",
  clientAddress: "1200 SW Morrison St, Suite 500\nPortland, OR 97205",
  issueDate: today(),
  dueDate: in14Days(),
  logoUrl: "",
  brandColor: "#7c3aed",
  items: [
    { id: uid(), description: "Brand Campaign Photography — 2-Day Shoot", quantity: 2, rate: 2200 },
    { id: uid(), description: "Post-Production & Retouching (est. 40 images)", quantity: 40, rate: 75 },
    { id: uid(), description: "Video Editing — 3x :30 Social Spots", quantity: 3, rate: 950 },
    { id: uid(), description: "Motion Graphics Package", quantity: 1, rate: 1800 },
    { id: uid(), description: "Usage License — Digital & Print (12 months)", quantity: 1, rate: 3500 },
    { id: uid(), description: "Studio Rental & Equipment", quantity: 1, rate: 680 },
  ],
  taxRate: 0,
  notes:
    "Creative assets delivered via Dropbox on December 10, 2024. Full resolution RAW files, edited TIFFs, and exported JPEGs included. Usage rights are granted for 12 months from delivery date; renewal options available upon request.",
  paymentTerms: "Net 14 — Digital transfer preferred. ACH, Zelle, or wire accepted.",
  bankName: "Bank of America",
  accountNumber: "••••••3391",
  routingNumber: "026009593",
};

const softwareInvoice: InvoiceData = {
  invoiceNumber: "INV-DEV-2024-Q4-003",
  companyName: "Ironclad Software Labs",
  freelancerName: "Dev Team — Ironclad",
  freelancerEmail: "billing@ironcladlabs.io",
  freelancerPhone: "+1 (737) 555-0196",
  freelancerAddress: "3601 S Congress Ave, Bldg E\nAustin, TX 78704",
  clientName: "DataBridge Logistics",
  clientEmail: "finance@databridgelogistics.com",
  clientAddress: "9800 Airport Blvd, Suite 220\nAustin, TX 78719",
  issueDate: today(),
  dueDate: in14Days(),
  logoUrl: "",
  brandColor: "#0f766e",
  items: [
    { id: uid(), description: "API Development — TMS Integration (Sprint 7 & 8)", quantity: 80, rate: 140 },
    { id: uid(), description: "Mobile App Feature: Real-Time Shipment Tracking", quantity: 60, rate: 140 },
    { id: uid(), description: "Database Architecture & Query Optimization", quantity: 24, rate: 165 },
    { id: uid(), description: "DevOps: CI/CD Pipeline Setup & Cloud Config", quantity: 20, rate: 155 },
    { id: uid(), description: "Code Review & Security Audit", quantity: 12, rate: 175 },
    { id: uid(), description: "QA Testing & Bug Resolution", quantity: 30, rate: 110 },
  ],
  taxRate: 0,
  notes:
    "Hours logged and approved via Harvest time tracking. Detailed sprint reports attached. Next sprint (Sprint 9) begins January 6, 2025. Please ensure payment is processed before kickoff to maintain project continuity.",
  paymentTerms: "Net 14 — Wire transfer or ACH only. No checks accepted.",
  bankName: "Silicon Valley Bank",
  accountNumber: "••••••6178",
  routingNumber: "121140399",
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────────────────────────────────────────

const freelanceDevContract: ContractData = {
  freelancerName: "Nathan Blake",
  freelancerAddress: "512 Startup Row, Unit 4B\nSan Francisco, CA 94107",
  freelancerEmail: "nathan@blakedev.io",
  clientName: "FinEdge Technologies, Inc.",
  clientAddress: "One Market Plaza, Suite 3600\nSan Francisco, CA 94105",
  clientEmail: "legal@finedge.tech",
  projectName: "FinEdge Mobile Banking App — MVP Development",
  effectiveDate: today(),
  completionDate: in30Days(),
  logoUrl: "",
  brandColor: "#1d4ed8",
  projectScope:
    "The Service Provider shall design and develop the FinEdge Mobile Banking MVP application for iOS and Android platforms using React Native. The application shall include user authentication, account dashboard, transaction history, fund transfers, and push notifications, as specified in the Product Requirements Document (PRD) attached as Exhibit A.",
  deliverables: [
    "React Native mobile application (iOS & Android) — production ready",
    "Biometric authentication and secure session management module",
    "Transaction engine with real-time balance updates",
    "Fund transfer module (internal and ACH) with validation",
    "Push notification system with preference management",
    "Unit and integration test suite (min 80% code coverage)",
    "Technical documentation and API reference guide",
    "Source code repository with full commit history",
  ],
  totalAmount: 42000,
  paymentSchedule: [
    { id: uid(), milestone: "Contract signing — Project Kickoff", amount: 12600, dueDate: today() },
    { id: uid(), milestone: "Authentication & Dashboard Module Delivery", amount: 10500, dueDate: "" },
    { id: uid(), milestone: "Transaction & Transfer Module Delivery", amount: 10500, dueDate: "" },
    { id: uid(), milestone: "Final delivery, testing & app store submission", amount: 8400, dueDate: "" },
  ],
  revisionLimit: 2,
  confidentialityClause:
    "The Service Provider acknowledges that all work product, financial data, system architecture, business logic, and user information disclosed during this engagement constitute proprietary and confidential information of FinEdge Technologies. The Service Provider shall not disclose, reproduce, or use such information for any purpose outside the scope of this agreement, during or for a period of 3 years following its termination. An NDA executed separately shall govern any additional disclosures.",
  terminationClause:
    "Either party may terminate this agreement with 21 days written notice. Upon termination, FinEdge shall pay for all work product deliverable and accepted up to the termination date. Partially completed milestones shall be pro-rated based on demonstrable progress. The $12,600 kickoff payment is non-refundable. All work product created and paid for shall transfer to FinEdge upon receipt of payment.",
  liabilityClause:
    "The Service Provider's aggregate liability under this agreement shall not exceed the total fees paid to the Service Provider in the 3 months preceding the event giving rise to liability. Neither party shall be liable for any indirect, consequential, special, or punitive damages. The Service Provider does not guarantee uninterrupted or error-free software operation after delivery and acceptance.",
  governingLaw: "State of California, United States — Santa Clara County jurisdiction",
  additionalTerms:
    "Intellectual property: All deliverables become the exclusive property of FinEdge upon full payment. The Service Provider retains the right to list FinEdge as a client reference unless otherwise instructed. The Service Provider may not subcontract any portion of this engagement without prior written consent.",
};

const designRetainerContract: ContractData = {
  freelancerName: "Ember Design Co.",
  freelancerAddress: "2200 Design District Blvd\nMiami, FL 33127",
  freelancerEmail: "contracts@emberdesign.co",
  clientName: "Pulse Fitness & Wellness Group",
  clientAddress: "8000 NW 36th Street, Suite 100\nMiami, FL 33166",
  clientEmail: "operations@pulsefitness.com",
  projectName: "Monthly Design Retainer — 2025",
  effectiveDate: today(),
  completionDate: "",
  logoUrl: "",
  brandColor: "#be185d",
  projectScope:
    "Ember Design Co. (Service Provider) shall provide ongoing creative design services to Pulse Fitness & Wellness Group (Client) on a monthly retainer basis. Services include digital and print graphic design, social media content creation, marketing collateral, and brand asset management, within the hours and deliverables outlined below. This agreement governs the period January 1, 2025 through December 31, 2025, with month-to-month renewal thereafter.",
  deliverables: [
    "Up to 40 billable design hours per month (unused hours do not roll over)",
    "Social media content: up to 20 posts per month (static + animated)",
    "Monthly marketing email design (up to 2 per month)",
    "Print and digital ad creative (up to 4 per month)",
    "Brand asset updates and management",
    "Priority turnaround: 48-hour standard, 24-hour rush (max 4/month)",
    "Monthly brand alignment review call (30 minutes)",
  ],
  totalAmount: 5500,
  paymentSchedule: [
    { id: uid(), milestone: "January 2025 Retainer", amount: 5500, dueDate: "2025-01-01" },
    { id: uid(), milestone: "February 2025 Retainer", amount: 5500, dueDate: "2025-02-01" },
    { id: uid(), milestone: "March 2025 Retainer (and monthly thereafter)", amount: 5500, dueDate: "2025-03-01" },
  ],
  revisionLimit: 3,
  confidentialityClause:
    "All creative work product, brand assets, campaign strategies, and business information shared by either party during this retainer shall be treated as confidential. The Service Provider shall not share, publish, or reproduce the Client's materials without prior written approval. The Client may request a portfolio exclusion at any time, and the Service Provider will comply within 14 days.",
  terminationClause:
    "Either party may terminate this agreement with 30 days written notice. The Client shall pay the full monthly retainer for the month in which notice is given. The Service Provider shall deliver all completed work files upon receipt of final payment. Early termination for cause (e.g., non-payment beyond 15 days) allows the Service Provider to suspend work immediately without penalty.",
  liabilityClause:
    "The Service Provider's maximum liability under this agreement is limited to the retainer fees paid in the preceding 30-day period. The Service Provider is not liable for outcomes of marketing campaigns, client printing errors, or third-party platform issues. The Client is responsible for obtaining any necessary stock image licenses unless otherwise agreed.",
  governingLaw: "State of Florida, United States — Miami-Dade County jurisdiction",
  additionalTerms:
    "Overages: Hours exceeding the monthly cap are billed at $145/hr, pre-approved in writing by the Client. Rush fees (beyond 4 per month): 25% surcharge. The Service Provider may feature completed work in their portfolio 90 days after delivery unless a written confidentiality request is received.",
};

const contentWritingContract: ContractData = {
  freelancerName: "Clarity Content Agency",
  freelancerAddress: "1401 Peachtree Street NE, Suite 500\nAtlanta, GA 30309",
  freelancerEmail: "projects@claritycontent.agency",
  clientName: "GreenPath Sustainability Co.",
  clientAddress: "3344 Peachtree Road, Tower 2\nAtlanta, GA 30326",
  clientEmail: "marketing@greenpath.eco",
  projectName: "Thought Leadership Content Package — Q1 2025",
  effectiveDate: today(),
  completionDate: "",
  logoUrl: "",
  brandColor: "#166534",
  projectScope:
    "Clarity Content Agency shall provide strategic content writing services to GreenPath Sustainability Co. for the purpose of establishing thought leadership in the sustainable business sector. The engagement covers long-form articles, whitepapers, email campaigns, and social media copy designed to increase organic traffic, build email list engagement, and position GreenPath as an authoritative voice in sustainable supply chain practices.",
  deliverables: [
    "4 long-form SEO blog articles per month (1,800–2,500 words each)",
    "1 industry whitepaper per quarter (4,000–6,000 words, fully formatted PDF)",
    "Monthly email newsletter (500–700 words) with subject line A/B variants",
    "LinkedIn thought leadership posts (12 per month, ghostwritten)",
    "Keyword research report and content strategy update (monthly)",
    "1 press release per quarter for company announcements",
  ],
  totalAmount: 0,
  paymentSchedule: [
    { id: uid(), milestone: "January 2025 Content Package", amount: 4200, dueDate: "2025-01-05" },
    { id: uid(), milestone: "February 2025 Content Package", amount: 4200, dueDate: "2025-02-05" },
    { id: uid(), milestone: "March 2025 Content Package + Q1 Whitepaper", amount: 5800, dueDate: "2025-03-05" },
  ],
  revisionLimit: 2,
  confidentialityClause:
    "All content created under this agreement is ghostwritten exclusively for GreenPath Sustainability Co. The Service Provider agrees not to disclose, publish, or reproduce any content, data, or business intelligence shared during this engagement. All deliverables are created as works-for-hire and the Client holds full copyright from the moment of delivery and payment.",
  terminationClause:
    "Either party may terminate this agreement with 30 days written notice. Content in progress at the time of termination shall be completed and billed pro-rata based on word count completed. Any content already delivered and paid for remains the sole property of GreenPath. The Service Provider shall archive and return all source materials within 10 business days of termination.",
  liabilityClause:
    "The Service Provider warrants that all content is original and does not knowingly infringe on any third-party copyright. If any content is found to infringe, the Service Provider will replace or revise it at no additional cost. The Service Provider is not liable for SEO performance outcomes, algorithm changes by search platforms, or publication decisions made by the Client.",
  governingLaw: "State of Georgia, United States — Fulton County jurisdiction",
  additionalTerms:
    "The Client agrees to provide subject matter expert access (interviews, data, quotes) within 3 business days of request to enable accurate content creation. Delays caused by the Client's failure to provide resources may extend deadlines proportionally. The Service Provider reserves the right to list GreenPath as a client for business development purposes.",
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const PREBUILT_TEMPLATES: PrebuiltTemplate[] = [
  // Proposals
  {
    id: "prebuilt-proposal-webdev",
    name: "E-Commerce Website Redesign",
    type: "proposal",
    description: "Full-stack web development proposal for a fashion e-commerce platform redesign.",
    industry: "Web Development",
    content: webDevProposal,
  },
  {
    id: "prebuilt-proposal-branding",
    name: "Brand Identity System",
    type: "proposal",
    description: "Complete visual identity package for a specialty coffee brand.",
    industry: "Branding & Design",
    content: brandingProposal,
  },
  {
    id: "prebuilt-proposal-marketing",
    name: "Digital Marketing Retainer",
    type: "proposal",
    description: "6-month B2B demand generation retainer for a healthcare tech company.",
    industry: "Marketing",
    content: marketingProposal,
  },

  // Invoices
  {
    id: "prebuilt-invoice-consulting",
    name: "Strategic Consulting Invoice",
    type: "invoice",
    description: "Professional consulting invoice with advisory fees, travel, and research services.",
    industry: "Consulting",
    content: consultingInvoice,
  },
  {
    id: "prebuilt-invoice-creative",
    name: "Photography & Video Production",
    type: "invoice",
    description: "Creative production invoice covering shoot, editing, and usage licensing.",
    industry: "Creative Production",
    content: creativeInvoice,
  },
  {
    id: "prebuilt-invoice-software",
    name: "Software Development Sprint",
    type: "invoice",
    description: "Time-tracked software engineering invoice for an agile development sprint.",
    industry: "Software Development",
    content: softwareInvoice,
  },

  // Contracts
  {
    id: "prebuilt-contract-mobiledev",
    name: "Mobile App Development Contract",
    type: "contract",
    description: "Fixed-scope contract for a fintech mobile banking MVP build.",
    industry: "Software Development",
    content: freelanceDevContract,
  },
  {
    id: "prebuilt-contract-design-retainer",
    name: "Design Retainer Agreement",
    type: "contract",
    description: "Ongoing monthly design retainer for a fitness brand.",
    industry: "Design Retainer",
    content: designRetainerContract,
  },
  {
    id: "prebuilt-contract-content",
    name: "Content Writing Contract",
    type: "contract",
    description: "Quarterly thought leadership content package for a sustainability company.",
    industry: "Content Writing",
    content: contentWritingContract,
  },
];
