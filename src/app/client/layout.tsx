import React from "react";
import Sidebar from "@/components/Sidebar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-surface">
      <Sidebar role="client" />
      <main className="flex-1 overflow-y-auto px-[28px] py-[32px] md:px-[32px]">
        {children}
      </main>
    </div>
  );
}
