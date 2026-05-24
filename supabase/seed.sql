-- SalesPro CRM complete demo seed.
-- Run supabase/schema.sql first.
-- Then create these Auth users before running this file:
--   admin@salespro.test     role: admin
--   manager@salespro.test   role: sales_manager
--   rep@salespro.test       role: sales_representative
-- Demo password used by scripts/create-demo-users.mjs: Salespro123!

delete from public.activities;
delete from public.notes;
delete from public.tasks;
delete from public.deals;
delete from public.contacts;
delete from public.leads;
delete from public.companies;

insert into public.companies (id, name, domain, industry, size, created_by, created_at)
values
  ('10000000-0000-4000-8000-000000000001', 'Stellar Dynamics', 'stellar.example', 'Robotics', '250-500 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-01-12'),
  ('10000000-0000-4000-8000-000000000002', 'Acme Inc.', 'acme.example', 'Manufacturing', '500-1000 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-02-02'),
  ('10000000-0000-4000-8000-000000000003', 'Globax Corporation', 'globax.example', 'Logistics', '1000+ employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-02-26'),
  ('10000000-0000-4000-8000-000000000004', 'Northstar Labs', 'northstar.example', 'SaaS', '50-250 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-03-07'),
  ('10000000-0000-4000-8000-000000000005', 'Helio Metrics', 'helio.example', 'Analytics', '50-100 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-03-18'),
  ('10000000-0000-4000-8000-000000000006', 'Kinetic Works', 'kinetic.example', 'Enablement', '100-250 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-05')
on conflict (id) do update set
  name = excluded.name,
  domain = excluded.domain,
  industry = excluded.industry,
  size = excluded.size,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.leads (id, full_name, company, company_id, email, phone, status, lead_source, assigned_to, last_contacted, notes, created_by, created_at)
values
  ('20000000-0000-4000-8000-000000000001', 'David Wong', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 'david@stellar.example', '+63 917 123 4501', 'Proposal', 'Webinar', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18', 'Proposal sent for enterprise rollout.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-13'),
  ('20000000-0000-4000-8000-000000000002', 'Benjamin Ross', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 'ben@acme.example', '+63 917 123 4502', 'Proposal', 'Referral', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-15', 'Proposal with procurement for review.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-18'),
  ('20000000-0000-4000-8000-000000000003', 'Grace Anderson', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 'grace@globax.example', '+63 917 123 4503', 'Won', 'LinkedIn', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-19', 'Closed global rollout for 120 seats.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-21'),
  ('20000000-0000-4000-8000-000000000004', 'Alice Chapman', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 'alice@northstar.example', '+63 917 123 4504', 'New', 'Website', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-11', 'Requested pricing.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-01'),
  ('20000000-0000-4000-8000-000000000005', 'Dominic Richards', 'Helio Metrics', '10000000-0000-4000-8000-000000000005', 'dominic@helio.example', '+63 917 123 4505', 'Won', 'Event', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-20', 'Closed pilot package.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-06'),
  ('20000000-0000-4000-8000-000000000006', 'Nadia Patel', 'Kinetic Works', '10000000-0000-4000-8000-000000000006', 'nadia@kinetic.example', '+63 917 123 4506', 'Qualified', 'Partner', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-17', 'Security questionnaire pending.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-08')
on conflict (id) do update set
  full_name = excluded.full_name,
  company = excluded.company,
  company_id = excluded.company_id,
  email = excluded.email,
  phone = excluded.phone,
  status = excluded.status,
  lead_source = excluded.lead_source,
  assigned_to = excluded.assigned_to,
  last_contacted = excluded.last_contacted,
  notes = excluded.notes,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.contacts (id, full_name, company, company_id, email, phone, title, avatar_url, assigned_to, created_by, created_at)
values
  ('30000000-0000-4000-8000-000000000001', 'Sarah Thompson', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 'sarah@stellar.example', '+63 918 123 4501', 'VP Revenue', null, (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-14'),
  ('30000000-0000-4000-8000-000000000002', 'Marcus Rivera', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 'marcus@acme.example', '+63 918 123 4502', 'Procurement Lead', null, (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22'),
  ('30000000-0000-4000-8000-000000000003', 'Priya Shah', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 'priya@globax.example', '+63 918 123 4503', 'Operations Director', null, (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-29'),
  ('30000000-0000-4000-8000-000000000004', 'Noah Kim', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 'noah@northstar.example', '+63 918 123 4504', 'Founder', null, (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-04')
on conflict (id) do update set
  full_name = excluded.full_name,
  company = excluded.company,
  company_id = excluded.company_id,
  email = excluded.email,
  phone = excluded.phone,
  title = excluded.title,
  avatar_url = excluded.avatar_url,
  assigned_to = excluded.assigned_to,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.deals (id, title, company, company_id, value, probability, stage, assigned_to, expected_close_date, created_by, created_at)
values
  ('40000000-0000-4000-8000-000000000001', 'Stellar Enterprise CRM', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 142000, 60, 'Proposal Sent', (select id from public.profiles where email = 'manager@salespro.test'), '2026-06-14', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-15'),
  ('40000000-0000-4000-8000-000000000002', 'Acme Sales Hub', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 86000, 60, 'Proposal Sent', (select id from public.profiles where email = 'manager@salespro.test'), '2026-06-28', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-23'),
  ('40000000-0000-4000-8000-000000000003', 'Globax Global Rollout', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 228000, 100, 'Won', (select id from public.profiles where email = 'manager@salespro.test'), '2026-07-03', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-29'),
  ('40000000-0000-4000-8000-000000000004', 'Northstar Pilot', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 32000, 10, 'New Lead', (select id from public.profiles where email = 'manager@salespro.test'), '2026-06-10', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-04'),
  ('40000000-0000-4000-8000-000000000005', 'Helio Metrics Pilot', 'Helio Metrics', '10000000-0000-4000-8000-000000000005', 59000, 100, 'Won', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-20', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-02'),
  ('40000000-0000-4000-8000-000000000006', 'Kinetic Enablement Rollout', 'Kinetic Works', '10000000-0000-4000-8000-000000000006', 41000, 40, 'Qualified', (select id from public.profiles where email = 'manager@salespro.test'), '2026-06-24', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-10')
on conflict (id) do update set
  title = excluded.title,
  company = excluded.company,
  company_id = excluded.company_id,
  value = excluded.value,
  probability = excluded.probability,
  stage = excluded.stage,
  assigned_to = excluded.assigned_to,
  expected_close_date = excluded.expected_close_date,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.tasks (id, title, description, status, due_date, related_type, related_id, assigned_to, created_by, created_at)
values
  ('50000000-0000-4000-8000-000000000001', 'Send revised Stellar pricing', 'Include annual prepay discount and updated implementation timeline.', 'In Progress', '2026-05-24', 'deal', '40000000-0000-4000-8000-000000000001', (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18'),
  ('50000000-0000-4000-8000-000000000002', 'Call Acme procurement', 'Confirm legal owner and contract review window.', 'Todo', '2026-05-25', 'lead', '20000000-0000-4000-8000-000000000002', (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-19'),
  ('50000000-0000-4000-8000-000000000003', 'Prepare Globax stakeholder map', 'Add buying committee notes before the next demo.', 'Done', '2026-05-21', 'deal', '40000000-0000-4000-8000-000000000003', (select id from public.profiles where email = 'manager@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-15')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  due_date = excluded.due_date,
  related_type = excluded.related_type,
  related_id = excluded.related_id,
  assigned_to = excluded.assigned_to,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.notes (id, body, related_type, related_id, created_by, created_at)
values
  ('60000000-0000-4000-8000-000000000001', 'Stellar wants pricing broken out by team so finance can compare it against the current stack.', 'deal', '40000000-0000-4000-8000-000000000001', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22'),
  ('60000000-0000-4000-8000-000000000002', 'Acme procurement asked for security documentation before scheduling legal review.', 'lead', '20000000-0000-4000-8000-000000000002', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22'),
  ('60000000-0000-4000-8000-000000000003', 'Globax prefers a phased rollout with operations and sales going live first.', 'deal', '40000000-0000-4000-8000-000000000003', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22'),
  ('60000000-0000-4000-8000-000000000004', 'Northstar needs founder approval before procurement can begin.', 'general', '20000000-0000-4000-8000-000000000004', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23')
on conflict (id) do update set
  body = excluded.body,
  related_type = excluded.related_type,
  related_id = excluded.related_id,
  created_by = excluded.created_by,
  created_at = excluded.created_at;

insert into public.activities (id, action, entity_type, entity_id, metadata, created_by, created_at)
values
  ('70000000-0000-4000-8000-000000000001', 'Deal moved to Qualified', 'deal', '40000000-0000-4000-8000-000000000004', '{"stage":"Qualified","title":"Northstar Pilot","company":"Northstar Labs","value":32000,"probability":36}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23'),
  ('70000000-0000-4000-8000-000000000002', 'Deal moved to Won', 'deal', '40000000-0000-4000-8000-000000000003', '{"stage":"Won","title":"Globax Global Rollout","company":"Globax Corporation","value":228000,"probability":68}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23'),
  ('70000000-0000-4000-8000-000000000003', 'Deal moved to Qualified', 'deal', '40000000-0000-4000-8000-000000000006', '{"stage":"Qualified","title":"Kinetic Enablement Rollout","company":"Kinetic Works","value":41000,"probability":40}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23'),
  ('70000000-0000-4000-8000-000000000004', 'Lead assigned', 'lead', '20000000-0000-4000-8000-000000000002', '{"title":"Benjamin Ross","company":"Acme Inc.","assigned_to":"Maya Chen"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22'),
  ('70000000-0000-4000-8000-000000000005', 'Task completed', 'task', '50000000-0000-4000-8000-000000000003', '{"title":"Prepare Globax stakeholder map","status":"Done"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-21')
on conflict (id) do update set
  action = excluded.action,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  metadata = excluded.metadata,
  created_by = excluded.created_by,
  created_at = excluded.created_at;

update public.leads
set assigned_to = (select id from public.profiles where email = 'rep@salespro.test'),
    updated_at = now()
where exists (select 1 from public.profiles where email = 'rep@salespro.test');

update public.contacts
set assigned_to = (select id from public.profiles where email = 'rep@salespro.test'),
    updated_at = now()
where exists (select 1 from public.profiles where email = 'rep@salespro.test');

update public.deals
set assigned_to = (select id from public.profiles where email = 'rep@salespro.test'),
    updated_at = now()
where exists (select 1 from public.profiles where email = 'rep@salespro.test');

update public.tasks
set assigned_to = (select id from public.profiles where email = 'rep@salespro.test'),
    updated_at = now()
where exists (select 1 from public.profiles where email = 'rep@salespro.test');
