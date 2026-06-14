"use client";

import React, { useState } from "react";
import ProfileSettingsForm from "@/components/ProfileSettingsForm";
import { IconUser, IconSettings, IconFileText, IconMail, IconToggleRight, IconDeviceFloppy } from "@tabler/icons-react";
import { updatePlatformSettings } from "./actions";
import { useToast } from "@/components/ToastProvider";

export default function SettingsClient({ profileData, initialSettings }: { profileData: any, initialSettings: any }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleToggleFeature = async (key: string, value: boolean) => {
    try {
      await updatePlatformSettings("features", key, value);
      setSettings({
        ...settings,
        features: { ...settings.features, [key]: value }
      });
      showToast("Feature toggled successfully", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to toggle feature", "error");
    }
  };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePlatformSettings("email", "sender_name", settings.email.sender_name);
      await updatePlatformSettings("email", "sender_email", settings.email.sender_email);
      await updatePlatformSettings("email", "smtp_enabled", settings.email.smtp_enabled);
      showToast("Email settings saved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save email settings", "error");
    }
    setLoading(false);
  };

  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updatePlatformSettings("templates", "proposal", settings.templates.proposal);
      await updatePlatformSettings("templates", "invoice", settings.templates.invoice);
      await updatePlatformSettings("templates", "contract", settings.templates.contract);
      showToast("Templates saved", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save templates", "error");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex overflow-x-auto gap-2 mb-6 border-b border-brand-light pb-1 scrollbar-hide">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "profile" 
              ? "bg-brand-dark text-white" 
              : "text-text-secondary hover:bg-brand-surface"
          }`}
        >
          <IconUser size={16} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("platform")}
          className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "platform" 
              ? "bg-brand-dark text-white" 
              : "text-text-secondary hover:bg-brand-surface"
          }`}
        >
          <IconSettings size={16} />
          Platform
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === "templates" 
              ? "bg-brand-dark text-white" 
              : "text-text-secondary hover:bg-brand-surface"
          }`}
        >
          <IconFileText size={16} />
          Templates
        </button>
      </div>

      <div>
        {activeTab === "profile" && (
          <ProfileSettingsForm profile={profileData} />
        )}

        {activeTab === "platform" && (
          <div className="space-y-6">
            <div className="card bg-white">
              <h3 className="section-title flex items-center gap-2">
                <IconToggleRight size={16} /> Feature Flags
              </h3>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-lg">
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">AI Assistant</p>
                    <p className="text-[11px] text-text-tertiary">Enable Gemini-powered AI features across workspaces.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.features?.ai_assistant ?? true}
                      onChange={(e) => handleToggleFeature("ai_assistant", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-lg">
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">Referral System</p>
                    <p className="text-[11px] text-text-tertiary">Allow freelancers to generate and share referral links.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.features?.referral_system ?? true}
                      onChange={(e) => handleToggleFeature("referral_system", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-lg">
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">Client Self-Registration</p>
                    <p className="text-[11px] text-text-tertiary">Allow clients to sign up without an invite link.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.features?.client_registration ?? true}
                      onChange={(e) => handleToggleFeature("client_registration", e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
                  </label>
                </div>
              </div>
            </div>

            <form className="card bg-white" onSubmit={handleSaveEmail}>
              <h3 className="section-title flex items-center gap-2">
                <IconMail size={16} /> Email Configuration
              </h3>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary uppercase mb-1">Sender Name</label>
                    <input 
                      type="text" 
                      value={settings.email?.sender_name || ""}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, sender_name: e.target.value } })}
                      className="w-full border border-brand-light rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-text-secondary uppercase mb-1">Sender Email</label>
                    <input 
                      type="email" 
                      value={settings.email?.sender_email || ""}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, sender_email: e.target.value } })}
                      className="w-full border border-brand-light rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-brand-surface rounded-lg">
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">Enable SMTP Delivery</p>
                    <p className="text-[11px] text-text-tertiary">If disabled, system will use simulated local delivery.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.email?.smtp_enabled ?? false}
                      onChange={(e) => setSettings({ ...settings, email: { ...settings.email, smtp_enabled: e.target.checked } })}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-accent"></div>
                  </label>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={loading} className="pill-btn">
                    <IconDeviceFloppy size={16} />
                    {loading ? "Saving..." : "Save Email Settings"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeTab === "templates" && (
          <form className="card bg-white" onSubmit={handleSaveTemplates}>
            <h3 className="section-title flex items-center gap-2">
              <IconFileText size={16} /> Default Templates
            </h3>
            <p className="text-[12px] text-text-secondary mb-4">
              These templates will be used as the default starting point when generating new documents in workspaces.
            </p>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[13px] font-medium text-brand-dark mb-1">Proposal Template</label>
                <textarea 
                  rows={4}
                  value={settings.templates?.proposal || ""}
                  onChange={(e) => setSettings({ ...settings, templates: { ...settings.templates, proposal: e.target.value } })}
                  className="w-full border border-brand-light rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-accent transition-colors font-mono resize-y"
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-medium text-brand-dark mb-1">Invoice Template Notes</label>
                <textarea 
                  rows={3}
                  value={settings.templates?.invoice || ""}
                  onChange={(e) => setSettings({ ...settings, templates: { ...settings.templates, invoice: e.target.value } })}
                  className="w-full border border-brand-light rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-accent transition-colors font-mono resize-y"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-brand-dark mb-1">Standard Contract Clauses</label>
                <textarea 
                  rows={6}
                  value={settings.templates?.contract || ""}
                  onChange={(e) => setSettings({ ...settings, templates: { ...settings.templates, contract: e.target.value } })}
                  className="w-full border border-brand-light rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-accent transition-colors font-mono resize-y"
                />
              </div>
              
              <div className="pt-2 border-t border-brand-light">
                <button type="submit" disabled={loading} className="pill-btn mt-4">
                  <IconDeviceFloppy size={16} />
                  {loading ? "Saving..." : "Save Templates"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
