import React from "react";
import ClientTopBar from "@/components/ClientTopBar";
import AIAssistant from "@/components/AIAssistant";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-surface flex flex-col">
      <ClientTopBar />
      <main className="flex-1 overflow-y-auto px-[28px] py-[32px] md:px-[32px]">
        {children}
      </main>
      <AIAssistant userRole="client" />
    </div>
  );
}
