# SalesPro CRM

SalesPro CRM is a full-stack sales workspace for managing companies, leads, contacts, deals, tasks, notifications, and revenue analytics.

It is built with Next.js App Router, TypeScript, Supabase, Tailwind CSS, SWR, Zustand, Recharts, React Hook Form, Zod, Framer Motion, and Lucide icons.

## Features

- Secure sign-in, forgot password, protected routes, and role-aware access.
- Company-first CRM workflow with company dropdowns on lead and contact forms.
- Leads table with search, sort, filters, edit, delete, and assigned sales rep tracking.
- Deal pipeline with drag-and-drop stages and automatic close probability.
- Task board with drag-and-drop Todo, In Progress, and Done columns.
- Notification center with read/unread behavior and badge count updates.
- Admin tools for creating users, assigning roles, deleting users, and recovery links.
- Supabase schema, RLS policies, seed users, and demo CRM data.

## Roles

- `admin`: manages accounts, roles, recovery links, and login logs.
- `sales_manager`: manages the CRM workspace and assigns work to representatives.
- `sales_representative`: owns assigned leads, contacts, deals, and tasks.

## CRM Workflow

1. Admin creates users.
2. Manager creates companies first.
3. Manager creates contacts and leads under existing companies.
4. Manager assigns sales records to a sales representative.
5. Leads are qualified and converted into deal work.
6. Deals move through the pipeline.
7. Tasks and notes track follow-up.
8. Dashboard and analytics summarize pipeline health, revenue, and rep performance.

## Deal Probability

Deal close probability is calculated from the deal stage:

| Stage | Probability |
| --- | ---: |
| New Lead | 10% |
| Contacted | 20% |
| Qualified | 40% |
| Proposal Sent | 60% |
| Negotiation | 80% |
| Won | 100% |
| Lost | 0% |

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run `supabase/schema.sql` in the Supabase SQL editor.

Create demo auth users:

```bash
npm run supabase:demo-users
```

Then run `supabase/seed.sql` in the Supabase SQL editor.

Demo users use password `Salespro123!`:

- `admin@salespro.test`
- `manager@salespro.test`
- `rep@salespro.test`

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run supabase:demo-users
```

## Project Structure

- `app/`: routes, API handlers, layouts, loading states, and auth pages.
- `components/`: UI, layout, forms, tables, charts, admin, deals, and tasks.
- `hooks/`: SWR data hooks.
- `lib/`: auth helpers, Supabase clients, utilities, mock data, and deal probability logic.
- `store/`: Zustand UI state.
- `validations/`: Zod schemas.
- `supabase/`: database schema, seed users, and seed CRM data.

## Notes

Without Supabase environment variables, API routes serve mock data so the UI can still be reviewed locally.

Use `supabase/clear-all-data.sql` if you want to empty CRM records while keeping auth users and profiles.
