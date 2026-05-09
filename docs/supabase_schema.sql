-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('admin', 'freelancer', 'member', 'client')),
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Referral codes
create table referral_codes (
  id uuid primary key default uuid_generate_v4(),
  freelancer_id uuid references profiles(id) on delete cascade,
  code text unique not null,
  max_uses int default 100,
  use_count int default 0,
  is_active bool default true,
  created_at timestamptz default now()
);

-- Client <> Freelancer link
create table client_freelancer_links (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  referral_code_id uuid references referral_codes(id),
  status text not null check (status in ('pending', 'active', 'archived')),
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table referral_codes enable row level security;
alter table client_freelancer_links enable row level security;

-- Profiles: User can only read/update their own profile. Admin reads all.
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Triggers for Auth -> Profile
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- Projects
create table projects (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references profiles(id) on delete cascade,
  freelancer_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  budget numeric,
  currency text default 'USD',
  timeline_end timestamptz,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'active', 'completed', 'cancelled')),
  created_at timestamptz default now()
);

-- Milestones
create table milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  amount numeric,
  due_date timestamptz,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'paid')),
  created_at timestamptz default now()
);

-- RLS Policies
alter table projects enable row level security;
alter table milestones enable row level security;

create policy "Users can view projects they are part of" on projects
  for select using (auth.uid() = client_id or auth.uid() = freelancer_id);

create policy "Clients can create projects" on projects
  for insert with check (auth.uid() = client_id);

create policy "Users can view milestones of their projects" on milestones
  for select using (
    exists (
      select 1 from projects 
      where projects.id = milestones.project_id 
      and (projects.client_id = auth.uid() or projects.freelancer_id = auth.uid())
    )
  );
