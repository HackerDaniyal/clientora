"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconAlertCircle,
  IconArrowRight,
  IconBriefcase,
  IconCircleCheck,
  IconLock,
  IconMail,
  IconSparkles,
  IconUser,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { signup } from "@/app/auth/actions";
import OAuthButtons from "@/components/auth/OAuthButtons";



const highlights = [
  "Structured client onboarding",
  "Shared workspaces with chat",
  "Documents, invoices, and tasks",
];

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error;

  return (
    <main className="min-h-screen bg-[#F6FBF8] text-brand-dark">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative hidden overflow-hidden bg-brand-dark px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-brand-green/20 blur-3xl" />

          <Link href="/" className="relative z-10 inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <span className="flex gap-[3px]">
                <span className="h-4 w-1.5 rounded-sm bg-brand-accent" />
                <span className="h-4 w-1.5 rounded-sm bg-brand-accent/60" />
              </span>
            </span>
            <span className="text-sm font-semibold tracking-wide">Clientora</span>
          </Link>

          <div className="relative z-10 max-w-[520px]">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/75 backdrop-blur">
              <IconSparkles size={14} />
              Built for focused client work
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-[-0.04em]">
              Start every project with less chasing and more clarity.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-white/65">
              Clientora turns client onboarding, project conversations, documents, and delivery into one calm workspace.
            </p>
          </div>

          <div className="relative z-10 grid gap-3">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/75">
                <IconCircleCheck size={18} className="text-brand-accent" />
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-[520px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-dark">
                  <span className="flex gap-[2px]">
                    <span className="h-3.5 w-1.5 rounded-sm bg-brand-accent" />
                    <span className="h-3.5 w-1.5 rounded-sm bg-brand-accent/60" />
                  </span>
                </span>
                <span className="text-sm font-semibold">Clientora</span>
              </Link>
              <Link href="/auth/login" className="text-sm font-medium text-brand-mid hover:text-brand-dark">
                Sign in
              </Link>
            </div>

            <div className="rounded-[28px] border border-black/[0.06] bg-white p-5 shadow-[0_24px_70px_rgba(26,61,43,0.10)] sm:p-8">
              <div className="mb-7">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-mid">
                  Create account
                </p>
                <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] text-brand-dark">
                  Tell us how you’ll use Clientora.
                </h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  Add your details to get started. You can choose your role after signing up.
                </p>
              </div>

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <IconAlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form action={signup} className="space-y-5">
                <div className="pt-2">
                  <OAuthButtons />
                </div>

                <div className="grid gap-4">
                  <div>
                    <label htmlFor="fullName" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                      Full name
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-brand-bg px-4 py-3 transition-colors focus-within:border-brand-accent focus-within:bg-white">
                      <IconUser size={18} className="text-text-tertiary" />
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        required
                        placeholder="Daniyal Alam"
                        className="w-full bg-transparent text-sm text-brand-dark outline-none placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                      Email address
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-brand-bg px-4 py-3 transition-colors focus-within:border-brand-accent focus-within:bg-white">
                      <IconMail size={18} className="text-text-tertiary" />
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@example.com"
                        className="w-full bg-transparent text-sm text-brand-dark outline-none placeholder:text-text-tertiary"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                      Password
                    </label>
                    <div className="flex items-center gap-3 rounded-2xl border border-black/[0.07] bg-brand-bg px-4 py-3 transition-colors focus-within:border-brand-accent focus-within:bg-white">
                      <IconLock size={18} className="text-text-tertiary" />
                      <input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Create a secure password"
                        className="w-full bg-transparent text-sm text-brand-dark outline-none placeholder:text-text-tertiary"
                      />
                    </div>
                    <p className="mt-2 text-xs text-text-tertiary">Use at least 6 characters.</p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-dark px-5 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(26,61,43,0.22)] transition-all hover:-translate-y-0.5 hover:bg-brand-mid hover:shadow-[0_18px_34px_rgba(26,61,43,0.24)]"
                >
                  Create account
                  <IconArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <div className="mt-6 flex flex-col gap-3 border-t border-black/[0.06] pt-5 text-center text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <span>Already have an account?</span>
                <Link href="/auth/login" className="font-semibold text-brand-mid hover:text-brand-dark">
                  Sign in instead
                </Link>
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-md text-center text-xs leading-5 text-text-tertiary">
              By creating an account, you agree to use Clientora for secure client collaboration and project management.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
