"use client";

import React, { useState } from "react";
import { IconArrowRight, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { updatePassword } from "@/app/auth/actions";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const error = searchParams?.error;
  const message = searchParams?.message;

  const handleSubmit = async (formData: FormData) => {
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters");
      return;
    }

    formData.set("password", password);
    await updatePassword(formData);
  };

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
          <h1 className="text-2xl font-medium text-brand-dark">Set New Password</h1>
          <p className="text-sm text-text-secondary mt-1">Please enter your new secure password</p>
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

        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-status-overdue/10 text-status-overdue rounded-medium text-[12px] border border-status-overdue/20">
            <IconAlertCircle size={16} stroke={2} />
            <span>{validationError}</span>
          </div>
        )}

        <form action={handleSubmit} className="card space-y-4 shadow-sm bg-white">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">New Password</label>
            <input 
              name="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Confirm New Password</label>
            <input 
              name="confirmPassword"
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
            />
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className="w-full pill-btn py-3 justify-center group"
            >
              Update Password
              <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
