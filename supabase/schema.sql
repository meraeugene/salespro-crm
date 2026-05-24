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
  manager_id uuid references public.profiles(id) on delete set null,
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
  domain text not null,
  industry text not null,
  size text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  company_id uuid not null references public.companies(id) on delete restrict,
  email text not null,
  phone text not null,
  status public.lead_status not null default 'New',
  lead_source text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  last_contacted date,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  company_id uuid not null references public.companies(id) on delete restrict,
  email text not null,
  phone text not null,
  title text not null,
  avatar_url text,
  preferred_contact_method text not null default 'Email' check (preferred_contact_method in ('Email', 'Phone', 'No preference')),
  timezone text not null default 'Asia/Manila',
  best_time_to_contact text not null default '9:00 AM - 5:00 PM',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  company text not null,
  company_id uuid not null references public.companies(id) on delete restrict,
  products_services text not null default 'SalesPro CRM subscription',
  value numeric(12,2) not null default 0,
  probability int not null default 0 check (probability between 0 and 100),
  stage public.deal_stage not null default 'New Lead',
  loss_reason text,
  next_step text not null default 'Schedule next follow-up',
  next_step_date date not null default (current_date + 7),
  forecast_category text not null default 'Pipeline' check (forecast_category in ('Commit', 'Best Case', 'Pipeline')),
  review_status text not null default 'Not Required' check (review_status in ('Not Required', 'Pending Review', 'Approved', 'Changes Requested')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  stage_changed_at timestamptz not null default now(),
  assigned_to uuid references public.profiles(id) on delete set null,
  expected_close_date date not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  status public.task_status not null default 'Todo',
  due_date date,
  related_type text,
  related_id uuid,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  related_type text not null,
  related_id uuid not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create unique index companies_name_unique_idx on public.companies (lower(name));
create unique index companies_domain_unique_idx on public.companies (lower(domain));
create unique index leads_email_unique_idx on public.leads (lower(email));
create unique index contacts_email_unique_idx on public.contacts (lower(email));
create index leads_company_id_idx on public.leads (company_id);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_status_idx on public.leads (status);
create index contacts_company_id_idx on public.contacts (company_id);
create index deals_company_id_idx on public.deals (company_id);
create index deals_stage_idx on public.deals (stage);
create index deals_assigned_to_idx on public.deals (assigned_to);
create index deals_stage_changed_at_idx on public.deals (stage_changed_at);
create index tasks_assigned_to_status_idx on public.tasks (assigned_to, status);
create index activities_entity_idx on public.activities (entity_type, entity_id);
create index audit_logs_record_idx on public.audit_logs (table_name, record_id, changed_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  record_uuid uuid;
begin
  record_uuid := coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid);
  insert into public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  values (tg_table_name, record_uuid, tg_op, to_jsonb(old), to_jsonb(new), auth.uid());
  return coalesce(new, old);
end;
$$;

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

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger companies_set_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger deals_set_updated_at before update on public.deals for each row execute function public.set_updated_at();
create trigger tasks_set_updated_at before update on public.tasks for each row execute function public.set_updated_at();

create trigger companies_audit after insert or update or delete on public.companies for each row execute function public.write_audit_log();
create trigger leads_audit after insert or update or delete on public.leads for each row execute function public.write_audit_log();
create trigger contacts_audit after insert or update or delete on public.contacts for each row execute function public.write_audit_log();
create trigger deals_audit after insert or update or delete on public.deals for each row execute function public.write_audit_log();
create trigger tasks_audit after insert or update or delete on public.tasks for each row execute function public.write_audit_log();
create trigger notes_audit after insert or update or delete on public.notes for each row execute function public.write_audit_log();

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
alter table public.audit_logs enable row level security;

create policy "profiles read authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles update own or admin" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin());

create policy "companies read sales users" on public.companies for select to authenticated using (public.is_sales_user());
create policy "companies insert managers" on public.companies for insert to authenticated with check (public.is_manager());
create policy "companies update managers" on public.companies for update to authenticated using (public.is_manager()) with check (public.is_manager());
create policy "companies delete managers" on public.companies for delete to authenticated using (public.is_manager());

create policy "leads read by role" on public.leads for select to authenticated using (public.is_manager() or assigned_to = auth.uid());
create policy "leads insert managers" on public.leads for insert to authenticated with check (public.is_manager());
create policy "leads update managers or assigned reps" on public.leads for update to authenticated using (public.is_manager() or assigned_to = auth.uid()) with check (public.is_manager() or assigned_to = auth.uid());
create policy "leads delete managers" on public.leads for delete to authenticated using (public.is_manager());

create policy "contacts read by role" on public.contacts for select to authenticated using (public.is_manager() or assigned_to = auth.uid());
create policy "contacts insert managers" on public.contacts for insert to authenticated with check (public.is_manager());
create policy "contacts update managers or assigned reps" on public.contacts for update to authenticated using (public.is_manager() or assigned_to = auth.uid()) with check (public.is_manager() or assigned_to = auth.uid());
create policy "contacts delete managers" on public.contacts for delete to authenticated using (public.is_manager());

create policy "deals read by role" on public.deals for select to authenticated using (public.is_manager() or assigned_to = auth.uid());
create policy "deals insert managers" on public.deals for insert to authenticated with check (public.is_manager());
create policy "deals update managers or assigned reps" on public.deals for update to authenticated using (public.is_manager() or assigned_to = auth.uid()) with check (public.is_manager() or assigned_to = auth.uid());
create policy "deals delete managers" on public.deals for delete to authenticated using (public.is_manager());

create policy "tasks read by role" on public.tasks for select to authenticated using (public.is_manager() or assigned_to = auth.uid());
create policy "tasks insert managers or assigned reps" on public.tasks for insert to authenticated with check (public.is_manager() or (created_by = auth.uid() and assigned_to = auth.uid()));
create policy "tasks update managers or assigned reps" on public.tasks for update to authenticated using (public.is_manager() or assigned_to = auth.uid()) with check (public.is_manager() or assigned_to = auth.uid());
create policy "tasks delete managers or assigned reps" on public.tasks for delete to authenticated using (public.is_manager() or assigned_to = auth.uid());

create policy "notes read by role" on public.notes for select to authenticated using (public.is_manager() or created_by = auth.uid());
create policy "notes write sales users" on public.notes for insert to authenticated with check (public.is_sales_user() and created_by = auth.uid());
create policy "notes update managers or authors" on public.notes for update to authenticated using (public.is_manager() or created_by = auth.uid()) with check (public.is_manager() or created_by = auth.uid());
create policy "notes delete managers or authors" on public.notes for delete to authenticated using (public.is_manager() or created_by = auth.uid());

create policy "activities read by role" on public.activities for select to authenticated using (public.is_manager() or created_by = auth.uid());
create policy "activities write sales users" on public.activities for insert to authenticated with check (public.is_sales_user() and created_by = auth.uid());
create policy "activities delete managers or authors" on public.activities for delete to authenticated using (public.is_manager() or created_by = auth.uid());

create policy "audit logs read managers" on public.audit_logs for select to authenticated using (public.is_manager() or public.is_admin());
