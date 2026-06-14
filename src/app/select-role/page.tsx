"use client";

import React, { useState } from "react";
import { IconBriefcase, IconUser, IconArrowRight, IconAlertCircle, IconSparkles } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { updateRole } from "./actions";
import { useFormState, useFormStatus } from "react-dom";

const roleOptions = [
  {
    value: "freelancer" as const,
    label: "Freelancer",
    eyebrow: "For Service Providers",
    description: "Manage clients, send invoices, and track your projects seamlessly.",
    icon: IconBriefcase,
  },
  {
    value: "client" as const,
    label: "Client",
    eyebrow: "For Project Owners",
    description: "Submit requests, review progress, and collaborate in one place.",
    icon: IconUser,
  },
];

function SubmitButton({ role }: { role: "freelancer" | "client" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group mt-10 flex w-full items-center justify-center gap-3 rounded-full bg-brand-accent px-6 py-4 text-sm font-semibold text-brand-dark shadow-[0_0_40px_rgba(58,207,132,0.3)] transition-all duration-300 hover:scale-[1.02] hover:bg-[#4ade80] hover:shadow-[0_0_60px_rgba(58,207,132,0.4)] disabled:opacity-50 disabled:hover:scale-100"
    >
      {pending ? "Setting up workspace..." : `Continue as ${role === "freelancer" ? "Freelancer" : "Client"}`}
      {!pending && <IconArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />}
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A1A12] text-white selection:bg-brand-accent/30">
      {/* Immersive Background Gradients */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-accent/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] translate-x-1/3 translate-y-1/3 rounded-full bg-[#4ade80]/10 blur-[100px]" />

      <div className="relative z-10 w-full max-w-4xl px-6 py-12">
        
        {/* Header */}
        <div className="mb-14 flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium tracking-wide text-white/80 backdrop-blur-md">
            <IconSparkles size={16} className="text-brand-accent" />
            Almost there
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight sm:text-5xl">
            How will you use Clientora?
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/60">
            Choose your path to tailor your workspace. Don't worry, we'll configure everything automatically based on your selection.
          </p>
        </div>

        {state?.error && (
          <div className="mx-auto mb-8 flex max-w-lg items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-200 backdrop-blur-md">
            <IconAlertCircle size={20} className="shrink-0 text-red-400" />
            <span className="font-medium">{state.error}</span>
          </div>
        )}

        <form action={formAction} className="mx-auto max-w-2xl">
          <input type="hidden" name="role" value={role} />

          <div className="grid gap-6 sm:grid-cols-2">
            {roleOptions.map((option) => {
              const Icon = option.icon;
              const selected = role === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={cn(
                    "group relative flex flex-col items-start overflow-hidden rounded-3xl border p-7 text-left transition-all duration-300",
                    selected
                      ? "border-brand-accent bg-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
                  )}
                >
                  {/* Subtle hover glow for unselected cards */}
                  {!selected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  )}
                  
                  {/* Active glow for selected card */}
                  {selected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-transparent" />
                  )}

                  <div className="relative z-10 w-full">
                    <div className="mb-8 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
                          selected 
                            ? "bg-brand-accent text-brand-dark shadow-[0_0_20px_rgba(58,207,132,0.3)]" 
                            : "bg-white/10 text-white/60 group-hover:text-white"
                        )}
                      >
                        <Icon size={28} stroke={1.5} />
                      </div>
                      
                      {/* Custom Radio Circle */}
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                          selected 
                            ? "border-brand-accent bg-brand-accent" 
                            : "border-white/20 bg-transparent group-hover:border-white/40"
                        )}
                      >
                        {selected && <div className="h-2.5 w-2.5 rounded-full bg-brand-dark" />}
                      </div>
                    </div>
                    
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-accent/90">
                      {option.eyebrow}
                    </p>
                    <h3 className="mt-3 text-2xl font-medium tracking-tight text-white">
                      {option.label}
                    </h3>
                    <p className="mt-3 text-[14px] leading-relaxed text-white/50 transition-colors group-hover:text-white/70">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mx-auto max-w-[320px]">
            <SubmitButton role={role} />
          </div>
        </form>
      </div>
    </main>
  );
}
