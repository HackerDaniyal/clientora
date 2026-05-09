"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  IconLayoutDashboard, 
  IconUsers, 
  IconBriefcase, 
  IconFileInvoice, 
  IconMessageCircle, 
  IconRobot, 
  IconSettings, 
  IconChecklist, 
  IconFileText,
  IconChevronDown,
  IconSparkles,
  IconLink
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  role: "freelancer" | "client" | "admin";
};

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  hasSubmenu?: boolean;
  badge?: number;
}

const navItems: Record<"freelancer" | "client" | "admin", NavItem[]> = {
  freelancer: [
    { label: "Dashboard", href: "/freelancer/dashboard", icon: IconLayoutDashboard },
    { label: "Referrals", href: "/freelancer/referrals", icon: IconLink },
    { label: "Clients", href: "/freelancer/clients", icon: IconUsers, hasSubmenu: true },
    { label: "Workspaces", href: "/freelancer/workspaces", icon: IconBriefcase },
    { label: "Invoices", href: "/freelancer/invoices", icon: IconFileInvoice },
    { label: "Messages", href: "/freelancer/messages", icon: IconMessageCircle, badge: 3 },
    { label: "AI Assistant", href: "/freelancer/ai-assistant", icon: IconRobot },
    { label: "Settings", href: "/freelancer/settings", icon: IconSettings },
  ],
  client: [
    { label: "My Dashboard", href: "/client/dashboard", icon: IconLayoutDashboard },
    { label: "My Workspace", href: "/client/workspace", icon: IconBriefcase },
    { label: "To-Do List", href: "/client/todos", icon: IconChecklist },
    { label: "Documents", href: "/client/documents", icon: IconFileText },
    { label: "Feedback Chat", href: "/client/chat", icon: IconMessageCircle, badge: 1 },
    { label: "AI Assistant", href: "/client/ai-assistant", icon: IconRobot },
  ],
  admin: [
    { label: "Platform Overview", href: "/admin/dashboard", icon: IconLayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: IconUsers },
    { label: "All Workspaces", href: "/admin/workspaces", icon: IconBriefcase },
    { label: "Settings", href: "/admin/settings", icon: IconSettings },
  ],
};

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems[role];

  return (
    <aside className="w-[160px] h-screen bg-brand-surface border-r border-brand-light flex flex-col shrink-0">
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-2">
        <div className="w-7 h-7 bg-brand-dark rounded-small flex items-center justify-center">
          <div className="flex gap-[2px]">
            <div className="w-[5px] h-2 bg-brand-accent rounded-[1px]"></div>
            <div className="w-[5px] h-2 bg-brand-accent rounded-[1px] opacity-60"></div>
          </div>
        </div>
        <span className="text-[14px] font-medium text-brand-dark tracking-tight uppercase">
          ClientFlow
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-[10px] py-[6px] rounded-small text-[13px] transition-colors group",
                isActive 
                  ? "bg-brand-dark text-white" 
                  : "text-text-secondary hover:bg-brand-light/30"
              )}
            >
              <item.icon size={16} stroke={2} className={cn(isActive ? "text-white" : "text-text-secondary")} />
              <span className="flex-1">{item.label}</span>
              {item.hasSubmenu && (
                <IconChevronDown size={12} stroke={2} className={cn(isActive ? "text-white" : "text-text-tertiary")} />
              )}
              {item.badge && (
                <span className="bg-status-overdue text-white text-[9px] px-[5px] py-[1px] rounded-pill">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Assistant CTA at bottom */}
      <div className="p-4 mt-auto">
        <div className="bg-[#8BC38A22] border-[0.5px] border-brand-accent rounded-medium p-3 flex flex-col gap-2 items-center text-center">
          <IconSparkles size={18} stroke={2} className="text-brand-dark" />
          <span className="text-[11px] font-medium text-brand-dark">Need help?</span>
          <button className="text-[10px] text-brand-dark underline opacity-70">Ask Gemini</button>
        </div>
      </div>
    </aside>
  );
}
