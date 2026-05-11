-- ==========================================
-- ClientFlow CRM - Complete Database Setup
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create profiles table
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'freelancer', 'member', 'client')),
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- 3. Create referral_codes table
create table if not exists referral_codes (
  id uuid primary key default uuid_generate_v4(),
  freelancer_id uuid references profiles(id) on delete cascade,
  code text unique not null,
  max_uses int default 100,
  use_count int default 0,
  is_active bool default true,
  created_at timestamptz default now()
);

-- 4. Create client_freelancer_links table
create table if not exists client_freelancer_links (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  referral_code_id uuid references referral_codes(id),
  status text not null check (status in ('pending', 'active', 'archived')),
  created_at timestamptz default now()
);

-- 5. Create project_requests table
create table if not exists project_requests (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected', 'info_needed')),
  form_data jsonb,
  submitted_at timestamptz default now(),
  responded_at timestamptz
);

-- 6. Create notifications table
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  data jsonb,
  is_read bool default false,
  created_at timestamptz default now()
);

-- 7. Create workspaces table
create table if not exists workspaces (
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

-- 8. Create workspace_members table
create table if not exists workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text check (role in ('editor', 'viewer')),
  invited_by uuid references profiles(id),
  joined_at timestamptz default now()
);

-- ==========================================
-- Enable Row Level Security (RLS)
-- ==========================================

alter table profiles enable row level security;
alter table referral_codes enable row level security;
alter table client_freelancer_links enable row level security;
alter table project_requests enable row level security;
alter table notifications enable row level security;
alter table workspaces enable row level security;
alter table workspace_members enable row level security;

-- ==========================================
-- Drop existing policies (if they exist)
-- ==========================================

-- Drop profiles policies
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Admins can view all profiles" on profiles;

-- Drop referral_codes policies
drop policy if exists "Anyone can view active referral codes" on referral_codes;
drop policy if exists "Freelancers can create their own referral codes" on referral_codes;
drop policy if exists "Freelancers can update their own referral codes" on referral_codes;

-- Drop client_freelancer_links policies
drop policy if exists "Users can view their own links" on client_freelancer_links;
drop policy if exists "Clients can create links" on client_freelancer_links;

-- Drop project_requests policies
drop policy if exists "Users can view their own project requests" on project_requests;
drop policy if exists "Clients can create project requests" on project_requests;

-- Drop notifications policies
drop policy if exists "Users can view their own notifications" on notifications;
drop policy if exists "Users can update their own notifications" on notifications;
drop policy if exists "System can create notifications" on notifications;

-- Drop workspaces policies
drop policy if exists "Users can view their workspaces" on workspaces;
drop policy if exists "Freelancers can create workspaces" on workspaces;

-- Drop workspace_members policies
drop policy if exists "Members can view workspace members" on workspace_members;
drop policy if exists "Freelancers can manage workspace members" on workspace_members;

-- ==========================================
-- RLS Policies for profiles
-- ==========================================

create policy "Users can view their own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update their own profile" 
  on profiles for update 
  using (auth.uid() = id);

create policy "Admins can view all profiles" 
  on profiles for select 
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- ==========================================
-- RLS Policies for referral_codes
-- ==========================================

create policy "Anyone can view active referral codes" 
  on referral_codes for select 
  using (is_active = true);

create policy "Freelancers can create their own referral codes" 
  on referral_codes for insert 
  with check (auth.uid() = freelancer_id);

create policy "Freelancers can update their own referral codes" 
  on referral_codes for update 
  using (auth.uid() = freelancer_id);

-- ==========================================
-- RLS Policies for client_freelancer_links
-- ==========================================

create policy "Users can view their own links" 
  on client_freelancer_links for select 
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Clients can create links" 
  on client_freelancer_links for insert 
  with check (auth.uid() = client_id);

-- ==========================================
-- RLS Policies for project_requests
-- ==========================================

create policy "Users can view their own project requests" 
  on project_requests for select 
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Clients can create project requests" 
  on project_requests for insert 
  with check (auth.uid() = client_id);

-- ==========================================
-- RLS Policies for notifications
-- ==========================================

create policy "Users can view their own notifications" 
  on notifications for select 
  using (auth.uid() = user_id);

create policy "Users can update their own notifications" 
  on notifications for update 
  using (auth.uid() = user_id);

create policy "System can create notifications" 
  on notifications for insert 
  with check (true);

-- ==========================================
-- RLS Policies for workspaces
-- ==========================================

create policy "Users can view their workspaces" 
  on workspaces for select 
  using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Freelancers can create workspaces" 
  on workspaces for insert 
  with check (auth.uid() = freelancer_id);

create policy "Freelancers can update their workspaces" 
  on workspaces for update 
  using (auth.uid() = freelancer_id);

-- ==========================================
-- RLS Policies for workspace_members
-- ==========================================

create policy "Members can view workspace members" 
  on workspace_members for select 
  using (
    exists (
      select 1 from workspaces 
      where workspaces.id = workspace_members.workspace_id 
      and (workspaces.client_id = auth.uid() or workspaces.freelancer_id = auth.uid())
    )
  );

create policy "Freelancers can manage workspace members" 
  on workspace_members for all 
  using (
    exists (
      select 1 from workspaces 
      where workspaces.id = workspace_members.workspace_id 
      and workspaces.freelancer_id = auth.uid()
    )
  );

-- ==========================================
-- Trigger to create profile on user signup
-- ==========================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    coalesce(new.raw_user_meta_data->>'role', 'freelancer'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row 
  execute procedure public.handle_new_user();

-- ==========================================
-- Setup Complete!
-- ==========================================
