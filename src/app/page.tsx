import React from "react";
import Link from "next/link";
import { 
  IconRocket, 
  IconShieldCheck, 
  IconSparkles, 
  IconArrowRight, 
  IconDeviceLaptop,
  IconUsers,
  IconBriefcase
} from "@tabler/icons-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-surface font-sans selection:bg-brand-accent/30">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-brand-light/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-dark rounded-medium flex items-center justify-center">
            <div className="flex gap-[2px]">
              <div className="w-1.5 h-3 bg-brand-accent rounded-[1px]"></div>
              <div className="w-1.5 h-3 bg-brand-accent rounded-[1px] opacity-60"></div>
            </div>
          </div>
          <span className="text-[16px] font-medium text-brand-dark tracking-tight uppercase">
            ClientFlow
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/auth/login" className="text-[13px] font-medium text-text-secondary hover:text-brand-dark transition-colors">
            Sign In
          </Link>
          <Link href="/auth/signup" className="pill-btn">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-20 pb-32 md:pt-32 text-center max-w-[900px] mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-light/20 border border-brand-light/50 rounded-pill mb-6">
          <IconSparkles size={14} className="text-brand-dark" />
          <span className="text-[10px] font-medium text-brand-dark uppercase tracking-widest">Powered by Gemini AI</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-medium text-brand-dark tracking-tight leading-[1.1] mb-6">
          The Trust-First CRM for <br />
          <span className="text-brand-accent italic">Agencies & Freelancers.</span>
        </h1>
        <p className="text-lg text-text-secondary max-w-[600px] mx-auto mb-10 leading-relaxed">
          Manage clients, projects, and payments in a unified workspace built for professional relationships.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup" className="pill-btn px-8 py-4 text-[15px] group">
            Start Free Trial
            <IconArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="pill-btn-outline px-8 py-4 text-[15px]">
            Watch Demo
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-24 bg-white border-y border-brand-light/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-brand-surface rounded-medium flex items-center justify-center text-brand-dark">
                <IconShieldCheck size={24} stroke={1.5} />
              </div>
              <h3 className="text-xl font-medium text-brand-dark">Built-in Trust</h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                Shared workspaces and real-time updates ensure your clients are always in the loop.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-brand-surface rounded-medium flex items-center justify-center text-brand-dark">
                <IconSparkles size={24} stroke={1.5} />
              </div>
              <h3 className="text-xl font-medium text-brand-dark">AI Assistant</h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                Draft proposals, summarize chats, and generate project roadmaps using Gemini AI.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-brand-surface rounded-medium flex items-center justify-center text-brand-dark">
                <IconDeviceLaptop size={24} stroke={1.5} />
              </div>
              <h3 className="text-xl font-medium text-brand-dark">Unified Flow</h3>
              <p className="text-[14px] text-text-secondary leading-relaxed">
                From intake forms to final invoices, manage the entire project lifecycle in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Role Switcher Section */}
      <section className="px-6 py-24 bg-brand-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-medium text-brand-dark text-center mb-16">Designed for Every Participant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-8 bg-brand-dark text-white border-none">
              <IconBriefcase size={32} className="text-brand-accent mb-6" />
              <h4 className="text-xl font-medium mb-2">For Freelancers</h4>
              <p className="text-sm opacity-70 mb-8 leading-relaxed">
                Organize your client list, generate referral codes, and get paid faster with automated invoicing.
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 text-brand-accent text-sm font-medium hover:gap-3 transition-all">
                Create Agency Account <IconArrowRight size={16} />
              </Link>
            </div>
            <div className="card p-8 bg-white border-brand-light/50">
              <IconUsers size={32} className="text-brand-dark mb-6" />
              <h4 className="text-xl font-medium text-brand-dark mb-2">For Clients</h4>
              <p className="text-sm text-text-secondary mb-8 leading-relaxed">
                Track your projects, upload assets, and communicate directly with your agency in a secure portal.
              </p>
              <Link href="/auth/signup" className="inline-flex items-center gap-2 text-brand-dark text-sm font-medium hover:gap-3 transition-all">
                Join your Freelancer <IconArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-brand-light/30 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-50 grayscale">
          <div className="w-6 h-6 bg-brand-dark rounded-small flex items-center justify-center scale-75">
            <div className="flex gap-[1px]">
              <div className="w-1 h-2 bg-brand-accent rounded-[1px]"></div>
              <div className="w-1 h-2 bg-brand-accent rounded-[1px] opacity-60"></div>
            </div>
          </div>
          <span className="text-[12px] font-medium text-brand-dark tracking-tighter uppercase">
            ClientFlow CRM
          </span>
        </div>
        <p className="text-[11px] text-text-tertiary">
          © 2026 ClientFlow. All rights reserved. Built with Next.js and Supabase.
        </p>
      </footer>
    </div>
  );
}
