"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconAlertCircle, IconCircleCheck, IconArrowLeft } from "@tabler/icons-react";
import { forgotPassword } from "@/app/auth/actions";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { message?: string; error?: string };
}) {
  const [origin, setOrigin] = useState("");
  const message = searchParams?.message;
  const error = searchParams?.error;

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
          <h1 className="text-2xl font-medium text-brand-dark">Reset Password</h1>
          <p className="text-sm text-text-secondary mt-1">We'll send you a link to recover your account</p>
        </div>

        {message && (
          <div className="flex items-start gap-2 p-3 bg-brand-light/30 text-brand-mid rounded-medium text-[12px] border border-brand-light">
            <IconCircleCheck size={16} stroke={2} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium mb-1">Check your email</p>
              <p>{message}</p>
              <p className="mt-2 opacity-80">If an account exists with this email, you'll receive a password reset link shortly. Please check your spam folder if you don't see it.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-status-overdue/10 text-status-overdue rounded-medium text-[12px] border border-status-overdue/20">
            <IconAlertCircle size={16} stroke={2} />
            <span>{error}</span>
          </div>
        )}

        <form action={forgotPassword} className="card space-y-4 shadow-sm bg-white">
          <input type="hidden" name="origin" value={origin} />
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
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full pill-btn py-3 justify-center group"
            >
              Send Reset Link
              <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <p className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-[12px] text-text-secondary hover:text-brand-dark transition-colors">
            <IconArrowLeft size={14} />
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
