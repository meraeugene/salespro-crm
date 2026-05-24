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
delete from public.audit_logs;

insert into public.companies (id, name, domain, industry, size, created_by, created_at)
values
  ('10000000-0000-4000-8000-000000000001', 'Stellar Dynamics', 'stellar.example', 'Robotics', '250-500 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-01-12 09:00+08'),
  ('10000000-0000-4000-8000-000000000002', 'Acme Inc.', 'acme.example', 'Manufacturing', '500-1000 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-02-02 10:15+08'),
  ('10000000-0000-4000-8000-000000000003', 'Globax Corporation', 'globax.example', 'Logistics', '1000+ employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-02-26 11:30+08'),
  ('10000000-0000-4000-8000-000000000004', 'Northstar Labs', 'northstar.example', 'SaaS', '50-250 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-03-07 14:20+08'),
  ('10000000-0000-4000-8000-000000000005', 'Helio Metrics', 'helio.example', 'Analytics', '50-100 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-03-18 08:45+08'),
  ('10000000-0000-4000-8000-000000000006', 'Kinetic Works', 'kinetic.example', 'Enablement', '100-250 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-05 13:00+08'),
  ('10000000-0000-4000-8000-000000000007', 'BrightWave Finance', 'brightwave.example', 'Financial Services', '250-500 employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-17 09:40+08'),
  ('10000000-0000-4000-8000-000000000008', 'Summit Health Group', 'summithealth.example', 'Healthcare', '1000+ employees', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-25 15:10+08')
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
  ('20000000-0000-4000-8000-000000000001', 'David Wong', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 'david@stellar.example', '+639171234501', 'Proposal', 'Webinar', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-18', 'Technical champion for the enterprise robotics rollout. Waiting for revised pricing by team.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-13 09:30+08'),
  ('20000000-0000-4000-8000-000000000002', 'Benjamin Ross', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 'ben@acme.example', '+639171234502', 'Proposal', 'Referral', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-15', 'Procurement wants security documents before legal review can begin.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-18 10:10+08'),
  ('20000000-0000-4000-8000-000000000003', 'Grace Anderson', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 'grace@globax.example', '+639171234503', 'Won', 'LinkedIn', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-19', 'Converted into rollout after operations confirmed a phased launch plan.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-21 11:00+08'),
  ('20000000-0000-4000-8000-000000000004', 'Alice Chapman', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 'alice@northstar.example', '+639171234504', 'New', 'Website', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-11', 'Founder asked for a pilot quote and wants to keep spend under the current stack.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-01 09:05+08'),
  ('20000000-0000-4000-8000-000000000005', 'Dominic Richards', 'Helio Metrics', '10000000-0000-4000-8000-000000000005', 'dominic@helio.example', '+639171234505', 'Won', 'Event', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-20', 'Analytics pilot closed after dashboard team approved the reporting package.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-06 13:25+08'),
  ('20000000-0000-4000-8000-000000000006', 'Nadia Patel', 'Kinetic Works', '10000000-0000-4000-8000-000000000006', 'nadia@kinetic.example', '+639171234506', 'Qualified', 'Partner', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-17', 'Enablement team is qualified, but security questionnaire needs completion before proposal.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-08 15:30+08'),
  ('20000000-0000-4000-8000-000000000007', 'Elena Cruz', 'BrightWave Finance', '10000000-0000-4000-8000-000000000007', 'elena@brightwave.example', '+639171234507', 'Contacted', 'Outbound', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-22', 'Revenue operations wants audit history and approval controls before considering a pilot.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-16 10:50+08'),
  ('20000000-0000-4000-8000-000000000008', 'Owen Brooks', 'Summit Health Group', '10000000-0000-4000-8000-000000000008', 'owen@summithealth.example', '+639171234508', 'New', 'Conference', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-23', 'Healthcare group needs a compliant CRM workspace for regional sales teams.', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18 16:00+08')
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

insert into public.contacts (id, full_name, company, company_id, email, phone, title, avatar_url, preferred_contact_method, timezone, best_time_to_contact, assigned_to, created_by, created_at)
values
  ('30000000-0000-4000-8000-000000000001', 'Sarah Thompson', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 'sarah@stellar.example', '+639181234501', 'VP Revenue', null, 'Email', 'Asia/Manila', '9:00 AM - 11:00 AM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-14 09:40+08'),
  ('30000000-0000-4000-8000-000000000002', 'Marcus Rivera', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 'marcus@acme.example', '+639181234502', 'Procurement Lead', null, 'Email', 'Asia/Manila', '2:00 PM - 4:00 PM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 10:00+08'),
  ('30000000-0000-4000-8000-000000000003', 'Priya Shah', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 'priya@globax.example', '+639181234503', 'Operations Director', null, 'Phone', 'Asia/Singapore', '10:00 AM - 12:00 PM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-29 11:30+08'),
  ('30000000-0000-4000-8000-000000000004', 'Noah Kim', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 'noah@northstar.example', '+639181234504', 'Founder', null, 'No preference', 'America/Los_Angeles', '8:00 AM - 10:00 AM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-04 08:35+08'),
  ('30000000-0000-4000-8000-000000000005', 'Lena Ortiz', 'BrightWave Finance', '10000000-0000-4000-8000-000000000007', 'lena@brightwave.example', '+639181234505', 'Revenue Operations Manager', null, 'Email', 'America/New_York', '9:00 AM - 10:30 AM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18 09:20+08'),
  ('30000000-0000-4000-8000-000000000006', 'Dr. Maya Singh', 'Summit Health Group', '10000000-0000-4000-8000-000000000008', 'maya@summithealth.example', '+639181234506', 'Regional Sales Director', null, 'Phone', 'Asia/Manila', '3:00 PM - 5:00 PM', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-19 15:10+08')
on conflict (id) do update set
  full_name = excluded.full_name,
  company = excluded.company,
  company_id = excluded.company_id,
  email = excluded.email,
  phone = excluded.phone,
  title = excluded.title,
  avatar_url = excluded.avatar_url,
  preferred_contact_method = excluded.preferred_contact_method,
  timezone = excluded.timezone,
  best_time_to_contact = excluded.best_time_to_contact,
  assigned_to = excluded.assigned_to,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.deals (id, title, company, company_id, products_services, value, probability, stage, loss_reason, next_step, next_step_date, forecast_category, review_status, reviewed_by, reviewed_at, stage_changed_at, assigned_to, expected_close_date, created_by, created_at)
values
  ('40000000-0000-4000-8000-000000000001', 'Stellar Enterprise CRM', 'Stellar Dynamics', '10000000-0000-4000-8000-000000000001', 'Enterprise CRM licenses, onboarding, approval workflow, and revenue reporting', 142000, 60, 'Proposal Sent', null, 'Send revised pricing by robotics division', '2026-05-24', 'Best Case', 'Pending Review', null, null, '2026-05-18 15:00+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-06-14', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-15 10:00+08'),
  ('40000000-0000-4000-8000-000000000002', 'Acme Sales Hub', 'Acme Inc.', '10000000-0000-4000-8000-000000000002', 'Sales hub seats, procurement workflow, and implementation support', 86000, 60, 'Proposal Sent', null, 'Confirm legal owner and review window', '2026-05-25', 'Commit', 'Not Required', null, null, '2026-05-15 14:20+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-06-28', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-23 14:00+08'),
  ('40000000-0000-4000-8000-000000000003', 'Globax Rollout', 'Globax Corporation', '10000000-0000-4000-8000-000000000003', 'CRM rollout, phased implementation, integrations, and analytics package', 228000, 100, 'Won', null, 'Schedule customer success kickoff', '2026-05-27', 'Commit', 'Approved', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 09:00+08', '2026-05-23 09:05+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-07-03', (select id from public.profiles where email = 'manager@salespro.test'), '2026-04-29 13:10+08'),
  ('40000000-0000-4000-8000-000000000004', 'Northstar Pilot', 'Northstar Labs', '10000000-0000-4000-8000-000000000004', 'Founder-led CRM pilot, startup onboarding, and basic reporting', 32000, 10, 'New Lead', null, 'Confirm founder approval path', '2026-05-28', 'Pipeline', 'Not Required', null, null, '2026-05-04 16:25+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-06-10', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-04 16:20+08'),
  ('40000000-0000-4000-8000-000000000005', 'Helio Metrics Pilot', 'Helio Metrics', '10000000-0000-4000-8000-000000000005', 'Analytics CRM pilot and dashboard enablement', 59000, 100, 'Won', null, 'Hand off analytics workspace to customer success', '2026-05-24', 'Commit', 'Not Required', null, null, '2026-05-20 11:00+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-05-20', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-02 10:40+08'),
  ('40000000-0000-4000-8000-000000000006', 'Kinetic Enablement Rollout', 'Kinetic Works', '10000000-0000-4000-8000-000000000006', 'Enablement rollout, team training, and CRM automations', 41000, 40, 'Qualified', null, 'Complete security questionnaire', '2026-05-29', 'Pipeline', 'Not Required', null, null, '2026-05-23 14:30+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-06-24', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-10 09:15+08'),
  ('40000000-0000-4000-8000-000000000007', 'BrightWave Compliance CRM', 'BrightWave Finance', '10000000-0000-4000-8000-000000000007', 'CRM audit trail, manager approval controls, and encrypted reporting exports', 118000, 40, 'Qualified', null, 'Send audit trail data flow notes', '2026-05-30', 'Best Case', 'Pending Review', null, null, '2026-05-22 12:00+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-07-12', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-17 11:20+08'),
  ('40000000-0000-4000-8000-000000000008', 'Summit Regional CRM', 'Summit Health Group', '10000000-0000-4000-8000-000000000008', 'Regional healthcare CRM workspace, contact preferences, and CSV reporting package', 97000, 20, 'Contacted', null, 'Schedule compliance discovery call', '2026-05-31', 'Pipeline', 'Not Required', null, null, '2026-05-23 16:00+08', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), '2026-07-20', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-19 15:00+08')
on conflict (id) do update set
  title = excluded.title,
  company = excluded.company,
  company_id = excluded.company_id,
  products_services = excluded.products_services,
  value = excluded.value,
  probability = excluded.probability,
  stage = excluded.stage,
  loss_reason = excluded.loss_reason,
  next_step = excluded.next_step,
  next_step_date = excluded.next_step_date,
  forecast_category = excluded.forecast_category,
  review_status = excluded.review_status,
  reviewed_by = excluded.reviewed_by,
  reviewed_at = excluded.reviewed_at,
  stage_changed_at = excluded.stage_changed_at,
  assigned_to = excluded.assigned_to,
  expected_close_date = excluded.expected_close_date,
  created_by = excluded.created_by,
  created_at = excluded.created_at,
  updated_at = now();

insert into public.tasks (id, title, description, status, due_date, related_type, related_id, assigned_to, created_by, created_at)
values
  ('50000000-0000-4000-8000-000000000001', 'Send revised Stellar pricing', 'Include annual prepay discount and split pricing for robotics, service, and support teams.', 'In Progress', '2026-05-24', 'deal', '40000000-0000-4000-8000-000000000001', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18 15:10+08'),
  ('50000000-0000-4000-8000-000000000002', 'Call Acme procurement', 'Confirm legal owner, vendor onboarding steps, and security document deadline.', 'Todo', '2026-05-25', 'deal', '40000000-0000-4000-8000-000000000002', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-19 09:45+08'),
  ('50000000-0000-4000-8000-000000000003', 'Prepare Globax stakeholder map', 'Document operations, sales, and executive stakeholders before kickoff handoff.', 'Done', '2026-05-21', 'deal', '40000000-0000-4000-8000-000000000003', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-15 12:00+08'),
  ('50000000-0000-4000-8000-000000000004', 'Request Kinetic security answers', 'Collect answers for SSO, data retention, audit logs, and admin permissions.', 'Todo', '2026-05-29', 'deal', '40000000-0000-4000-8000-000000000006', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 15:00+08'),
  ('50000000-0000-4000-8000-000000000005', 'Review BrightWave approval path', 'Map who can approve the deal and whether compliance must sign off before finance.', 'In Progress', '2026-05-30', 'deal', '40000000-0000-4000-8000-000000000007', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 13:20+08'),
  ('50000000-0000-4000-8000-000000000006', 'Book Summit compliance discovery', 'Schedule call with regional sales and compliance to confirm data handling requirements.', 'Todo', '2026-05-31', 'lead', '20000000-0000-4000-8000-000000000008', coalesce((select id from public.profiles where email = 'rep@salespro.test'), (select id from public.profiles where email = 'manager@salespro.test')), (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 16:10+08')
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
  ('60000000-0000-4000-8000-000000000001', 'Stellar finance needs pricing broken out by team so they can compare SalesPro against their current CRM and reporting stack.', 'deal', '40000000-0000-4000-8000-000000000001', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 09:00+08'),
  ('60000000-0000-4000-8000-000000000002', 'Acme procurement asked for SOC2, DPA, and role permission documentation before scheduling legal review.', 'deal', '40000000-0000-4000-8000-000000000002', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 11:00+08'),
  ('60000000-0000-4000-8000-000000000003', 'Globax wants a phased rollout with operations and sales going live first, then regional managers one month later.', 'deal', '40000000-0000-4000-8000-000000000003', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 13:10+08'),
  ('60000000-0000-4000-8000-000000000004', 'Northstar needs founder approval before procurement can begin. Noah prefers a short pilot and no long-term commitment yet.', 'company', '10000000-0000-4000-8000-000000000004', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 08:45+08'),
  ('60000000-0000-4000-8000-000000000005', 'BrightWave is especially interested in duplicate detection, audit trails, and manager approval before large deals close.', 'deal', '40000000-0000-4000-8000-000000000007', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 14:40+08'),
  ('60000000-0000-4000-8000-000000000006', 'Summit Health asked whether CSV exports can support weekly regional reporting for sales operations.', 'lead', '20000000-0000-4000-8000-000000000008', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 16:30+08')
on conflict (id) do update set
  body = excluded.body,
  related_type = excluded.related_type,
  related_id = excluded.related_id,
  created_by = excluded.created_by,
  created_at = excluded.created_at;

insert into public.activities (id, action, entity_type, entity_id, metadata, created_by, created_at)
values
  ('70000000-0000-4000-8000-000000000001', 'Deal moved to Proposal Sent', 'deal', '40000000-0000-4000-8000-000000000001', '{"stage":"Proposal Sent","title":"Stellar Enterprise CRM","company":"Stellar Dynamics","value":142000,"forecast_category":"Best Case","review_status":"Pending Review"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-18 15:00+08'),
  ('70000000-0000-4000-8000-000000000002', 'Deal approved', 'deal', '40000000-0000-4000-8000-000000000003', '{"title":"Globax Rollout","company":"Globax Corporation","review_status":"Approved","approved_by":"Maya Chen"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 09:00+08'),
  ('70000000-0000-4000-8000-000000000003', 'Deal moved to Won', 'deal', '40000000-0000-4000-8000-000000000003', '{"stage":"Won","title":"Globax Rollout","company":"Globax Corporation","value":228000,"probability":100}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 09:05+08'),
  ('70000000-0000-4000-8000-000000000004', 'Lead assigned', 'lead', '20000000-0000-4000-8000-000000000002', '{"title":"Benjamin Ross","company":"Acme Inc.","assigned_to":"Jordan Lee"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-22 11:15+08'),
  ('70000000-0000-4000-8000-000000000005', 'Task completed', 'task', '50000000-0000-4000-8000-000000000003', '{"title":"Prepare Globax stakeholder map","status":"Done"}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-21 17:20+08'),
  ('70000000-0000-4000-8000-000000000006', 'Call logged', 'deal', '40000000-0000-4000-8000-000000000007', '{"activity_type":"Call","subject":"BrightWave compliance call","body":"Reviewed audit trail and approval workflow requirements.","outcome":"Requested data flow summary","scheduled_at":null}', (select id from public.profiles where email = 'manager@salespro.test'), '2026-05-23 14:30+08')
on conflict (id) do update set
  action = excluded.action,
  entity_type = excluded.entity_type,
  entity_id = excluded.entity_id,
  metadata = excluded.metadata,
  created_by = excluded.created_by,
  created_at = excluded.created_at;
