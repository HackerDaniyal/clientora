import React from "react";
import Sidebar from "@/components/Sidebar";
import AIAssistant from "@/components/AIAssistantLazy";
import DeadlineReminderChecker from "@/components/DeadlineReminderChecker";
import { requireRole } from "@/lib/auth/require-role";

export default async function FreelancerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("freelancer");

  return (
    <div className="flex min-h-screen bg-brand-surface">
      <Sidebar role="freelancer" />
      <main className="flex-1 overflow-y-auto px-[28px] py-[32px] md:px-[32px]">
        {children}
      </main>
      <AIAssistant userRole="freelancer" />
      <DeadlineReminderChecker />
    </div>
  );
}

