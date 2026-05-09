"use client";

import React, { useState } from "react";
import { 
  IconRocket, 
  IconArrowRight, 
  IconArrowLeft, 
  IconCheck, 
  IconCalendar, 
  IconCurrencyDollar,
  IconPlus,
  IconTrash
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { createProject } from "./actions";

const STEPS = ["Basics", "Budget & Timeline", "Milestones", "Review"];

export default function SetupProjectPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    timeline_end: "",
    milestones: [{ title: "Initial Deposit", amount: "" }]
  });

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", amount: "" }]
    }));
  };

  const removeMilestone = (index: number) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setFormData(prev => ({ ...prev, milestones: newMilestones }));
  };

  return (
    <div className="max-w-[600px] mx-auto py-12 px-6">
      {/* Step Indicator */}
      <div className="flex justify-between mb-12">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-col items-center gap-2 flex-1 relative">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium transition-all z-10",
              i <= step ? "bg-brand-dark text-white" : "bg-brand-light/30 text-text-tertiary"
            )}>
              {i < step ? <IconCheck size={14} stroke={3} /> : i + 1}
            </div>
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-wider transition-colors",
              i <= step ? "text-brand-dark" : "text-text-tertiary"
            )}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "absolute top-4 left-1/2 w-full h-[1px] -z-0",
                i < step ? "bg-brand-dark" : "bg-brand-light/30"
              )} />
            )}
          </div>
        ))}
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="text-center">
          <div className="inline-flex w-12 h-12 bg-brand-light/30 rounded-medium items-center justify-center mb-4 text-brand-dark">
            <IconRocket size={24} stroke={2} />
          </div>
          <h1 className="text-2xl font-medium text-brand-dark">Kickoff Your Project</h1>
          <p className="text-sm text-text-secondary mt-1">
            Fill in the details below to start working with your freelancer.
          </p>
        </header>

        <form action={() => createProject(formData)} className="space-y-6">
          {step === 0 && (
            <div className="card space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Project Name</label>
                <input 
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Brand Identity Design"
                  className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Description</label>
                <textarea 
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Briefly describe what you need help with..."
                  rows={4}
                  className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
                  required
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="card space-y-6">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Estimated Budget</label>
                <div className="relative">
                  <IconCurrencyDollar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="number"
                    value={formData.budget}
                    onChange={(e) => updateField("budget", e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Target Completion Date</label>
                <div className="relative">
                  <IconCalendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input 
                    type="date"
                    value={formData.timeline_end}
                    onChange={(e) => updateField("timeline_end", e.target.value)}
                    className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium pl-10 pr-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="section-title">Define Milestones</h3>
              <div className="space-y-3">
                {formData.milestones.map((m, i) => (
                  <div key={i} className="card bg-white flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-medium text-text-tertiary uppercase">Milestone Title</label>
                      <input 
                        value={m.title}
                        onChange={(e) => updateMilestone(i, "title", e.target.value)}
                        placeholder="e.g. Concept Phase"
                        className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-small px-3 py-2 text-[12px] outline-none focus:border-brand-accent"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <label className="text-[9px] font-medium text-text-tertiary uppercase">Amount</label>
                      <input 
                        type="number"
                        value={m.amount}
                        onChange={(e) => updateMilestone(i, "amount", e.target.value)}
                        placeholder="$0"
                        className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-small px-3 py-2 text-[12px] outline-none focus:border-brand-accent"
                      />
                    </div>
                    {formData.milestones.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="p-2 text-status-overdue hover:bg-status-overdue/10 rounded-small mb-1"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={addMilestone}
                  className="w-full py-3 border-dashed border-[1.5px] border-brand-light rounded-medium text-[11px] font-medium text-text-secondary hover:bg-brand-surface hover:text-brand-dark transition-all flex items-center justify-center gap-2"
                >
                  <IconPlus size={14} />
                  Add Another Milestone
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card space-y-4">
              <div>
                <h4 className="text-[11px] font-medium text-text-tertiary uppercase mb-2">Project Overview</h4>
                <p className="text-lg font-medium text-brand-dark">{formData.name || "Untitled Project"}</p>
                <p className="text-[13px] text-text-secondary mt-1">{formData.description || "No description provided."}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-light">
                <div>
                  <p className="text-[11px] text-text-tertiary uppercase">Budget</p>
                  <p className="text-[15px] font-medium text-brand-dark">${formData.budget || "0"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-text-tertiary uppercase">Target Date</p>
                  <p className="text-[15px] font-medium text-brand-dark">{formData.timeline_end || "Not set"}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary uppercase mb-2">Planned Milestones</p>
                <div className="space-y-1">
                  {formData.milestones.map((m, i) => (
                    <div key={i} className="flex justify-between text-[13px] py-1 border-b border-brand-light last:border-0">
                      <span>{m.title || `Milestone ${i+1}`}</span>
                      <span className="font-medium">${m.amount || "0"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={prevStep}
              className={cn(
                "pill-btn-outline gap-2",
                step === 0 && "invisible"
              )}
            >
              <IconArrowLeft size={16} stroke={2} />
              Back
            </button>
            
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="pill-btn gap-2"
              >
                Continue
                <IconArrowRight size={16} stroke={2} />
              </button>
            ) : (
              <button
                type="submit"
                className="pill-btn bg-brand-accent hover:bg-brand-mid text-white gap-2"
              >
                Submit for Approval
                <IconCheck size={16} stroke={3} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
