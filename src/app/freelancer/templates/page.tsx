import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IconFileText, IconPlus, IconTrash } from "@tabler/icons-react";
import TemplateLibraryClient from "./template-library-client";

export default async function TemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: templates } = await supabase
    .from("document_templates")
    .select("*")
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-brand-dark">Template Library</h1>
          <p className="text-sm text-text-secondary">Save and reuse your proposal, invoice, and contract templates.</p>
        </div>
      </header>
      <TemplateLibraryClient initialTemplates={templates || []} freelancerId={user.id} />
    </div>
  );
}
