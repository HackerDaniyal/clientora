-- ==========================================
-- COMPLETE FRESH DATABASE SETUP
-- Run this AFTER running delete_all_tables.sql
-- ==========================================

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'freelancer', 'member', 'client')),
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

-- ==========================================
-- 2. REFERRAL CODES TABLE
-- ==========================================
create table referral_codes (
  id uuid primary key default uuid_generate_v4(),
  freelancer_id uuid references profiles(id) on delete cascade,
  code text unique not null,
  is_active bool default true,
  created_at timestamptz default now()
);

alter table referral_codes enable row level security;

-- ==========================================
-- 3. CLIENT-FREELANCER LINKS TABLE
-- ==========================================
create table client_freelancer_links (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  referral_code_id uuid references referral_codes(id),
  status text check (status in ('pending', 'active', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

alter table client_freelancer_links enable row level security;

-- ==========================================
-- 4. PROJECT REQUESTS TABLE
-- ==========================================
create table project_requests (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  form_data jsonb,
  submitted_at timestamptz default now(),
  responded_at timestamptz
);

alter table project_requests enable row level security;

-- ==========================================
-- 5. NOTIFICATIONS TABLE
-- ==========================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  data jsonb,
  is_read bool default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

-- ==========================================
-- 6. WORKSPACES TABLE
-- ==========================================
create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid references project_requests(id) on delete cascade,
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  name text not null,
  project_type text,
  status text check (status in ('active', 'review', 'completed', 'archived')),
  pipeline_stage text,
  form_data jsonb,
  created_at timestamptz default now()
);

alter table workspaces enable row level security;

-- ==========================================
-- 7. WORKSPACE MEMBERS TABLE
-- ==========================================
create table workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('editor', 'viewer')),
  invited_by uuid references profiles(id),
  joined_at timestamptz default now()
);

alter table workspace_members enable row level security;

-- ==========================================
-- 8. TASKS TABLE
-- ==========================================
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  title text not null,
  description text,
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  status text check (status in ('todo', 'in_progress', 'completed')) default 'todo',
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  due_date timestamptz,
  created_at timestamptz default now(),
  completed_at timestamptz
);

alter table tasks enable row level security;

-- ==========================================
-- 9. MESSAGES TABLE
-- ==========================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  sender_id uuid references profiles(id) on delete cascade,
  content text not null,
  file_url text,
  file_name text,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- ==========================================
-- 10. ACTIVITY LOG TABLE
-- ==========================================
create table activity_log (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;

-- ==========================================
-- 11. WORKSPACE DOCUMENTS TABLE
-- ==========================================
create table workspace_documents (
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

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Profiles policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Enable insert for new users" on profiles for insert with check (true);

-- Referral codes policies
create policy "Anyone can view active referral codes" on referral_codes for select using (is_active = true);
create policy "Freelancers can create referral codes" on referral_codes for insert with check (auth.uid() = freelancer_id);
create policy "Freelancers can update own referral codes" on referral_codes for update using (auth.uid() = freelancer_id);

-- Client-Freelancer links policies
create policy "Users can view their own links" on client_freelancer_links for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Clients can create links" on client_freelancer_links for insert with check (auth.uid() = client_id);

-- Project requests policies
create policy "Users can view their own project requests" on project_requests for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Clients can create project requests" on project_requests for insert with check (auth.uid() = client_id);

-- Notifications policies
create policy "Users can view their own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications for update using (auth.uid() = user_id);
create policy "System can create notifications" on notifications for insert with check (true);

-- Workspaces policies
create policy "Users can view their workspaces" on workspaces for select using (auth.uid() = client_id or auth.uid() = freelancer_id);
create policy "Freelancers can create workspaces" on workspaces for insert with check (auth.uid() = freelancer_id);
create policy "Freelancers can update their workspaces" on workspaces for update using (auth.uid() = freelancer_id);

-- Workspace members policies
create policy "Members can view workspace members" on workspace_members for select using (
  exists (
    select 1 from workspaces 
    where workspaces.id = workspace_members.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);
create policy "Freelancers can manage workspace members" on workspace_members for all using (
  exists (
    select 1 from workspaces 
    where workspaces.id = workspace_members.workspace_id 
    and workspaces.freelancer_id = auth.uid()
  )
);

-- Tasks policies
create policy "Members can view tasks" on tasks for select using (
  exists (
    select 1 from workspaces 
    where workspaces.id = tasks.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);
create policy "Editors can manage tasks" on tasks for all using (
  exists (
    select 1 from workspace_members 
    where workspace_members.workspace_id = tasks.workspace_id 
    and workspace_members.user_id = auth.uid() 
    and workspace_members.role = 'editor'
  )
);

-- Messages policies
create policy "Members can view messages" on messages for select using (
  exists (
    select 1 from workspaces 
    where workspaces.id = messages.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);
create policy "Members can send messages" on messages for insert with check (
  exists (
    select 1 from workspaces 
    where workspaces.id = messages.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);

-- Activity log policies
create policy "Members can view activity log" on activity_log for select using (
  exists (
    select 1 from workspaces 
    where workspaces.id = activity_log.workspace_id 
    and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
  )
);
create policy "System can create activity logs" on activity_log for insert with check (true);

-- Workspace documents policies
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

-- ==========================================
-- PROFILE TRIGGER (Auto-create on signup)
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'freelancer'),
    coalesce(new.raw_user_meta_data->>'full_name', 'New User')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Show all tables
select tablename from pg_tables where schemaname = 'public' order by tablename;

-- Show trigger
select trigger_name, event_object_table from information_schema.triggers where trigger_name = 'on_auth_user_created';

-- ==========================================
-- SUCCESS! Database is completely fresh and ready!
-- ==========================================
