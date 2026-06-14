"use client";

import React, { useEffect, useState } from "react";
import { IconUsers, IconBriefcase, IconUserCheck, IconClock } from "@tabler/icons-react";
import AdminCharts from "./admin-charts";
import { createClient } from "@/lib/supabase";

export interface AdminDashboardClientProps {
  initialStats: {
    totalUsers: number;
    freelancerCount: number;
    clientCount: number;
    totalWorkspaces: number;
    activeWorkspaces: number;
    pendingRequests: number;
  };
  initialRecentUsers: any[];
  initialSignupsData: { date: string; count: number }[];
  initialRequestsData: { status: string; count: number; color: string }[];
}

export default function AdminDashboardClient({
  initialStats,
  initialRecentUsers,
  initialSignupsData,
  initialRequestsData,
}: AdminDashboardClientProps) {
  const supabase = createClient();
  const [stats, setStats] = useState(initialStats);
  const [recentUsers, setRecentUsers] = useState(initialRecentUsers);
  const [signupsData, setSignupsData] = useState(initialSignupsData);
  const [requestsData, setRequestsData] = useState(initialRequestsData);

  const [realtimeStatus, setRealtimeStatus] = useState<"CONNECTING" | "SUBSCRIBED" | "CLOSED" | "ERROR">("CONNECTING");
  const [dbStatus, setDbStatus] = useState<"Checking..." | "Connected" | "Error">("Checking...");

  // Ping DB
  useEffect(() => {
    const pingDb = async () => {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      setDbStatus(error ? "Error" : "Connected");
    };
    pingDb();
    const interval = setInterval(pingDb, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase.channel("admin-dashboard");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newUser = payload.new;
            setStats((prev) => ({
              ...prev,
              totalUsers: prev.totalUsers + 1,
              freelancerCount: newUser.role === "freelancer" ? prev.freelancerCount + 1 : prev.freelancerCount,
              clientCount: newUser.role === "client" ? prev.clientCount + 1 : prev.clientCount,
            }));

            setRecentUsers((prev) => [newUser, ...prev].slice(0, 5));

            setSignupsData((prev) => {
              const newData = [...prev];
              if (newData.length > 0) {
                newData[newData.length - 1].count += 1;
              }
              return newData;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspaces" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newWorkspace = payload.new;
            setStats((prev) => ({
              ...prev,
              totalWorkspaces: prev.totalWorkspaces + 1,
              activeWorkspaces: newWorkspace.status === "active" ? prev.activeWorkspaces + 1 : prev.activeWorkspaces,
            }));
          } else if (payload.eventType === "UPDATE") {
            const oldW = payload.old;
            const newW = payload.new;
            if (oldW.status !== newW.status) {
               setStats((prev) => {
                 let activeDelta = 0;
                 if (oldW.status === "active" && newW.status !== "active") activeDelta = -1;
                 if (oldW.status !== "active" && newW.status === "active") activeDelta = 1;
                 return { ...prev, activeWorkspaces: prev.activeWorkspaces + activeDelta };
               });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_requests" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newReq = payload.new;
            if (newReq.status === "pending") {
              setStats((prev) => ({ ...prev, pendingRequests: prev.pendingRequests + 1 }));
            }
            setRequestsData((prev) => {
              return prev.map(item => 
                item.status === newReq.status ? { ...item, count: item.count + 1 } : item
              );
            });
          } else if (payload.eventType === "UPDATE") {
            const oldReq = payload.old;
            const newReq = payload.new;
            
            if (oldReq.status !== newReq.status) {
              if (oldReq.status === "pending") setStats((prev) => ({ ...prev, pendingRequests: prev.pendingRequests - 1 }));
              if (newReq.status === "pending") setStats((prev) => ({ ...prev, pendingRequests: prev.pendingRequests + 1 }));

              setRequestsData((prev) => {
                return prev.map(item => {
                  if (item.status === oldReq.status) return { ...item, count: Math.max(0, item.count - 1) };
                  if (item.status === newReq.status) return { ...item, count: item.count + 1 };
                  return item;
                });
              });
            }
          }
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status as any);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const statsDisplay = [
    { label: "Total Users", value: stats.totalUsers, icon: IconUsers, color: "bg-blue-100 text-blue-600" },
    { label: "Freelancers", value: stats.freelancerCount, icon: IconUserCheck, color: "bg-green-100 text-green-600" },
    { label: "Clients", value: stats.clientCount, icon: IconUsers, color: "bg-purple-100 text-purple-600" },
    { label: "Active Workspaces", value: stats.activeWorkspaces, icon: IconBriefcase, color: "bg-brand-accent/20 text-brand-accent" },
    { label: "Total Workspaces", value: stats.totalWorkspaces, icon: IconBriefcase, color: "bg-gray-100 text-gray-600" },
    { label: "Pending Requests", value: stats.pendingRequests, icon: IconClock, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Platform Overview</h1>
        <p className="text-sm text-text-secondary">Real-time platform metrics and user activity.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsDisplay.map((stat) => (
          <div key={stat.label} className="card bg-white transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[11px] text-text-secondary">{stat.label}</p>
                <p className="text-xl font-semibold text-brand-dark">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AdminCharts signupsData={signupsData} requestsData={requestsData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-white">
          <h3 className="section-title">Recent Signups</h3>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3 mt-4">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-brand-light last:border-0 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-xs font-semibold">
                      {u.full_name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-brand-dark">{u.full_name || "Unknown"}</p>
                      <p className="text-[11px] text-text-tertiary">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    u.role === "freelancer" ? "badge-success" :
                    u.role === "client" ? "badge-info" :
                    "badge-neutral"
                  }`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">No users yet</p>
          )}
        </div>

        <div className="card bg-white">
          <h3 className="section-title">Platform Health</h3>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Database Status</span>
              <span className={`badge ${dbStatus === 'Connected' ? 'badge-success' : dbStatus === 'Checking...' ? 'badge-neutral' : 'badge-danger'}`}>
                {dbStatus}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Auth Service</span>
              <span className={`badge ${dbStatus === 'Connected' ? 'badge-success' : 'badge-danger'}`}>
                {dbStatus === 'Connected' ? 'Active' : 'Error'}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-brand-surface rounded-lg">
              <span className="text-[13px] text-text-secondary">Realtime</span>
              <span className={`badge ${
                realtimeStatus === 'SUBSCRIBED' ? 'badge-success' : 
                realtimeStatus === 'CONNECTING' ? 'badge-neutral' : 
                'badge-danger'
              }`}>
                {realtimeStatus === 'SUBSCRIBED' ? 'Active' : realtimeStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
