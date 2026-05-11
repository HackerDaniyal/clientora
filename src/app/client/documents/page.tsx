import React from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconFileText, IconEye, IconArrowRight, IconInbox } from "@tabler/icons-react";

export default async function ClientDocuments() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Fetch client's workspaces
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("client_id", user.id);

  if (!workspaces || workspaces.length === 0) {
    redirect("/client/dashboard");
  }

  // Fetch documents from all workspaces
  const workspaceIds = workspaces.map(w => w.id);
  
  const { data: documents } = await supabase
    .from("workspace_documents")
    .select(`
      *,
      workspace:workspaces(name)
    `)
    .in("workspace_id", workspaceIds)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-medium text-brand-dark">My Documents</h1>
        <p className="text-sm text-text-secondary">View proposals, invoices, and contracts from your freelancer.</p>
      </header>

      {documents && documents.length > 0 ? (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    doc.type === 'proposal' ? 'bg-blue-100' :
                    doc.type === 'invoice' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <IconFileText size={24} className={
                      doc.type === 'proposal' ? 'text-blue-600' :
                      doc.type === 'invoice' ? 'text-green-600' :
                      'text-purple-600'
                    } />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium text-brand-dark">{doc.title}</h3>
                    <p className="text-[12px] text-text-tertiary">
                      {doc.workspace?.name} · {doc.document_number} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.amount && (
                    <span className="text-[16px] font-semibold text-brand-dark">${doc.amount}</span>
                  )}
                  <span className={`badge text-[11px] ${
                    doc.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    doc.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                    doc.status === 'viewed' ? 'bg-purple-100 text-purple-700' :
                    doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                    doc.status === 'paid' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {doc.status}
                  </span>
                  <button className="pill-btn-outline text-[12px] px-3 py-1.5">
                    <IconEye size={16} />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16 border-dashed border-2">
          <IconInbox size={64} stroke={1.5} className="mx-auto text-text-tertiary mb-4 opacity-20" />
          <p className="text-text-secondary text-lg">No documents yet</p>
          <p className="text-text-tertiary text-sm mt-2">When your freelancer sends documents, they'll appear here.</p>
        </div>
      )}
    </div>
  );
}
