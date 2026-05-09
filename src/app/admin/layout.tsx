import React from "react";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-surface">
      <Sidebar role="admin" />
      <main className="flex-1 overflow-y-auto px-[28px] py-[32px] md:px-[32px]">
        {children}
      </main>
    </div>
  );
}
