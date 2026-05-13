"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  IconLayoutDashboard,
  IconFileText,
  IconBriefcase,
  IconChecklist,
  IconMessageCircle,
  IconBell,
  IconUser,
  IconSettings,
  IconLogout,
  IconLink,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/client/dashboard", icon: IconLayoutDashboard },
  { label: "Link Freelancer", href: "/client/link", icon: IconLink },
  { label: "Setup Project", href: "/client/setup-project", icon: IconFileText },
  { label: "Workspace", href: "/client/workspace", icon: IconBriefcase },
  { label: "Documents", href: "/client/documents", icon: IconFileText },
  { label: "To-Do", href: "/client/todos", icon: IconChecklist },
  { label: "Chat", href: "/client/chat", icon: IconMessageCircle },
];

export default function ClientTopBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <header className="w-full bg-white border-b border-brand-light sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/client/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-dark rounded-small flex items-center justify-center">
              <div className="flex gap-[2px]">
                <div className="w-[5px] h-2 bg-brand-accent rounded-[1px]"></div>
                <div className="w-[5px] h-2 bg-brand-accent rounded-[1px] opacity-60"></div>
              </div>
            </div>
            <span className="text-[14px] font-medium text-brand-dark tracking-tight uppercase">
              ClientFlow
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors",
                    isActive
                      ? "bg-brand-dark text-white"
                      : "text-text-secondary hover:bg-brand-light/30"
                  )}
                >
                  <item.icon size={15} stroke={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Notifications + Profile */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 text-text-secondary hover:bg-brand-light/30 rounded-lg transition-colors">
              <IconBell size={18} stroke={2} />
              {/* Badge placeholder - would connect to notifications table */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-status-overdue rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-brand-light/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() || <IconUser size={14} />}
                </div>
                <span className="text-[12px] font-medium text-brand-dark hidden sm:block">
                  {profile?.full_name || "Client"}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-brand-light rounded-xl shadow-lg z-50 py-1">
                    <div className="px-3 py-2 border-b border-brand-light">
                      <p className="text-[13px] font-medium text-brand-dark">
                        {profile?.full_name || "Client"}
                      </p>
                      <p className="text-[11px] text-text-tertiary">{user?.email}</p>
                    </div>
                    <Link
                      href="/client/settings"
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-brand-light/30 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <IconSettings size={14} />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-status-overdue hover:bg-brand-light/30 transition-colors"
                    >
                      <IconLogout size={14} />
                      Log Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <nav className="md:hidden flex items-center gap-1 px-2 pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-brand-dark text-white"
                  : "text-text-secondary hover:bg-brand-light/30"
              )}
            >
              <item.icon size={14} stroke={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
