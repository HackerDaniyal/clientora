"use client";

import React, { useState } from "react";
import { IconLink, IconArrowRight, IconAlertCircle, IconCircleCheck } from "@tabler/icons-react";
import { linkFreelancer } from "./actions";
import { useRouter } from "next/navigation";

export default function LinkPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ freelancerName: string; redirect: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    
    const result = await linkFreelancer(formData);
    
    if (result?.error) {
      setError(result.error);
      setPending(false);
    } else if (result?.success) {
      setSuccess({
        freelancerName: result.freelancerName,
        redirect: result.redirect
      });
    }
  }

  const handleContinue = () => {
    if (success?.redirect) {
      router.push(success.redirect);
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-[440px] space-y-8">
          <div className="text-center">
            <div className="inline-flex w-16 h-16 bg-brand-accent/10 rounded-full items-center justify-center mb-4 mx-auto">
              <IconCircleCheck size={32} stroke={2} className="text-brand-accent" />
            </div>
            <h1 className="text-2xl font-medium text-brand-dark">Successfully Linked!</h1>
            <p className="text-sm text-text-secondary mt-2">
              You are now connected with <span className="font-medium text-brand-dark">{success.freelancerName}</span>
            </p>
          </div>

          <div className="card space-y-4 bg-white border-brand-light">
            <p className="text-[13px] text-text-secondary text-center">
              Please complete your project form to get started. This will help your freelancer understand your requirements and begin working on your project.
            </p>
            
            <button
              onClick={handleContinue}
              className="w-full pill-btn py-3 justify-center group"
            >
              Complete Project Form
              <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <div className="w-full max-w-[440px] space-y-8">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 bg-brand-light/30 rounded-medium items-center justify-center mb-4 text-brand-dark">
            <IconLink size={24} stroke={2} />
          </div>
          <h1 className="text-2xl font-medium text-brand-dark">Link Your Freelancer</h1>
          <p className="text-sm text-text-secondary mt-1">
            Enter the referral code provided by your freelancer to unlock your workspace.
          </p>
        </div>

        <form action={handleSubmit} className="card space-y-4 shadow-sm bg-white border-brand-light">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Referral Code</label>
            <input 
              name="code"
              type="text" 
              required
              placeholder="FL-XXXXXX"
              className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-3 text-lg font-mono text-brand-dark outline-none focus:border-brand-accent transition-colors placeholder:text-text-tertiary placeholder:font-sans"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-status-overdue/10 text-status-overdue rounded-medium text-[12px]">
              <IconAlertCircle size={16} stroke={2} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full pill-btn py-3 justify-center group disabled:opacity-50"
            >
              {pending ? "Linking..." : "Link Account"}
              <IconArrowRight size={16} stroke={2} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="card bg-brand-surface border-none p-4">
          <h4 className="text-[11px] font-medium text-brand-dark uppercase mb-1">Don't have a code?</h4>
          <p className="text-[11px] text-text-secondary">
            Your freelancer must provide you with a unique link code. If you haven't received one, please contact them directly.
          </p>
        </div>
      </div>
    </div>
  );
}
