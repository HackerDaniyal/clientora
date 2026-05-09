import React from "react";
import { IconPlus, IconUsers, IconHourglass } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/server";

export default async function FreelancerDashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch linked clients
  const { data: linkedClients, error } = await supabase
    .from('client_freelancer_links')
    .select(`
      *,
      client:profiles!client_freelancer_links_client_id_fkey(full_name, avatar_url),
      referral_code:referral_codes(code)
    `)
    .eq('freelancer_id', user?.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const totalClients = linkedClients?.length || 0;

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium text-brand-dark">Freelancer Dashboard</h1>
          <p className="text-sm text-text-secondary">Welcome back, here's what's happening today.</p>
        </div>
        <a href="/freelancer/referrals" className="pill-btn">
          <IconPlus size={16} stroke={2} />
          Generate Referral Code
        </a>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconUsers size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Total Clients</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">{totalClients}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconHourglass size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Pending Requests</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">0</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-brand-light/30 rounded-badge flex items-center justify-center text-brand-dark">
              <IconUsers size={18} stroke={2} />
            </div>
            <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Active Projects</span>
          </div>
          <p className="text-2xl font-medium text-brand-dark">0</p>
        </div>
      </section>

      {totalClients > 0 && (
        <section className="card">
          <h3 className="section-title">Your Clients</h3>
          <div className="space-y-3 mt-4">
            {linkedClients?.map((link) => (
              <div key={link.id} className="flex items-center gap-4 py-3 border-b border-brand-light last:border-0">
                <div className="w-10 h-10 rounded-full bg-brand-light/30 flex items-center justify-center text-brand-dark font-medium">
                  {link.client?.full_name?.charAt(0) || 'C'}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-brand-dark">{link.client?.full_name || 'Unknown Client'}</p>
                  <p className="text-[11px] text-text-tertiary">Linked on {new Date(link.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="badge bg-brand-accent/20 text-brand-accent text-[9px]">Active</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {totalClients === 0 && (
        <section className="card text-center py-12 border-dashed border-2">
          <IconUsers size={48} stroke={1.5} className="mx-auto text-text-tertiary mb-3 opacity-20" />
          <p className="text-text-secondary mb-2">No clients yet. Share your referral code to get started!</p>
          <a href="/freelancer/referrals" className="text-brand-dark underline text-[13px] font-medium">
            Go to Referrals →
          </a>
        </section>
      )}
    </div>
  );
}
