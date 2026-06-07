"use client";

import React, { useState, useCallback } from "react";
import {
  IconRocket,
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconBuilding,
  IconPalette,
  IconCode,
  IconFileText,
  IconX,
  IconPlus,
  IconUpload,
  IconFile,
  IconTrash,
  IconPhoto,
  IconCircleCheck,
  IconLoader2
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { submitProjectRequest } from "./actions";
import { createClient } from "@/lib/supabase";

const STEPS = ["Project Basics", "Business Info", "Branding & Assets", "Technical", "Review"];

interface UploadedFile {
  name: string;
  path: string;
  url: string;
  size: number;
}

interface FormData {
  project_name: string;
  project_type: string;
  description: string;
  budget_range: string;
  timeline_start: string;
  timeline_end: string;
  business_name: string;
  industry: string;
  target_audience: string;
  competitors: string[];
  social_media: string;
  brand_colors: string[];
  brand_fonts: string;
  platforms: string[];
  technology_preferences: string;
  integrations: string;
  special_requirements: string;
}

interface FormFiles {
  logo: UploadedFile | null;
  references: UploadedFile[];
  documents: UploadedFile[];
}

export default function SetupProjectPage() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const supabase = createClient();

  const [formData, setFormData] = useState<FormData>({
    project_name: "",
    project_type: "",
    description: "",
    budget_range: "",
    timeline_start: "",
    timeline_end: "",
    business_name: "",
    industry: "",
    target_audience: "",
    competitors: [""],
    social_media: "",
    brand_colors: [],
    brand_fonts: "",
    platforms: [],
    technology_preferences: "",
    integrations: "",
    special_requirements: ""
  });

  const [files, setFiles] = useState<FormFiles>({
    logo: null,
    references: [],
    documents: []
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (): boolean => {
    switch (step) {
      case 0:
        if (!formData.project_name.trim()) {
          alert("Please enter a project name");
          return false;
        }
        if (!formData.project_type) {
          alert("Please select a project type");
          return false;
        }
        if (!formData.description.trim()) {
          alert("Please provide a project description");
          return false;
        }
        return true;
      case 1:
        if (!formData.business_name.trim()) {
          alert("Please enter your business name");
          return false;
        }
        if (!formData.industry) {
          alert("Please select an industry");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }
  };
  
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitProjectRequest(formData, files);
      setSubmitted(true);
    } catch (error: any) {
      alert(error.message || "Failed to submit project request. Please try again.");
      setIsSubmitting(false);
    }
  };

  const addCompetitor = () => {
    if (formData.competitors.length < 3) {
      updateField("competitors", [...formData.competitors, ""]);
    }
  };

  const updateCompetitor = (index: number, value: string) => {
    const newCompetitors = [...formData.competitors];
    newCompetitors[index] = value;
    updateField("competitors", newCompetitors);
  };

  const removeCompetitor = (index: number) => {
    updateField("competitors", formData.competitors.filter((_, i) => i !== index));
  };

  const togglePlatform = (platform: string) => {
    const platforms = formData.platforms.includes(platform)
      ? formData.platforms.filter(p => p !== platform)
      : [...formData.platforms, platform];
    updateField("platforms", platforms);
  };

  const addBrandColor = (color: string) => {
    if (formData.brand_colors.length < 5 && !formData.brand_colors.includes(color)) {
      updateField("brand_colors", [...formData.brand_colors, color]);
    }
  };

  const removeBrandColor = (index: number) => {
    updateField("brand_colors", formData.brand_colors.filter((_, i) => i !== index));
  };

  // File upload handler
  const uploadFile = useCallback(async (file: File, folder: string): Promise<UploadedFile | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("You must be logged in to upload files");
      return null;
    }

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${user.id}/${folder}/${fileName}`;

    setUploading(file.name);

    const { error: uploadError } = await supabase.storage
      .from('project-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    setUploading(null);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      alert(`Failed to upload ${file.name}: ${uploadError.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('project-assets')
      .getPublicUrl(filePath);

    return {
      name: file.name,
      path: filePath,
      url: publicUrl,
      size: file.size
    };
  }, [supabase]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Logo must be under 10MB");
      return;
    }

    const uploaded = await uploadFile(file, 'logos');
    if (uploaded) {
      setFiles(prev => ({ ...prev, logo: uploaded }));
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = 20 - files.references.length;
    const toUpload = selectedFiles.slice(0, remainingSlots);

    const totalSize = files.references.reduce((s, f) => s + f.size, 0) + toUpload.reduce((s, f) => s + f.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      alert("Total reference images must be under 50MB");
      return;
    }

    for (const file of toUpload) {
      const uploaded = await uploadFile(file, 'references');
      if (uploaded) {
        setFiles(prev => ({ ...prev, references: [...prev.references, uploaded] }));
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const remainingSlots = 10 - files.documents.length;
    const toUpload = selectedFiles.slice(0, remainingSlots);

    for (const file of toUpload) {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 10MB per document.`);
        continue;
      }
      const uploaded = await uploadFile(file, 'documents');
      if (uploaded) {
        setFiles(prev => ({ ...prev, documents: [...prev.documents, uploaded] }));
      }
    }
  };

  const removeFile = (type: 'logo' | 'references' | 'documents', index?: number) => {
    if (type === 'logo') {
      setFiles(prev => ({ ...prev, logo: null }));
    } else if (index !== undefined) {
      setFiles(prev => ({
        ...prev,
        [type]: prev[type].filter((_, i) => i !== index)
      }));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Confirmation screen after successful submit
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] space-y-8 text-center">
          <div className="inline-flex w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-2">
            <IconCircleCheck size={40} stroke={2} className="text-green-600" />
          </div>

          <div>
            <h1 className="text-2xl font-medium text-brand-dark">Request Submitted!</h1>
            <p className="text-sm text-text-secondary mt-2">
              Your project <span className="font-medium text-brand-dark">{formData.project_name}</span> has been sent to your freelancer for review.
            </p>
          </div>

          <div className="card bg-white space-y-4 text-left">
            <h3 className="text-[13px] font-medium text-brand-dark border-b border-brand-light pb-3">Submission Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[12px] text-text-secondary">Project Type</span>
                <span className="text-[12px] font-medium text-brand-dark">{formData.project_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-text-secondary">Budget</span>
                <span className="text-[12px] font-medium text-brand-dark">{formData.budget_range || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[12px] text-text-secondary">Timeline</span>
                <span className="text-[12px] font-medium text-brand-dark">
                  {formData.timeline_start ? new Date(formData.timeline_start).toLocaleDateString() : "TBD"}
                  {" → "}
                  {formData.timeline_end ? new Date(formData.timeline_end).toLocaleDateString() : "TBD"}
                </span>
              </div>
              {(files.logo || files.references.length > 0 || files.documents.length > 0) && (
                <div className="flex justify-between">
                  <span className="text-[12px] text-text-secondary">Assets Uploaded</span>
                  <span className="text-[12px] font-medium text-brand-dark">
                    {(files.logo ? 1 : 0) + files.references.length + files.documents.length} file(s)
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-[12px] text-blue-700">
                You will receive a notification once your freelancer reviews the request. You can track the status from your dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/client/dashboard"
              className="w-full pill-btn py-3 justify-center"
            >
              Go to Dashboard
              <IconArrowRight size={16} />
            </a>
            <a
              href="/client/workspace"
              className="w-full pill-btn-outline py-3 justify-center"
            >
              View Workspace
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto py-12 px-6">
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
              "text-[9px] font-medium uppercase tracking-wider transition-colors text-center",
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
            {step === 0 && <IconRocket size={24} stroke={2} />}
            {step === 1 && <IconBuilding size={24} stroke={2} />}
            {step === 2 && <IconPalette size={24} stroke={2} />}
            {step === 3 && <IconCode size={24} stroke={2} />}
            {step === 4 && <IconFileText size={24} stroke={2} />}
          </div>
          <h1 className="text-2xl font-medium text-brand-dark">Kickoff Your Project</h1>
          <p className="text-sm text-text-secondary mt-1">
            Step {step + 1} of {STEPS.length}
          </p>
        </header>

        {/* Step 1: Project Basics */}
        {step === 0 && (
          <div className="card space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Project Name *</label>
              <input 
                value={formData.project_name}
                onChange={(e) => updateField("project_name", e.target.value)}
                placeholder="e.g. Brand Identity Design"
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Project Type *</label>
              <select 
                value={formData.project_type}
                onChange={(e) => updateField("project_type", e.target.value)}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              >
                <option value="">Select a type...</option>
                <option value="Website">Website</option>
                <option value="Mobile App">Mobile App</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Branding">Branding</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Brief Description *</label>
              <textarea 
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your project requirements..."
                rows={4}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Budget Range</label>
              <select 
                value={formData.budget_range}
                onChange={(e) => updateField("budget_range", e.target.value)}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              >
                <option value="">Select budget range...</option>
                <option value="< $1,000">Less than $1,000</option>
                <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                <option value="$10,000 - $25,000">$10,000 - $25,000</option>
                <option value="$25,000+">$25,000+</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Start Date</label>
                <input 
                  type="date"
                  value={formData.timeline_start}
                  onChange={(e) => updateField("timeline_start", e.target.value)}
                  className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">End Date</label>
                <input 
                  type="date"
                  value={formData.timeline_end}
                  onChange={(e) => updateField("timeline_end", e.target.value)}
                  className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {step === 1 && (
          <div className="card space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Business Name *</label>
              <input 
                value={formData.business_name}
                onChange={(e) => updateField("business_name", e.target.value)}
                placeholder="Your company name"
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Industry *</label>
              <select 
                value={formData.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              >
                <option value="">Select industry...</option>
                <option value="Technology">Technology</option>
                <option value="E-commerce">E-commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Finance">Finance</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Target Audience</label>
              <textarea 
                value={formData.target_audience}
                onChange={(e) => updateField("target_audience", e.target.value)}
                placeholder="Describe your target customers..."
                rows={3}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Competitor References (up to 3 URLs)</label>
              {formData.competitors.map((competitor, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    value={competitor}
                    onChange={(e) => updateCompetitor(i, e.target.value)}
                    placeholder="https://competitor-website.com"
                    className="flex-1 bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
                  />
                  {formData.competitors.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeCompetitor(i)}
                      className="p-2 text-status-overdue hover:bg-status-overdue/10 rounded-medium"
                    >
                      <IconX size={18} />
                    </button>
                  )}
                </div>
              ))}
              {formData.competitors.length < 3 && (
                <button 
                  type="button"
                  onClick={addCompetitor}
                  className="flex items-center gap-2 text-[12px] text-brand-dark font-medium"
                >
                  <IconPlus size={16} />
                  Add Competitor
                </button>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Social Media Links</label>
              <textarea 
                value={formData.social_media}
                onChange={(e) => updateField("social_media", e.target.value)}
                placeholder="Enter your social media URLs (one per line)..."
                rows={3}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Branding & Assets */}
        {step === 2 && (
          <div className="card space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Logo Upload (PNG/SVG, max 10MB)
              </label>
              {files.logo ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-medium">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <IconPhoto size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-brand-dark truncate">{files.logo.name}</p>
                    <p className="text-[11px] text-text-tertiary">{formatFileSize(files.logo.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile('logo')}
                    className="p-2 text-status-overdue hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-brand-light rounded-medium bg-brand-surface cursor-pointer hover:border-brand-accent transition-colors">
                  <IconUpload size={24} className="text-text-tertiary" />
                  <span className="text-[13px] text-text-secondary font-medium">Click to upload logo</span>
                  <span className="text-[11px] text-text-tertiary">PNG or SVG up to 10MB</span>
                  <input
                    type="file"
                    accept=".png,.svg,.jpg,.jpeg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={!!uploading}
                  />
                </label>
              )}
              {uploading && (
                <div className="flex items-center gap-2 text-[12px] text-brand-accent">
                  <IconLoader2 size={14} className="animate-spin" />
                  Uploading {uploading}...
                </div>
              )}
            </div>

            {/* Brand Colors */}
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Brand Color Palette (up to 5)</label>
              <div className="flex gap-2 flex-wrap">
                {formData.brand_colors.map((color, i) => (
                  <div key={i} className="relative group">
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-brand-light"
                      style={{ backgroundColor: color }}
                    />
                    <button
                      type="button"
                      onClick={() => removeBrandColor(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-status-overdue text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {formData.brand_colors.length < 5 && (
                  <input
                    type="color"
                    onChange={(e) => addBrandColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-brand-light cursor-pointer"
                  />
                )}
              </div>
            </div>

            {/* Brand Fonts */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Brand Fonts</label>
              <input
                value={formData.brand_fonts}
                onChange={(e) => updateField("brand_fonts", e.target.value)}
                placeholder="e.g. Inter, Roboto, Open Sans"
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            {/* Reference Images */}
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Reference Images / Mood Board (max 20 files, 50MB total)
              </label>
              {files.references.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {files.references.map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded-lg border border-brand-light"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile('references', i)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconX size={12} />
                      </button>
                      <p className="text-[10px] text-text-tertiary truncate mt-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
              {files.references.length < 20 && (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-brand-light rounded-medium bg-brand-surface cursor-pointer hover:border-brand-accent transition-colors">
                  <IconPhoto size={20} className="text-text-tertiary" />
                  <span className="text-[12px] text-text-secondary font-medium">Add reference images</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleReferenceUpload}
                    className="hidden"
                    disabled={!!uploading}
                  />
                </label>
              )}
            </div>

            {/* Additional Documents */}
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                Additional Documents (PDF, DOCX, max 10MB each)
              </label>
              {files.documents.length > 0 && (
                <div className="space-y-2">
                  {files.documents.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-brand-surface border border-brand-light rounded-medium">
                      <IconFile size={18} className="text-brand-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-brand-dark truncate">{file.name}</p>
                        <p className="text-[11px] text-text-tertiary">{formatFileSize(file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile('documents', i)}
                        className="p-2 text-status-overdue hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {files.documents.length < 10 && (
                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-brand-light rounded-medium bg-brand-surface cursor-pointer hover:border-brand-accent transition-colors">
                  <IconFileText size={20} className="text-text-tertiary" />
                  <span className="text-[12px] text-text-secondary font-medium">Upload documents</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={handleDocumentUpload}
                    className="hidden"
                    disabled={!!uploading}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Technical Requirements */}
        {step === 3 && (
          <div className="card space-y-4">
            <div className="space-y-3">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Platform Preferences</label>
              <div className="grid grid-cols-3 gap-3">
                {["Web", "iOS", "Android"].map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      "p-3 rounded-medium border-2 transition-all text-[13px] font-medium",
                      formData.platforms.includes(platform)
                        ? "border-brand-dark bg-brand-dark text-white"
                        : "border-brand-light bg-brand-surface text-text-secondary hover:border-brand-accent"
                    )}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Technology Preferences (Optional)</label>
              <textarea 
                value={formData.technology_preferences}
                onChange={(e) => updateField("technology_preferences", e.target.value)}
                placeholder="Any specific technologies or frameworks..."
                rows={2}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Existing Tools/Integrations</label>
              <textarea 
                value={formData.integrations}
                onChange={(e) => updateField("integrations", e.target.value)}
                placeholder="e.g., Stripe, Mailchimp, Google Analytics..."
                rows={2}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Special Requirements</label>
              <textarea 
                value={formData.special_requirements}
                onChange={(e) => updateField("special_requirements", e.target.value)}
                placeholder="Any additional requirements or notes..."
                rows={3}
                className="w-full bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2.5 text-[13px] outline-none focus:border-brand-accent transition-colors resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 4 && (
          <div className="card space-y-6">
            <div>
              <h4 className="text-[11px] font-medium text-text-tertiary uppercase mb-2">Project Overview</h4>
              <p className="text-lg font-medium text-brand-dark">{formData.project_name || "Untitled"}</p>
              <p className="text-[13px] text-text-secondary mt-1">{formData.description || "No description"}</p>
              <div className="flex gap-4 mt-2">
                <span className="badge badge-accent">{formData.project_type}</span>
                <span className="badge badge-neutral">{formData.budget_range || "Budget not set"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-brand-light">
              <div>
                <p className="text-[11px] text-text-tertiary uppercase">Business</p>
                <p className="text-[14px] font-medium text-brand-dark">{formData.business_name}</p>
                <p className="text-[12px] text-text-secondary">{formData.industry}</p>
              </div>
              <div>
                <p className="text-[11px] text-text-tertiary uppercase">Timeline</p>
                <p className="text-[12px] text-brand-dark">{formData.timeline_start || "Not set"} → {formData.timeline_end || "Not set"}</p>
              </div>
            </div>

            {/* Uploaded Files Review */}
            {(files.logo || files.references.length > 0 || files.documents.length > 0) && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium text-text-tertiary uppercase">Uploaded Assets</p>
                {files.logo && (
                  <div className="flex items-center gap-2">
                    <IconPhoto size={14} className="text-green-600" />
                    <span className="text-[12px] text-brand-dark">Logo: {files.logo.name}</span>
                  </div>
                )}
                {files.references.length > 0 && (
                  <div className="flex items-center gap-2">
                    <IconPhoto size={14} className="text-brand-accent" />
                    <span className="text-[12px] text-brand-dark">{files.references.length} reference image(s)</span>
                  </div>
                )}
                {files.documents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <IconFile size={14} className="text-blue-500" />
                    <span className="text-[12px] text-brand-dark">{files.documents.length} document(s)</span>
                  </div>
                )}
              </div>
            )}

            {formData.platforms.length > 0 && (
              <div>
                <p className="text-[11px] text-text-tertiary uppercase mb-2">Platforms</p>
                <div className="flex gap-2">
                  {formData.platforms.map(p => (
                    <span key={p} className="badge badge-dark">{p}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-brand-light/20 rounded-medium">
              <input type="checkbox" id="confirm" className="mt-1 w-4 h-4" />
              <label htmlFor="confirm" className="text-[12px] text-text-secondary">
                I confirm all information is accurate and agree to submit this project request to my freelancer for review.
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
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
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="pill-btn bg-brand-accent hover:bg-brand-mid text-white gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
              {!isSubmitting && <IconCheck size={16} stroke={3} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
