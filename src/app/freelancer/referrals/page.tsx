import React from "react";
import { 
  IconLink, 
  IconPlus, 
  IconUsers, 
  IconClick, 
  IconChartBar 
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";
import { generateReferralCode } from "./actions";
import CopyCodeButton from "./CopyCodeButton";

export default async function ReferralsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: codes } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('freelancer_id', user?.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalConversions = codes?.reduce((sum, c) => sum + (c.use_count || 0), 0) || 0;
  const activeCodes = codes?.filter(c => c.is_active).length || 0;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-brand-dark">Referral System</h1>
          <p className="text-sm text-text-secondary">Invite clients and track your conversion rate.</p>
        </div>
        <form action={generateReferralCode}>
          <button type="submit" className="pill-btn">
            <IconPlus size={16} stroke={2} />
            Generate New Code
          </button>
        </form>
      </header>

      {/* Stats Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconLink size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Active Codes</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{activeCodes}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconUsers size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Total Linked Clients</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{totalConversions}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconChartBar size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Conversion Rate</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">
            {totalConversions > 0 ? ((totalConversions / (activeCodes * 100)) * 100).toFixed(1) : "0"}%
          </p>
        </div>
      </section>

      {/* Code List */}
      <section className="space-y-4">
        <h3 className="section-title">Your Referral Codes</h3>
        {codes && codes.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {codes.map((code) => (
              <div key={code.id} className="card bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-brand-surface border-[0.5px] border-brand-light rounded-medium px-4 py-2 font-mono text-brand-dark text-lg font-medium">
                    {code.code}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-brand-dark">Status: {code.is_active ? "Active" : "Inactive"}</p>
                    <p className="text-[11px] text-text-tertiary">Created on {new Date(code.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[11px] text-text-tertiary uppercase tracking-wider">Usage</p>
                    <p className="text-[14px] font-medium text-brand-dark">{code.use_count} / {code.max_uses}</p>
                  </div>
                  <CopyCodeButton code={code.code} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-12 border-dashed border-2">
            <IconLink size={48} stroke={1.5} className="mx-auto text-text-tertiary mb-3 opacity-20" />
            <p className="text-text-secondary">No referral codes yet. Generate one to start inviting clients.</p>
          </div>
        )}
      </section>
    </div>
  );
}
