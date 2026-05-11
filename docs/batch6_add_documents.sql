-- ==========================================
-- BATCH 6: Add Workspace Documents Table
-- Run this to add document management to existing database
-- ==========================================

-- Create workspace_documents table
create table if not exists workspace_documents (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  type text check (type in ('proposal', 'invoice', 'contract')),
  title text not null,
  content jsonb,
  pdf_url text,
  status text check (status in ('draft', 'sent', 'viewed', 'approved', 'paid')) default 'draft',
  document_number text,
  amount decimal(10,2),
  due_date timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  sent_at timestamptz,
  viewed_at timestamptz
);

alter table workspace_documents enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Members can view documents" on workspace_documents;
drop policy if exists "Freelancers can manage documents" on workspace_documents;

-- RLS Policies
create policy "Members can view documents" on workspace_documents for select using (
  exists (
    select 1 from workspaces 
    where workspaces.id = workspace_documents.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);

create policy "Freelancers can manage documents" on workspace_documents for all using (
  exists (
    select 1 from workspaces 
    where workspaces.id = workspace_documents.workspace_id 
    and workspaces.freelancer_id = auth.uid()
  )
);

-- Verify
select tablename from pg_tables where schemaname = 'public' and tablename = 'workspace_documents';

-- ==========================================
-- SUCCESS! Documents table created.
-- ==========================================
