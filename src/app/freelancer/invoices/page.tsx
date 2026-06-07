import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconFileInvoice, IconArrowRight, IconPlus, IconInbox } from "@tabler/icons-react";

export default async function FreelancerInvoices() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch invoices (document type = invoice)
  const { data: invoices } = await supabase
    .from("workspace_documents")
    .select(`
      *,
      workspace:workspaces(name, client_id, client:profiles!workspaces_client_id_fkey(full_name))
    `)
    .eq("type", "invoice")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium text-brand-dark">Invoices</h1>
          <p className="text-sm text-text-secondary">Manage and track all your invoices.</p>
        </div>
        <Link href="/freelancer/workspaces" className="pill-btn inline-flex items-center gap-2">
          <IconPlus size={16} />
          Create Invoice
        </Link>
      </header>

      {invoices && invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <IconFileInvoice size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-brand-dark">{invoice.title}</h3>
                    <p className="text-[12px] text-text-tertiary">
                      {invoice.document_number} · {invoice.workspace?.name} · {invoice.workspace?.client?.full_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[16px] font-semibold text-brand-dark">${invoice.amount || 0}</span>
                  <span className={`badge ${
                    invoice.status === 'draft' ? 'badge-neutral' :
                    invoice.status === 'sent' ? 'badge-info' :
                    invoice.status === 'paid' ? 'badge-success' :
                    'badge-neutral'
                  }`}>
                    {invoice.status}
                  </span>
                  <Link href={`/workspace/${invoice.workspace_id}`} className="pill-btn-outline text-[12px] px-3 py-1.5">
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 border-dashed border-2">
          <IconFileInvoice size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">No invoices yet</p>
          <p className="text-text-tertiary text-sm mt-2 mb-6">Create invoices from your workspaces.</p>
          <Link href="/freelancer/workspaces" className="pill-btn inline-flex items-center gap-2">
            Go to Workspaces
            <IconArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
