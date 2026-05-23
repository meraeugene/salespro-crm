-- Clear CRM workspace data while keeping auth users and profiles.
-- Run this in the Supabase SQL editor when you want an empty CRM.

truncate table public.activities restart identity cascade;
truncate table public.notes restart identity cascade;
truncate table public.tasks restart identity cascade;
truncate table public.deals restart identity cascade;
truncate table public.contacts restart identity cascade;
truncate table public.leads restart identity cascade;
truncate table public.companies restart identity cascade;

