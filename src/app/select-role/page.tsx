"use client";

import React, { useState } from "react";
import { IconBriefcase, IconUser, IconArrowRight, IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { updateRole } from "./actions";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";

const roleOptions = [
  {
    value: "freelancer" as const,
    label: "Freelancer",
    eyebrow: "For service providers",
    description: "Manage clients, track projects, and send invoices.",
    icon: IconBriefcase,
  },
  {
    value: "client" as const,
    label: "Client",
    eyebrow: "For project owners",
    description: "Submit briefs, review progress, and collaborate.",
    icon: IconUser,
  },
];

function SubmitButton({ role }: { role: "freelancer" | "client" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-dark px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-brand-dark/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
    >
      {pending ? "Setting up..." : `Continue as ${role === "freelancer" ? "Freelancer" : "Client"}`}
      {!pending && <IconArrowRight size={18} />}
    </button>
  );
}

const initialState = {
  error: null as string | null,
};

export default function SelectRolePage() {
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");
  const [state, formAction] = useFormState(updateRole, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12 font-sans text-brand-dark">
      <div className="w-full max-w-[400px]">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-brand-dark">
              <span className="flex gap-[2px]">
                <span className="h-3.5 w-1.5 rounded-[2px] bg-brand-accent" />
                <span className="h-3.5 w-1.5 rounded-[2px] bg-brand-accent/60" />
              </span>
            </span>
            <span className="text-[15px] font-semibold tracking-wide text-brand-dark">Clientora</span>
          </Link>

          <h1 className="text-[22px] font-medium tracking-tight text-[#1a1a1a] sm:text-[24px]">
            Choose your role
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a5a5a]">
            Select how you will use Clientora to complete your setup.
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-[#e5e5e5] bg-[#fff0f0] px-4 py-3 text-[14px] text-[#d83c2e]">
            <IconAlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        <form action={formAction}>
          <input type="hidden" name="role" value={role} />

          <div className="flex flex-col gap-3">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const selected = role === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "group relative flex flex-col items-start rounded-[12px] border p-5 text-left transition-all duration-200",
                    selected
                      ? "border-brand-dark bg-brand-surface shadow-sm ring-1 ring-brand-dark"
                      : "border-[#e5e5e5] bg-white hover:border-[#cccccc]"
                  )}
                >
                  <div className="mb-3 flex w-full items-center justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-[8px] transition-colors",
                        selected 
                          ? "bg-brand-dark text-white" 
                          : "bg-[#f0f0f0] text-[#5a5a5a] group-hover:bg-[#e5e5e5]"
                      )}
                    >
                      <Icon size={20} stroke={1.5} />
                    </div>
                    
                    {/* Custom Radio Button */}
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                        selected 
                          ? "border-brand-dark bg-brand-dark" 
                          : "border-[#cccccc] bg-transparent"
                      )}
                    >
                      {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                  
                  <h3 className="text-[15px] font-medium text-[#1a1a1a]">
                    {option.label}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#5a5a5a]">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <SubmitButton role={role} />
        </form>
      </div>
    </main>
  );
}
