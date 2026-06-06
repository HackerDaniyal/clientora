"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
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
  IconLink,
  IconInbox,
  IconBell,
  IconLayoutKanban,
  IconUser,
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
    { label: "Requests", href: "/freelancer/requests", icon: IconInbox },
    { label: "Pipeline", href: "/freelancer/pipeline", icon: IconLayoutKanban },
    { label: "Referrals", href: "/freelancer/referrals", icon: IconLink },
    { label: "Clients", href: "/freelancer/clients", icon: IconUsers, hasSubmenu: true },
    { label: "Workspaces", href: "/freelancer/workspaces", icon: IconBriefcase },
    { label: "Invoices", href: "/freelancer/invoices", icon: IconFileInvoice },
    { label: "Messages", href: "/freelancer/messages", icon: IconMessageCircle },
    { label: "Notifications", href: "/freelancer/notifications", icon: IconBell },
    { label: "Settings", href: "/freelancer/settings", icon: IconSettings },
  ],
  client: [
    { label: "My Dashboard", href: "/client/dashboard", icon: IconLayoutDashboard },
    { label: "Documents", href: "/client/documents", icon: IconFileText },
    { label: "My Workspace", href: "/client/workspace", icon: IconBriefcase },
    { label: "To-Do List", href: "/client/todos", icon: IconChecklist },
    { label: "Feedback Chat", href: "/client/chat", icon: IconMessageCircle, badge: 1 },
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
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null; email: string | null } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, email")
          .eq("id", user.id)
          .single();
        setProfile({ full_name: data?.full_name, avatar_url: data?.avatar_url, email: user.email || null });
      }
    };
    fetchProfile();
  }, []);

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
      <div className="p-4 mt-auto space-y-3">
        <div className="bg-[#8BC38A22] border-[0.5px] border-brand-accent rounded-medium p-3 flex flex-col gap-2 items-center text-center">
          <IconSparkles size={18} stroke={2} className="text-brand-dark" />
          <span className="text-[11px] font-medium text-brand-dark">Need help?</span>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-ai-assistant"))}
            className="text-[10px] text-brand-dark underline opacity-70 hover:opacity-100"
          >
            Ask Gemini
          </button>
        </div>

        {/* User profile */}
        <Link
          href={`/${role}/settings`}
          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-brand-light/30 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-semibold shrink-0 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.charAt(0).toUpperCase() || <IconUser size={16} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-brand-dark truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-[10px] text-text-tertiary truncate">
              {profile?.email || ""}
            </p>
          </div>
          <IconSettings size={14} className="text-text-tertiary shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
