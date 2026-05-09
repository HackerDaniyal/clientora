"use client";

import React from "react";
import Link from "next/link";
import { IconArrowRight, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { login } from "@/app/auth/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; error?: string; redirect?: string };
}) {
  const message = searchParams?.message;
  const error = searchParams?.error;
  const redirect = searchParams?.redirect;

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
          <h1 className="text-2xl font-medium text-brand-dark">Welcome Back</h1>
          <p className="text-sm text-text-secondary mt-1">Sign in to manage your workspaces</p>
        </div>

        {message && (
          <div className="flex items-center gap-2 p-3 bg-brand-light/30 text-brand-mid rounded-medium text-[12px] border border-brand-light">
            <IconCircleCheck size={16} stroke={2} />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-status-overdue/10 text-status-overdue rounded-medium text-[12px] border border-status-overdue/20">
            <IconAlertCircle size={16} stroke={2} />
            <span>{error}</span>
          </div>
        )}

        <form action={login} className="card space-y-4 shadow-sm bg-white">
          {redirect && <input type="hidden" name="redirect" value={redirect} />}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Email Address</label>
            <input 
              name="email"
              type="email" 
              required
              placeholder="name@example.com"
              className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Password</label>
              <Link href="/auth/forgot-password" className="text-[10px] text-brand-dark underline opacity-70">Forgot password?</Link>
            </div>
            <input 
              name="password"
              type="password" 
              required
              placeholder="••••••••"
              className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full pill-btn py-3 justify-center group"
            >
              Sign In
              <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <p className="text-center text-[12px] text-text-secondary">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-brand-dark font-medium underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
