"use client";

import React, { useState } from "react";
import Link from "next/link";
import { IconBriefcase, IconUser, IconArrowRight, IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { signup } from "@/app/auth/actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [role, setRole] = useState<"freelancer" | "client" | null>(null);
  const error = searchParams?.error;

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center">
          <div className="inline-flex w-10 h-10 bg-brand-dark rounded-medium items-center justify-center mb-4">
            <div className="flex gap-[2px]">
              <div className="w-1.5 h-3 bg-brand-accent rounded-[1px]"></div>
              <div className="w-1.5 h-3 bg-brand-accent rounded-[1px] opacity-60"></div>
            </div>
          </div>
          <h1 className="text-2xl font-medium text-brand-dark">Join ClientFlow</h1>
          <p className="text-sm text-text-secondary mt-1">Select your account type to get started</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-status-overdue/10 text-status-overdue rounded-medium text-[12px] border border-status-overdue/20">
            <IconAlertCircle size={16} stroke={2} />
            <span>{error}</span>
          </div>
        )}

        <form action={signup} className="space-y-6">
          <input type="hidden" name="role" value={role || ""} />
          
          <div className="grid grid-cols-1 gap-4">
            <button
              type="button"
              onClick={() => setRole("freelancer")}
              className={cn(
                "card flex flex-col items-center gap-3 text-center transition-all border-[1.5px]",
                role === "freelancer" 
                  ? "border-brand-dark bg-white shadow-sm" 
                  : "border-transparent bg-white/50 hover:bg-white"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                role === "freelancer" ? "bg-brand-dark text-white" : "bg-brand-light/30 text-brand-dark"
              )}>
                <IconBriefcase size={24} stroke={2} />
              </div>
              <div>
                <p className="font-medium text-brand-dark">Freelancer / Agency</p>
                <p className="text-[11px] text-text-tertiary">Manage clients, proposals, and workspaces</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("client")}
              className={cn(
                "card flex flex-col items-center gap-3 text-center transition-all border-[1.5px]",
                role === "client" 
                  ? "border-brand-dark bg-white shadow-sm" 
                  : "border-transparent bg-white/50 hover:bg-white"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                role === "client" ? "bg-brand-dark text-white" : "bg-brand-light/30 text-brand-dark"
              )}>
                <IconUser size={24} stroke={2} />
              </div>
              <div>
                <p className="font-medium text-brand-dark">Client / Project Owner</p>
                <p className="text-[11px] text-text-tertiary">Track progress, chat, and manage documents</p>
              </div>
            </button>
          </div>

          {role && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Full Name</label>
                <input 
                  name="fullName"
                  type="text" 
                  required
                  placeholder="John Doe"
                  className="w-full bg-white border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Email Address</label>
                <input 
                  name="email"
                  type="email" 
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Password</label>
                <input 
                  name="password"
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-white border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!role}
            className="w-full pill-btn py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            Continue as {role ? (role === "freelancer" ? "Freelancer" : "Client") : "..."}
            <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <p className="text-center text-[12px] text-text-secondary">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-brand-dark font-medium underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
