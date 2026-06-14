"use client";

import React from "react";
import { IconTrendingUp, IconChartPie } from "@tabler/icons-react";

interface AdminChartsProps {
  signupsData: { date: string; count: number }[];
  requestsData: { status: string; count: number; color: string }[];
}

export default function AdminCharts({ signupsData, requestsData }: AdminChartsProps) {
  // Signups Line Chart calculations
  const maxSignups = Math.max(...signupsData.map(d => d.count), 1);
  const chartHeight = 200;
  const chartWidth = 1000; // SVG viewBox width

  const points = signupsData.map((d, i) => {
    const x = (i / Math.max(signupsData.length - 1, 1)) * chartWidth;
    const y = chartHeight - (d.count / maxSignups) * chartHeight;
    return `${x},${y}`;
  });

  const pathData = points.length > 0 
    ? `M 0,${chartHeight} L 0,${chartHeight - (signupsData[0]?.count / maxSignups) * chartHeight || 0} ${points.map(p => `L ${p}`).join(' ')} L ${chartWidth},${chartHeight} Z`
    : `M 0,${chartHeight} L ${chartWidth},${chartHeight} Z`;

  const lineData = points.length > 0 ? `M ${points.map(p => p.split(',').join(' ')).join(' L ')}` : '';

  // Requests Pie Chart calculations
  const totalRequests = requestsData.reduce((sum, item) => sum + item.count, 0) || 1;
  let cumulativePercent = 0;
  const conicGradientStops = requestsData.map(item => {
    const percent = (item.count / totalRequests) * 100;
    const stop = `${item.color} ${cumulativePercent}% ${cumulativePercent + percent}%`;
    cumulativePercent += percent;
    return stop;
  }).join(', ');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      {/* Signups Chart */}
      <div className="card bg-white lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-medium text-brand-dark flex items-center gap-2">
            <IconTrendingUp size={18} className="text-brand-accent" />
            New Signups (30 Days)
          </h3>
          <span className="text-[12px] text-text-secondary">
            Total: {signupsData.reduce((sum, d) => sum + d.count, 0)}
          </span>
        </div>
        
        <div className="relative h-[200px] w-full">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] text-text-tertiary text-right pr-2 border-r border-brand-light/50">
            <span>{maxSignups}</span>
            <span>{Math.ceil(maxSignups / 2)}</span>
            <span>0</span>
          </div>
          
          <div className="absolute left-8 right-0 top-0 bottom-6">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible preserve-aspect-ratio-none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="signupGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={pathData} fill="url(#signupGradient)" />
              <path d={lineData} fill="none" stroke="var(--color-brand-accent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              
              {points.map((p, i) => (
                <circle 
                  key={i} 
                  cx={p.split(',')[0]} 
                  cy={p.split(',')[1]} 
                  r="4" 
                  fill="white" 
                  stroke="var(--color-brand-accent)" 
                  strokeWidth="2"
                  className="hover:r-6 hover:fill-brand-accent transition-all cursor-pointer group"
                >
                  <title>{`${signupsData[i].date}: ${signupsData[i].count} signups`}</title>
                </circle>
              ))}
            </svg>
          </div>
          
          {/* X-axis labels (first, middle, last) */}
          <div className="absolute left-8 right-0 bottom-0 h-6 flex justify-between text-[10px] text-text-tertiary pt-2">
            <span>{signupsData[0]?.date}</span>
            <span>{signupsData[Math.floor(signupsData.length / 2)]?.date}</span>
            <span>{signupsData[signupsData.length - 1]?.date}</span>
          </div>
        </div>
      </div>

      {/* Requests Pie Chart */}
      <div className="card bg-white lg:col-span-1">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-medium text-brand-dark flex items-center gap-2">
            <IconChartPie size={18} className="text-amber-500" />
            Project Requests
          </h3>
        </div>
        
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-40 h-40 rounded-full mb-6" style={{ background: `conic-gradient(${conicGradientStops})` }}>
            <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
              <span className="text-2xl font-bold text-brand-dark">{totalRequests === 1 && requestsData.reduce((s, d) => s + d.count, 0) === 0 ? 0 : requestsData.reduce((s, d) => s + d.count, 0)}</span>
              <span className="text-[10px] text-text-secondary uppercase tracking-wider">Total</span>
            </div>
          </div>
          
          <div className="w-full space-y-3">
            {requestsData.map(item => (
              <div key={item.status} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }}></div>
                  <span className="capitalize text-text-secondary">{item.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-brand-dark">{item.count}</span>
                  <span className="text-text-tertiary w-8 text-right">
                    {totalRequests > 0 && requestsData.reduce((s, d) => s + d.count, 0) > 0 ? Math.round((item.count / totalRequests) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
