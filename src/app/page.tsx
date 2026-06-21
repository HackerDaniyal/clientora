"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconSparkles,
  IconArrowRight,
  IconUsers,
  IconBriefcase,
  IconCheck,
  IconMessageCircle,
  IconCalendar,
  IconFileText,
  IconChartBar,
  IconWallet,
  IconShieldCheck,
  IconChevronDown,
  IconBrandGithub,
  IconBrandTwitter,
  IconPlayerPlay,
  IconRefresh,
  IconDeviceLaptop,
  IconRocket,
  IconSearch,
  IconBell,
  IconChevronRight,
  IconTrendingUp,
  IconClock,
  IconFolder,
  IconClipboardCheck,
  IconFileInvoice,
  IconSettings,
} from "@tabler/icons-react";

/* ── FAQ Accordion Item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-[15px] font-medium text-brand-dark group-hover:text-brand-mid transition-colors pr-4">
          {q}
        </span>
        <IconChevronDown
          size={20}
          className={`text-brand-accent shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-[14px] text-text-secondary leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ── Feature Card (light theme) ── */
function FeatureCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-brand-accent/30 hover:shadow-lg transition-all">
      <div className="w-12 h-12 rounded-xl bg-brand-surface flex items-center justify-center mb-4 group-hover:bg-brand-accent/15 transition-colors">
        <Icon size={22} className="text-brand-mid" />
      </div>
      <h3 className="text-[15px] font-semibold text-brand-dark mb-1.5">{title}</h3>
      <p className="text-[13px] text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Testimonial Card ── */
function TestimonialCard({ company, tag, quote, name, role }: { company: string; tag: string; quote: string; name: string; role: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[13px] font-semibold text-brand-mid">{company}</span>
        <span className="text-[11px] text-text-tertiary">• {tag}</span>
      </div>
      <p className="text-[14px] text-text-secondary leading-relaxed mb-5 italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-brand-surface flex items-center justify-center text-[12px] font-bold text-brand-mid">
          {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
        </div>
        <div>
          <div className="text-[13px] font-medium text-brand-dark">{name}</div>
          <div className="text-[11px] text-text-tertiary">{role}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Preview (realistic mockup) ── */
function DashboardPreview() {
  const bars = [
    { day: "Mon", h: 8 }, { day: "Tue", h: 15 }, { day: "Wed", h: 12 },
    { day: "Thu", h: 18 }, { day: "Fri", h: 10 }, { day: "Sat", h: 5 }, { day: "Sun", h: 3 },
  ];
  const maxBar = 20;

  return (
    <div className="bg-white rounded-2xl shadow-2xl shadow-brand-dark/10 border border-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-brand-accent rounded-md flex items-center justify-center">
            <IconCheck size={12} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-brand-dark">Clientora</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <IconSearch size={12} className="text-gray-400" />
            <span className="text-[11px] text-gray-400">Search...</span>
          </div>
          <IconBell size={14} className="text-gray-400" />
          <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-[9px] font-bold text-brand-mid">JD</div>
        </div>
      </div>

      <div className="p-5">
        {/* KPI Row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-brand-accent rounded-xl p-3.5">
            <div className="text-[10px] text-white/80 mb-1">Active Projects</div>
            <div className="text-xl font-bold text-white">12</div>
            <div className="text-[9px] text-white/70 mt-0.5">3 completing this week</div>
          </div>
          <div className="bg-brand-surface rounded-xl p-3.5">
            <div className="text-[10px] text-text-tertiary mb-1">Total Clients</div>
            <div className="text-xl font-bold text-brand-dark">28</div>
            <div className="text-[9px] text-brand-accent mt-0.5">+5 this month</div>
          </div>
          <div className="bg-brand-surface rounded-xl p-3.5">
            <div className="text-[10px] text-text-tertiary mb-1">Pending Invoices</div>
            <div className="text-xl font-bold text-brand-dark">4</div>
            <div className="text-[9px] text-amber-600 mt-0.5">$12,450 outstanding</div>
          </div>
        </div>

        {/* Chart + Donut */}
        <div className="grid grid-cols-5 gap-3 mb-5">
          {/* Bar chart */}
          <div className="col-span-3 bg-gray-50 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-brand-dark">Project Activity</span>
              <span className="text-[9px] text-text-tertiary">This Week</span>
            </div>
            <div className="flex items-end gap-2 h-16">
              {bars.map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-sm bg-brand-accent/80 hover:bg-brand-accent transition-colors"
                    style={{ height: `${(b.h / maxBar) * 100}%`, minHeight: "4px" }}
                  />
                  <span className="text-[8px] text-text-tertiary">{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut chart */}
          <div className="col-span-2 bg-gray-50 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-brand-dark mb-2">Pipeline</div>
            <div className="relative w-16 h-16 mx-auto mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#D4F0E2" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#3ACF84" strokeWidth="3"
                  strokeDasharray="38 60" strokeLinecap="round" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1A6B45" strokeWidth="3"
                  strokeDasharray="22 76" strokeDashoffset="-38" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-brand-dark">12</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-accent" />
                <span className="text-[9px] text-text-tertiary">Active (7)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-mid" />
                <span className="text-[9px] text-text-tertiary">Review (3)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-tint" />
                <span className="text-[9px] text-text-tertiary">Done (2)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent clients + Revenue */}
        <div className="grid grid-cols-2 gap-3">
          {/* Recent clients */}
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-brand-dark mb-2.5">Recent Clients</div>
            <div className="space-y-2">
              {[
                { name: "Sarah Mitchell", email: "sarah@designco.io", initials: "SM" },
                { name: "James Carter", email: "james@techlabs.com", initials: "JC" },
                { name: "Aisha Khan", email: "aisha@nexvent.io", initials: "AK" },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center text-[8px] font-bold text-brand-mid shrink-0">
                    {c.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-brand-dark truncate">{c.name}</div>
                    <div className="text-[9px] text-text-tertiary truncate">{c.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-gray-50 rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-brand-dark mb-2.5">Revenue Overview</div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg font-bold text-brand-dark">$48,250</span>
              <span className="text-[9px] text-brand-accent font-medium bg-brand-accent/10 px-1.5 py-0.5 rounded-full">+12%</span>
            </div>
            {/* Mini sparkline */}
            <svg viewBox="0 0 120 30" className="w-full h-8">
              <polyline
                points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 105,5 120,8"
                fill="none"
                stroke="#3ACF84"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="0,25 15,20 30,22 45,15 60,18 75,10 90,12 105,5 120,8 120,30 0,30"
                fill="url(#sparkGrad)"
                opacity="0.3"
              />
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3ACF84" />
                  <stop offset="100%" stopColor="#3ACF84" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex justify-between text-[8px] text-text-tertiary mt-0.5">
              <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  MAIN LANDING PAGE                                                 */
/* ================================================================= */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-accent/30">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="flex justify-between items-center px-6 md:px-12 lg:px-20 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-dark rounded-lg flex items-center justify-center">
              <div className="flex gap-[2px]">
                <div className="w-1.5 h-3.5 bg-brand-accent rounded-[1px]" />
                <div className="w-1.5 h-3.5 bg-brand-accent rounded-[1px] opacity-60" />
              </div>
            </div>
            <span className="text-[18px] font-bold text-brand-dark tracking-tight">Clientora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[13px] text-text-secondary hover:text-brand-dark transition-colors">Features</a>
            <a href="#how-it-works" className="text-[13px] text-text-secondary hover:text-brand-dark transition-colors">How It Works</a>
            <a href="#testimonials" className="text-[13px] text-text-secondary hover:text-brand-dark transition-colors">Testimonials</a>
            <a href="#faq" className="text-[13px] text-text-secondary hover:text-brand-dark transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-[13px] font-medium text-text-secondary hover:text-brand-dark transition-colors px-4 py-2">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-brand-mid hover:bg-brand-dark text-white text-[13px] font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold text-brand-dark tracking-tight leading-[1.1] mb-6">
                Manage Clients &{" "}
                <span className="text-brand-accent">Projects</span>
                <br />in One Workspace
              </h1>

              <p className="text-[16px] md:text-[17px] text-text-secondary max-w-[480px] mb-10 leading-relaxed">
                A simple, powerful CRM for freelancers and agencies. Onboard clients, generate proposals, track projects, and manage invoices — all in one secure dashboard.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-4 mb-10">
                <Link
                  href="/auth/signup"
                  className="bg-brand-mid hover:bg-brand-dark text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
                >
                  Start Free Trial
                  <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#features"
                  className="border-2 border-brand-dark/15 hover:border-brand-dark/30 text-brand-dark font-medium px-7 py-3.5 rounded-full transition-all flex items-center gap-2"
                >
                  <IconPlayerPlay size={16} className="text-brand-mid" />
                  Book a Demo
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {["SM", "JC", "AK", "RL"].map((initials, i) => (
                    <div
                      key={initials}
                      className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white ${["bg-brand-mid", "bg-brand-accent", "bg-brand-green", "bg-brand-dark"][i]
                        }`}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <svg key={s} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[11px] text-text-tertiary">Trusted by 1,000+ freelancers</span>
                </div>
              </div>
            </div>

            {/* Right — Dashboard Preview */}
            <div className="relative">
              <DashboardPreview />
              {/* Floating badge */}
              <div className="absolute -left-4 top-8 bg-white rounded-xl shadow-lg shadow-brand-dark/8 border border-gray-100 px-3 py-2 flex items-center gap-2 z-10">
                <IconSparkles size={14} className="text-brand-accent" />
                <span className="text-[11px] font-medium text-brand-dark">AI-Powered CRM</span>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── How It Works ── */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">From Referral to Revenue in <span className="text-brand-accent">4 Steps</span></h2>
            <p className="text-[15px] text-text-secondary max-w-[520px] mx-auto">A seamless workflow designed to get you from first contact to project delivery.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", icon: IconBriefcase, title: "Share Referral Code", desc: "Generate a unique code and share it with potential clients." },
              { step: "02", icon: IconFileText, title: "Client Submits Brief", desc: "Client fills out a guided multi-step project wizard." },
              { step: "03", icon: IconClipboardCheck, title: "Review & Accept", desc: "Review the project brief and accept to auto-create a workspace." },
              { step: "04", icon: IconRocket, title: "Deliver & Invoice", desc: "Collaborate, generate documents, and get paid faster." },
            ].map((item) => (
              <div key={item.step} className="relative p-6 rounded-2xl bg-white border border-gray-100 hover:border-brand-accent/30 hover:shadow-lg transition-all group">
                <span className="text-[48px] font-bold text-brand-surface absolute top-4 right-4 leading-none group-hover:text-brand-accent/20 transition-colors">{item.step}</span>
                <div className="w-12 h-12 rounded-xl bg-brand-surface flex items-center justify-center mb-4 group-hover:bg-brand-accent/15 transition-colors">
                  <item.icon size={22} className="text-brand-mid" />
                </div>
                <h3 className="text-[15px] font-semibold text-brand-dark mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value Props ── */}
      <section className="px-6 py-24 bg-brand-surface/30">
        <div className="max-w-7xl mx-auto">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">Financial Control</span>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 leading-tight">
                Control Your Business <span className="text-brand-accent">Financials</span>
              </h2>
              <p className="text-[15px] text-text-secondary mb-8 leading-relaxed max-w-md">
                Track revenue, expenses, and profitability across all client projects. Generate invoices and proposals with one click.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { value: "2,847", label: "Total Clients" },
                  { value: "1,432", label: "Active Projects" },
                  { value: "$64,981", label: "Total Revenue", accent: true },
                  { value: "$18,158", label: "Net Profit" },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-xl p-4 ${(stat as any).accent ? "bg-brand-accent/10 border border-brand-accent/20" : "bg-white border border-gray-100"}`}>
                    <div className={`text-xl font-bold mb-0.5 ${(stat as any).accent ? "text-brand-mid" : "text-brand-dark"}`}>{stat.value}</div>
                    <div className="text-[12px] text-text-tertiary">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[12px] text-brand-accent font-medium">
                <IconRefresh size={14} />
                <span>+12% from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-semibold text-brand-dark">Revenue Overview</span>
                <span className="text-[11px] text-brand-accent font-medium bg-brand-accent/10 px-2 py-1 rounded-full">+15% this quarter</span>
              </div>
              <div className="flex items-end gap-2 h-28 mb-4">
                {[40, 55, 35, 70, 50, 85, 65, 90, 72, 95, 80, 88].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-sm bg-brand-accent/70 hover:bg-brand-accent transition-colors" style={{ height: `${h}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-text-tertiary">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="text-[14px] font-semibold text-brand-dark mb-4">Project Pipeline</div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Lead", count: 5, color: "bg-blue-50 text-blue-600" },
                  { label: "Active", count: 4, color: "bg-brand-accent/15 text-brand-mid" },
                  { label: "Review", count: 2, color: "bg-amber-50 text-amber-600" },
                  { label: "Done", count: 8, color: "bg-emerald-50 text-emerald-600" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                    <div className="text-xl font-bold">{s.count}</div>
                    <div className="text-[10px] opacity-70 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5">
                {[
                  { name: "E-commerce Redesign", stage: "Active", pct: 65 },
                  { name: "Brand Identity Package", stage: "Review", pct: 90 },
                  { name: "Mobile App MVP", stage: "Lead", pct: 15 },
                ].map((p) => (
                  <div key={p.name} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-brand-dark truncate">{p.name}</div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1.5">
                        <div className="bg-brand-accent h-1 rounded-full" style={{ width: `${p.pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] font-medium text-text-tertiary shrink-0">{p.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">Pipeline Management</span>
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4 leading-tight">
                Visualize Your <span className="text-brand-accent">Client Pipeline</span>
              </h2>
              <p className="text-[15px] text-text-secondary mb-6 leading-relaxed max-w-md">
                Track every client from first contact to project completion with a Kanban-style pipeline. Never lose track of a lead again.
              </p>
              <ul className="space-y-3 mb-6">
                {["Drag-and-drop stage management", "Real-time status updates", "Automated notifications on stage change"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                      <IconCheck size={12} className="text-brand-accent" />
                    </div>
                    <span className="text-[13px] text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">Features</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">
              Everything You Need to <span className="text-brand-accent">Grow</span>
            </h2>
            <p className="text-[15px] text-text-secondary max-w-[520px] mx-auto">
              Powerful features built specifically for freelancers and boutique agencies.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard icon={IconMessageCircle} title="Realtime Chat" desc="Communicate with clients instantly within shared workspaces." />
            <FeatureCard icon={IconChartBar} title="Pipeline Kanban" desc="Visualize your client pipeline from lead to completed." />
            <FeatureCard icon={IconFileText} title="Smart Documents" desc="Generate proposals, invoices, and contracts from project data." />
            <FeatureCard icon={IconSparkles} title="AI Assistant" desc="Draft proposals, summarize chats, and get pricing suggestions." />
            <FeatureCard icon={IconShieldCheck} title="Secure Storage" desc="Store and share project assets with role-based access control." />
            <FeatureCard icon={IconCalendar} title="Task Management" desc="Assign tasks, set priorities, and track deadlines collaboratively." />
            <FeatureCard icon={IconUsers} title="Team Collaboration" desc="Invite members to workspaces and collaborate in real-time." />
            <FeatureCard icon={IconRocket} title="Quick Onboarding" desc="Clients onboard via referral codes and guided project wizards." />
          </div>
        </div>
      </section>

      {/* ── Role Selection Cards ── */}
      <section className="px-6 py-24 bg-brand-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">Get Started</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Choose Your <span className="text-brand-accent">Path</span></h2>
            <p className="text-[15px] text-text-secondary max-w-[520px] mx-auto">
              Whether you manage clients or hire freelancers, we have the right tools for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Freelancer */}
            <div className="group relative bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-brand-accent/50 transition-all hover:shadow-xl">
              <div className="absolute top-0 right-0 bg-brand-accent text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-2xl">POPULAR</div>
              <div className="w-14 h-14 bg-brand-accent/10 rounded-xl flex items-center justify-center mb-6">
                <IconBriefcase size={28} className="text-brand-mid" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">For Freelancers & Agencies</h3>
              <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
                Manage your entire business from one dashboard. Track clients, projects, invoices, and payments.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Unlimited client management", "Automated invoicing & contracts", "Real-time project tracking", "AI-powered assistant", "Referral code system"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <IconCheck size={16} className="text-brand-accent mt-0.5 shrink-0" />
                    <span className="text-[13px] text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="w-full bg-brand-mid hover:bg-brand-dark text-white font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all group/btn shadow-md">
                Start as Freelancer
                <IconArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Client */}
            <div className="group bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-brand-dark/20 transition-all hover:shadow-xl">
              <div className="w-14 h-14 bg-brand-surface rounded-xl flex items-center justify-center mb-6">
                <IconUsers size={28} className="text-brand-dark" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-3">For Clients & Businesses</h3>
              <p className="text-[14px] text-text-secondary mb-6 leading-relaxed">
                Get full visibility into your projects. Track progress, communicate, and manage deliverables.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Real-time project updates", "Direct messaging with team", "Secure file sharing", "Invoice & payment history", "Easy project requests"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <IconCheck size={16} className="text-brand-dark mt-0.5 shrink-0" />
                    <span className="text-[13px] text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="w-full border-2 border-brand-dark/15 hover:border-brand-dark/30 text-brand-dark font-semibold py-3.5 rounded-full flex items-center justify-center gap-2 transition-all group/btn">
                Join as Client
                <IconArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">
              What Our Users <span className="text-brand-accent">Say</span>
            </h2>
            <p className="text-[15px] text-text-secondary max-w-[480px] mx-auto">
              Hear from freelancers and clients who transformed their workflow with Clientora.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TestimonialCard company="Sarah K." tag="Freelance Designer" quote="Clientora replaced my entire stack of spreadsheets, email threads, and file-sharing tools. Now everything lives in one beautiful workspace." name="Sarah Kim" role="Freelance Designer" />
            <TestimonialCard company="Marcus J." tag="Agency Owner" quote="The AI assistant alone saves me hours every week. It drafts proposals and summarizes client conversations perfectly." name="Marcus Johnson" role="CEO, PixelCraft Agency" />
            <TestimonialCard company="Aisha R." tag="Tech Startup" quote="As a client, I finally have full visibility into my projects. The real-time chat and task tracking keep everyone accountable." name="Aisha Rahman" role="Product Manager, NexaTech" />
            <TestimonialCard company="David L." tag="Web Developer" quote="The pipeline Kanban and automated invoicing have completely changed how I manage my freelance business. Highly recommend." name="David Lee" role="Full-Stack Developer" />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 py-24 bg-brand-surface/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-semibold text-brand-accent uppercase tracking-wider mb-3 bg-brand-accent/10 px-3 py-1 rounded-full">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">
              Common <span className="text-brand-accent">Questions</span>
            </h2>
            <p className="text-[15px] text-text-secondary">Everything you need to know before getting started.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 px-6 md:px-8 shadow-sm">
            <FaqItem q="Can I try Clientora for free before committing?" a="Yes! Clientora offers a free 14-day trial with full access to all features. No credit card required to start." />
            <FaqItem q="Is there a mobile app version of Clientora?" a="Clientora is a fully responsive web application that works beautifully on mobile devices, tablets, and desktops. A native mobile app is on our roadmap." />
            <FaqItem q="Is my client data secure on Clientora?" a="Absolutely. We use Supabase with Row Level Security (RLS) policies ensuring each user only sees their own data. All file storage is encrypted and access-controlled." />
            <FaqItem q="How does the AI assistant work?" a="Our AI assistant is powered by Google Gemini. It can draft proposals, summarize chat conversations, suggest pricing, and answer business questions — all within your workspace context." />
            <FaqItem q="Can I invite team members to collaborate?" a="Yes! You can invite workspace members (developers, designers) to specific client projects with editor or viewer roles. They get real-time access to tasks, chat, and documents." />
          </div>
        </div>
      </section>

      {/* ── CTA + Footer ── */}
      <footer className="px-6 pt-24 pb-12 bg-brand-dark">
        <div className="max-w-7xl mx-auto">
          {/* CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start pb-16 border-b border-white/10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Ready to transform your <span className="text-brand-accent">workflow?</span>
              </h2>
              <p className="text-[15px] text-white/50 mb-8 max-w-md">
                Join thousands of freelancers and agencies who trust Clientora to manage their business.
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-green text-white font-semibold px-8 py-4 rounded-full transition-all shadow-lg shadow-brand-accent/25 group">
                Get Started Free
                <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-[12px] text-white/30 mt-4">No credit card required · Free 14-day trial</p>
            </div>

            <div className="grid grid-cols-3 gap-8">
              <div>
                <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Product</h4>
                <ul className="space-y-3">
                  {["Features", "Pipeline", "Documents", "AI Assistant"].map((l) => (
                    <li key={l}><a href="#features" className="text-[13px] text-white/40 hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Company</h4>
                <ul className="space-y-3">
                  {["About", "Blog", "Careers", "Press"].map((l) => (
                    <li key={l}><a href="#" className="text-[13px] text-white/40 hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-4">Legal</h4>
                <ul className="space-y-3">
                  {["Terms of Service", "Privacy Policy", "Cookies"].map((l) => (
                    <li key={l}><a href="#" className="text-[13px] text-white/40 hover:text-white transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center">
                <div className="flex gap-[2px]">
                  <div className="w-1 h-2.5 bg-white rounded-[1px]" />
                  <div className="w-1 h-2.5 bg-white rounded-[1px] opacity-60" />
                </div>
              </div>
              <span className="text-[14px] font-semibold text-white/80">Clientora</span>
            </div>
            <p className="text-[12px] text-white/25">© 2026 Clientora Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-white/30 hover:text-white/70 transition-colors"><IconBrandTwitter size={18} /></a>
              <a href="#" className="text-white/30 hover:text-white/70 transition-colors"><IconBrandGithub size={18} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
