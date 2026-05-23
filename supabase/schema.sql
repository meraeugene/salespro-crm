create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'sales_manager', 'sales_representative');
create type public.lead_status as enum ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost');
create type public.deal_stage as enum ('New Lead', 'Contacted', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost');
create type public.task_status as enum ('Todo', 'In Progress', 'Done');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  avatar_url text,
  role public.app_role not null default 'sales_manager',
  manager_id uuid references public.profiles(id),
  last_login_at timestamptz,
  last_login_ip text,
  last_login_location text,
  last_login_network text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  size text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  company_id uuid references public.companies(id) on delete set null,
  email text not null,
  phone text not null,
  status public.lead_status not null default 'New',
  lead_source text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  last_contacted date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  company_id uuid references public.companies(id) on delete set null,
  email text not null,
  phone text not null,
  title text,
  avatar_url text,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  company_id uuid references public.companies(id) on delete set null,
  value numeric(12,2) not null default 0,
  probability int not null default 0 check (probability between 0 and 100),
  stage public.deal_stage not null default 'New Lead',
  assigned_to uuid references public.profiles(id) on delete set null,
  expected_close_date date not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status public.task_status not null default 'Todo',
  due_date date,
  related_type text,
  related_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  related_type text not null,
  related_id uuid not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create index companies_name_idx on public.companies (name);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_status_idx on public.leads (status);
create index deals_stage_idx on public.deals (stage);
create index deals_assigned_to_idx on public.deals (assigned_to);
create index tasks_assigned_to_status_idx on public.tasks (assigned_to, status);
create index activities_entity_idx on public.activities (entity_type, entity_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'::public.app_role
      when new.raw_user_meta_data->>'role' = 'sales_representative' then 'sales_representative'::public.app_role
      else 'sales_manager'::public.app_role
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'sales_manager');
$$;

create or replace function public.is_sales_user()
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('sales_manager', 'sales_representative')
  );
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.activities enable row level security;

create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles update own or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin());

create policy "companies read sales users" on public.companies for select to authenticated using (public.is_sales_user());
create policy "companies write sales users" on public.companies for all to authenticated using (public.is_sales_user()) with check (public.is_sales_user());

create policy "leads read by role" on public.leads for select to authenticated using (
  public.is_sales_user()
);
create policy "leads write by owner manager" on public.leads for all to authenticated using (
  public.is_sales_user()
) with check (public.is_sales_user());

create policy "contacts read by role" on public.contacts for select to authenticated using (
  public.is_sales_user()
);
create policy "contacts write by owner manager" on public.contacts for all to authenticated using (
  public.is_sales_user()
) with check (public.is_sales_user());

create policy "deals read by role" on public.deals for select to authenticated using (
  public.is_sales_user()
);
create policy "deals write by owner manager" on public.deals for all to authenticated using (
  public.is_sales_user()
) with check (public.is_sales_user());

create policy "tasks read sales users" on public.tasks for select to authenticated using (public.is_sales_user());
create policy "tasks write sales users" on public.tasks for all to authenticated using (public.is_sales_user()) with check (public.is_sales_user());

create policy "notes read sales users" on public.notes for select to authenticated using (public.is_sales_user());
create policy "notes write sales users" on public.notes for insert to authenticated with check (public.is_sales_user() and created_by = auth.uid());

create policy "activities read sales users" on public.activities for select to authenticated using (public.is_sales_user());
create policy "activities write sales users" on public.activities for insert to authenticated with check (public.is_sales_user() and created_by = auth.uid());
