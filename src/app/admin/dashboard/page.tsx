import React from "react";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">Platform Overview</h1>
        <p className="text-sm text-text-secondary">Global metrics and platform health.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "1,240", change: "+12%" },
          { label: "Active Workspaces", value: "856", change: "+5%" },
          { label: "Monthly Revenue", value: "$42.5k", change: "+18%" },
          { label: "Support Tickets", value: "24", change: "-2%" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-[11px] text-text-secondary mb-1">{stat.label}</p>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-medium text-brand-dark">{stat.value}</span>
              <span className={`text-[10px] ${stat.change.startsWith("+") ? "text-brand-accent" : "text-status-overdue"}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="section-title">New User Signups</h3>
        <div className="h-[200px] flex items-end gap-2 px-2">
          {[40, 60, 45, 90, 65, 80, 55, 70, 85, 60, 75, 95].map((h, i) => (
            <div 
              key={i} 
              className="flex-1 bg-brand-light/40 rounded-t-small hover:bg-brand-accent/60 transition-colors cursor-pointer" 
              style={{ height: `${h}%` }}
              title={`Day ${i + 1}: ${h} signups`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-text-tertiary">
          <span>1 May</span>
          <span>12 May</span>
        </div>
      </div>
    </div>
  );
}
