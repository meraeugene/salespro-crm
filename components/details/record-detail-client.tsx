"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckSquare,
  CircleDollarSign,
  Clock,
  Globe2,
  Handshake,
  Mail,
  NotebookText,
  Percent,
  Phone,
  Tag,
  UserRound,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useActivities,
  useCompanies,
  useContacts,
  useDeals,
  useLeads,
  useNotes,
  useTasks,
} from "@/hooks/use-crm";
import { currency, shortDate, shortDateTime } from "@/lib/utils";
import type { Activity, Company, Contact, Deal, Lead, Note, Task } from "@/types/crm";

type RecordKind = "companies" | "leads" | "deals" | "contacts" | "tasks";

type TimelineItem = {
  id: string;
  type: "Call" | "Note" | "Task" | "Email" | "Meeting" | "Demo" | "Stage" | "Status" | "Activity";
  title: string;
  detail: string;
  date?: string | null;
};

const backHref: Record<RecordKind, string> = {
  companies: "/companies",
  leads: "/leads",
  deals: "/deals",
  contacts: "/contacts",
  tasks: "/tasks",
};

const recordLabel: Record<RecordKind, string> = {
  companies: "Company",
  leads: "Lead",
  deals: "Deal",
  contacts: "Contact",
  tasks: "Task",
};

const singularEntity: Record<RecordKind, string> = {
  companies: "company",
  leads: "lead",
  deals: "deal",
  contacts: "contact",
  tasks: "task",
};

function sortByDate(items: TimelineItem[]) {
  return [...items].sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

function isSameRecord(activity: Activity, type: string, id: string) {
  return activity.entity_type === type && activity.entity_id === id;
}

function metadataText(activity: Activity, key: string) {
  const value = activity.metadata?.[key];
  return typeof value === "string" ? value : "";
}

function companyMatches(company: Company, recordCompany?: string | null, recordCompanyId?: string | null) {
  return Boolean((recordCompanyId && company.id === recordCompanyId) || (recordCompany && company.name === recordCompany));
}

function entityPath(type: "companies" | "leads" | "deals" | "contacts" | "tasks", id: string) {
  return `/${type}/${id}`;
}

function TimelineIcon({ type }: { type: TimelineItem["type"] }) {
  if (type === "Call") return <Phone className="h-4 w-4" />;
  if (type === "Note") return <NotebookText className="h-4 w-4" />;
  if (type === "Task") return <CheckSquare className="h-4 w-4" />;
  if (type === "Email") return <Mail className="h-4 w-4" />;
  if (type === "Meeting" || type === "Demo") return <CalendarDays className="h-4 w-4" />;
  if (type === "Stage" || type === "Status") return <BriefcaseBusiness className="h-4 w-4" />;
  return <Bell className="h-4 w-4" />;
}

function FieldIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  if (normalized.includes("lead name")) return <UserRound className="h-4 w-4" />;
  if (normalized.includes("deal title")) return <Handshake className="h-4 w-4" />;
  if (normalized.includes("record") || normalized.includes("company")) return <Building2 className="h-4 w-4" />;
  if (normalized.includes("created") || normalized.includes("updated")) return <Clock className="h-4 w-4" />;
  if (normalized.includes("status") || normalized.includes("stage")) return <BriefcaseBusiness className="h-4 w-4" />;
  if (normalized.includes("products")) return <BriefcaseBusiness className="h-4 w-4" />;
  if (normalized.includes("loss")) return <NotebookText className="h-4 w-4" />;
  if (normalized.includes("next")) return <CheckSquare className="h-4 w-4" />;
  if (normalized.includes("stage age")) return <Clock className="h-4 w-4" />;
  if (normalized.includes("email")) return <Mail className="h-4 w-4" />;
  if (normalized.includes("phone")) return <Phone className="h-4 w-4" />;
  if (normalized.includes("preferred") || normalized.includes("timezone") || normalized.includes("best time")) return <CalendarDays className="h-4 w-4" />;
  if (normalized.includes("source") || normalized.includes("type")) return <Tag className="h-4 w-4" />;
  if (normalized.includes("contacted") || normalized.includes("close") || normalized.includes("due")) return <CalendarDays className="h-4 w-4" />;
  if (normalized.includes("assigned")) return <UserCheck className="h-4 w-4" />;
  if (normalized.includes("value")) return <CircleDollarSign className="h-4 w-4" />;
  if (normalized.includes("probability")) return <Percent className="h-4 w-4" />;
  if (normalized.includes("domain")) return <Globe2 className="h-4 w-4" />;
  return <Building2 className="h-4 w-4" />;
}

function daysSince(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

export function RecordDetailClient({ kind, id }: { kind: RecordKind; id: string }) {
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: contacts, isLoading: contactsLoading } = useContacts();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: notes, isLoading: notesLoading } = useNotes();
  const { data: activities, isLoading: activitiesLoading } = useActivities();

  const isLoading =
    companiesLoading ||
    leadsLoading ||
    dealsLoading ||
    contactsLoading ||
    tasksLoading ||
    notesLoading ||
    activitiesLoading;

  const company = companies?.find((item) => item.id === id);
  const lead = leads?.find((item) => item.id === id);
  const deal = deals?.find((item) => item.id === id);
  const contact = contacts?.find((item) => item.id === id);
  const task = tasks?.find((item) => item.id === id);

  const record =
    kind === "companies"
      ? company
      : kind === "leads"
        ? lead
        : kind === "deals"
          ? deal
          : kind === "contacts"
            ? contact
            : task;

  if (isLoading) {
    return <RecordDetailSkeleton />;
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <BackLink kind={kind} />
        <EmptyState title={`${recordLabel[kind]} not found`} description="The record may have been deleted or is outside your current access." />
      </div>
    );
  }

  const companyForRecord =
    kind === "companies"
      ? company
      : companies?.find((item) =>
          companyMatches(
            item,
            "company" in record ? String(record.company) : null,
            "company_id" in record ? String(record.company_id ?? "") : null,
          ),
        );
  const companyName =
    kind === "companies"
      ? company?.name
      : "company" in record
        ? String(record.company)
        : companyForRecord?.name;

  const relatedLeads = (leads ?? []).filter((item) => item.company === companyName || item.company_id === companyForRecord?.id);
  const relatedDeals = (deals ?? []).filter((item) => item.company === companyName || item.company_id === companyForRecord?.id);
  const relatedContacts = (contacts ?? []).filter((item) => item.company === companyName || item.company_id === companyForRecord?.id);
  const relatedTasks = (tasks ?? []).filter((item) => {
    if (kind === "tasks") return item.id === id;
    if (item.related_id === id) return true;
    if (kind === "companies") return relatedLeads.some((leadItem) => leadItem.id === item.related_id) || relatedDeals.some((dealItem) => dealItem.id === item.related_id);
    return false;
  });
  const relatedNotes = (notes ?? []).filter((item) => {
    if (item.related_id === id) return true;
    if (kind === "companies") return relatedLeads.some((leadItem) => leadItem.id === item.related_id) || relatedDeals.some((dealItem) => dealItem.id === item.related_id);
    return false;
  });

  const timeline = buildTimeline({
    kind,
    id,
    lead,
    deal,
    contact,
    task,
    companyName,
    notes: relatedNotes,
    tasks: relatedTasks,
    activities: activities ?? [],
    relatedLeads,
    relatedDeals,
    relatedContacts,
  });

  return (
    <div className="space-y-5">
      <BackLink kind={kind} />
      <RecordHeader kind={kind} record={record} companyName={companyName} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {kind === "companies" ? (
            <CompanyRelations contacts={relatedContacts} leads={relatedLeads} deals={relatedDeals} notes={relatedNotes} tasks={relatedTasks} />
          ) : (
            <RecordSummary kind={kind} record={record} company={companyForRecord} />
          )}
          <Timeline items={timeline} />
        </div>
        <SidePanel
          contacts={relatedContacts}
          leads={relatedLeads}
          deals={relatedDeals}
          tasks={relatedTasks}
          notes={relatedNotes}
          currentKind={kind}
          currentId={id}
        />
      </div>
    </div>
  );
}

function BackLink({ kind }: { kind: RecordKind }) {
  return (
    <Link href={backHref[kind]} className="inline-flex items-center gap-2 text-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary">
      <ArrowLeft className="h-4 w-4" />
      Back to {recordLabel[kind].toLowerCase()}s
    </Link>
  );
}

function RecordHeader({ kind, record, companyName }: { kind: RecordKind; record: Company | Lead | Deal | Contact | Task; companyName?: string }) {
  const title =
    kind === "companies"
      ? (record as Company).name
      : kind === "leads" || kind === "contacts"
        ? (record as Lead | Contact).full_name
        : (record as Deal | Task).title;
  const status =
    kind === "leads"
      ? (record as Lead).status
      : kind === "deals"
        ? (record as Deal).stage
        : kind === "tasks"
          ? (record as Task).status
          : null;
  return (
    <div className="rounded-lg border border-border bg-white p-5 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{recordLabel[kind]}</p>
          <h1 className="mt-1 text-3xl font-semibold">{title}</h1>
          {companyName && kind !== "companies" ? <p className="mt-2 text-sm text-muted">{companyName}</p> : null}
        </div>
        {status ? <StatusBadge status={status} /> : null}
      </div>
    </div>
  );
}

function RecordSummary({ kind, record, company }: { kind: RecordKind; record: Lead | Deal | Contact | Task | Company; company?: Company }) {
  const rows: Array<{ label: string; value: string; clamp?: boolean }> = [];
  if (kind === "leads") {
    const lead = record as Lead;
    rows.push(
      { label: "Lead name", value: lead.full_name },
      { label: "Company", value: lead.company },
      { label: "Email", value: lead.email },
      { label: "Phone", value: lead.phone },
      { label: "Status", value: lead.status },
      { label: "Source", value: lead.lead_source },
      { label: "Last contacted", value: shortDate(lead.last_contacted) },
      { label: "Assigned sales rep", value: lead.assigned_user ?? "Unassigned" },
      { label: "Lead notes", value: lead.notes ?? "No notes recorded", clamp: true },
      { label: "Created by", value: lead.created_by_user ?? lead.assigned_user ?? "Not recorded" },
      { label: "Created at", value: shortDateTime(lead.created_at) },
      { label: "Updated at", value: shortDateTime(lead.updated_at ?? lead.created_at) },
    );
  }
  if (kind === "deals") {
    const deal = record as Deal;
    rows.push(
      { label: "Deal title", value: deal.title },
      { label: "Company", value: deal.company },
      { label: "Products/services", value: deal.products_services ?? "Not specified", clamp: true },
      { label: "Value", value: currency(deal.value) },
      { label: "Probability", value: `${deal.probability}%` },
      { label: "Stage", value: deal.stage },
      { label: "Forecast category", value: deal.forecast_category ?? "Pipeline" },
      { label: "Manager review", value: deal.review_status ?? "Not Required" },
      { label: "Stage age", value: `${daysSince(deal.stage_changed_at ?? deal.created_at)} days` },
      { label: "Stage changed at", value: shortDateTime(deal.stage_changed_at ?? deal.created_at) },
      { label: "Expected close", value: shortDate(deal.expected_close_date) },
      { label: "Next step", value: deal.next_step_date ? `${deal.next_step ?? "No next step"} on ${shortDate(deal.next_step_date)}` : (deal.next_step ?? "No next step") },
      { label: "Assigned sales rep", value: deal.assigned_user ?? "Unassigned" },
      { label: "Created by", value: deal.created_by_user ?? deal.assigned_user ?? "Not recorded" },
      { label: "Created at", value: shortDateTime(deal.created_at) },
      { label: "Updated at", value: shortDateTime(deal.updated_at ?? deal.created_at) },
    );
    if (deal.stage === "Lost") {
      rows.push({ label: "Loss reason", value: deal.loss_reason ?? "No loss reason recorded" });
    }
  }
  if (kind === "contacts") {
    const contact = record as Contact;
    rows.push(
      { label: "Title", value: contact.title ?? "No title" },
      { label: "Company", value: contact.company },
      { label: "Email", value: contact.email },
      { label: "Phone", value: contact.phone },
      { label: "Preferred contact", value: contact.preferred_contact_method ?? "Email" },
      { label: "Timezone", value: contact.timezone ?? "Asia/Manila" },
      { label: "Best time to contact", value: contact.best_time_to_contact ?? "9:00 AM - 5:00 PM" },
      { label: "Assigned sales rep", value: contact.assigned_user ?? "Unassigned" },
      { label: "Created by", value: contact.created_by_user ?? contact.assigned_user ?? "Not recorded" },
      { label: "Created at", value: shortDateTime(contact.created_at) },
      { label: "Updated at", value: shortDateTime(contact.updated_at ?? contact.created_at) },
    );
  }
  if (kind === "tasks") {
    const task = record as Task;
    rows.push(
      { label: "Due date", value: shortDate(task.due_date ?? task.created_at) },
      { label: "Assigned sales rep", value: task.assigned_user ?? "Unassigned" },
      { label: "Related type", value: task.related_type ?? "General" },
    );
  }
  if (company) {
    rows.push({ label: "Company domain", value: company.domain ?? "No domain" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex gap-3 rounded-lg border border-border bg-slate-50 p-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                <FieldIcon label={row.label} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted">{row.label}</p>
                <p className={`mt-1 break-words text-sm font-semibold ${row.clamp ? "line-clamp-1" : ""}`} title={row.value}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>
        {kind === "leads" || kind === "deals" ? (
          <p className="mt-4 text-xs text-muted">
            Leads track buyer qualification details. Deals track revenue, probability, and close timing after the opportunity is real.
          </p>
        ) : null}
        {"description" in record && record.description ? <p className="mt-4 text-sm text-muted">{record.description}</p> : null}
      </CardContent>
    </Card>
  );
}

function CompanyRelations({ contacts, leads, deals, notes, tasks }: { contacts: Contact[]; leads: Lead[]; deals: Deal[]; notes: Note[]; tasks: Task[] }) {
  const openPipeline = deals.filter((deal) => deal.stage !== "Won" && deal.stage !== "Lost").reduce((sum, deal) => sum + deal.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Workspace</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          <Metric label="Contacts" value={contacts.length.toLocaleString()} icon={<UsersRound className="h-4 w-4" />} />
          <Metric label="Leads" value={leads.length.toLocaleString()} icon={<UserRound className="h-4 w-4" />} />
          <Metric label="Deals" value={deals.length.toLocaleString()} icon={<BriefcaseBusiness className="h-4 w-4" />} />
          <Metric label="Open pipeline" value={currency(openPipeline)} icon={<CircleDollarSign className="h-4 w-4" />} />
          <Metric label="Follow-ups" value={tasks.filter((task) => task.status !== "Done").length.toLocaleString()} icon={<CheckSquare className="h-4 w-4" />} />
        </div>
        {notes.length ? <p className="mt-4 text-sm text-muted">{notes[0].body}</p> : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-slate-50 p-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="mt-1 break-words text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-lg border border-border bg-white p-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
                  <TimelineIcon type={item.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.type} />
                    <p className="font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5" />
                    {item.date ? shortDateTime(item.date) : "No date recorded"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No activity yet" description="Calls, notes, tasks, emails, and movement will appear here." />
        )}
      </CardContent>
    </Card>
  );
}

function SidePanel({
  contacts,
  leads,
  deals,
  tasks,
  notes,
  currentKind,
  currentId,
}: {
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  tasks: Task[];
  notes: Note[];
  currentKind: RecordKind;
  currentId: string;
}) {
  return (
    <div className="space-y-4">
      <RelatedCard title="Contacts" icon={<UsersRound className="h-4 w-4" />} items={contacts} path="contacts" currentKind={currentKind} currentId={currentId} />
      <RelatedCard title="Leads" icon={<UserRound className="h-4 w-4" />} items={leads} path="leads" currentKind={currentKind} currentId={currentId} />
      <RelatedCard title="Deals" icon={<BriefcaseBusiness className="h-4 w-4" />} items={deals} path="deals" currentKind={currentKind} currentId={currentId} />
      <RelatedCard title="Tasks" icon={<CheckSquare className="h-4 w-4" />} items={tasks} path="tasks" currentKind={currentKind} currentId={currentId} />
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {notes.length ? (
            <div className="space-y-2">
              {notes.slice(0, 4).map((note) => (
                <p key={note.id} className="rounded-lg border border-border bg-slate-50 p-3 text-sm text-muted">{note.body}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">No notes linked yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RelatedCard({
  title,
  icon,
  items,
  path,
  currentKind,
  currentId,
}: {
  title: string;
  icon: ReactNode;
  items: Array<Lead | Deal | Contact | Task>;
  path: "leads" | "deals" | "contacts" | "tasks";
  currentKind: RecordKind;
  currentId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => {
              const titleText = "full_name" in item ? item.full_name : item.title;
              const isCurrent = currentKind === path && currentId === item.id;
              return isCurrent ? (
                <div key={item.id} className="rounded-lg border border-border bg-slate-50 p-3 text-sm font-medium">{titleText}</div>
              ) : (
                <Link key={item.id} href={entityPath(path, item.id)} className="block rounded-lg border border-border bg-white p-3 text-sm font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:border-primary hover:bg-blue-50 hover:decoration-primary">
                  {titleText}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">No related {title.toLowerCase()}.</p>
        )}
      </CardContent>
    </Card>
  );
}

function buildTimeline({
  kind,
  id,
  lead,
  deal,
  contact,
  task,
  companyName,
  notes,
  tasks,
  activities,
  relatedLeads,
  relatedDeals,
  relatedContacts,
}: {
  kind: RecordKind;
  id: string;
  lead?: Lead;
  deal?: Deal;
  contact?: Contact;
  task?: Task;
  companyName?: string;
  notes: Note[];
  tasks: Task[];
  activities: Activity[];
  relatedLeads: Lead[];
  relatedDeals: Deal[];
  relatedContacts: Contact[];
}) {
  const items: TimelineItem[] = [];
  const scopeIds = new Set([id, ...relatedLeads.map((item) => item.id), ...relatedDeals.map((item) => item.id), ...relatedContacts.map((item) => item.id), ...tasks.map((item) => item.id)]);

  for (const note of notes) {
    items.push({ id: `note-${note.id}`, type: "Note", title: "Note added", detail: note.body, date: note.created_at });
  }
  for (const item of tasks) {
    items.push({
      id: `task-${item.id}`,
      type: "Task",
      title: item.title,
      detail: `${item.status} follow-up due ${shortDate(item.due_date ?? item.created_at)}.`,
      date: item.due_date ?? item.created_at,
    });
  }
  for (const item of relatedLeads) {
    if (item.last_contacted) {
      items.push({ id: `call-${item.id}`, type: "Call", title: `Call with ${item.full_name}`, detail: item.notes ?? `Last contacted ${item.full_name}.`, date: item.last_contacted });
    }
    items.push({ id: `lead-email-${item.id}`, type: "Email", title: `Email touchpoint for ${item.full_name}`, detail: item.email, date: item.created_at });
    items.push({ id: `lead-status-${item.id}`, type: "Status", title: `Lead status: ${item.status}`, detail: `${item.full_name} is currently ${item.status}.`, date: item.created_at });
  }
  for (const item of relatedContacts) {
    items.push({ id: `contact-email-${item.id}`, type: "Email", title: `Contact email for ${item.full_name}`, detail: item.email, date: item.created_at });
  }
  for (const item of relatedDeals) {
    items.push({ id: `deal-stage-${item.id}`, type: "Stage", title: `Deal stage: ${item.stage}`, detail: `${item.title} has been in this stage for ${daysSince(item.stage_changed_at ?? item.created_at)} days.`, date: item.stage_changed_at ?? item.created_at });
    if (item.next_step) {
      items.push({ id: `deal-next-${item.id}`, type: "Task", title: `Next step: ${item.next_step}`, detail: item.next_step_date ? `Due ${shortDate(item.next_step_date)}.` : "No due date recorded.", date: item.next_step_date ?? item.created_at });
    }
  }
  if (contact) {
    items.push({ id: `contact-phone-${contact.id}`, type: "Call", title: `Phone contact for ${contact.full_name}`, detail: contact.phone, date: contact.created_at });
  }
  if (task) {
    items.push({ id: `task-created-${task.id}`, type: "Task", title: "Task created", detail: task.description ?? task.title, date: task.created_at });
  }

  for (const activity of activities) {
    const activityCompany = metadataText(activity, "company");
    const activityTitle = metadataText(activity, "title");
    const relatedToCompany = kind === "companies" && companyName && activityCompany === companyName;
    const relatedToCurrent =
      isSameRecord(activity, singularEntity[kind], id) ||
      scopeIds.has(activity.entity_id ?? "") ||
      (deal && activityTitle === deal.title) ||
      (lead && activityTitle === lead.full_name) ||
      (companyName && activityCompany === companyName);
    if (!relatedToCurrent && !relatedToCompany) continue;
    const activityType = metadataText(activity, "activity_type") as TimelineItem["type"] | "";
    const subject = metadataText(activity, "subject");
    const body = metadataText(activity, "body");
    const outcome = metadataText(activity, "outcome");
    const scheduledAt = metadataText(activity, "scheduled_at");
    const type = activityType || (activity.action.toLowerCase().includes("moved") ? "Stage" : "Activity");
    items.push({
      id: `activity-${activity.id}`,
      type,
      title: subject || activity.action,
      detail: subject
        ? `${body}${outcome ? ` Outcome: ${outcome}.` : ""}`
        : activityTitle || activityCompany
          ? `${activityTitle || recordLabel[kind]} ${activityCompany ? `for ${activityCompany}` : ""}`
          : `${activity.entity_type} update recorded.`,
      date: scheduledAt || activity.created_at,
    });
  }

  return sortByDate(items);
}

export function RecordDetailSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-5 w-36" />
      <div className="rounded-lg border border-border bg-white p-5 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex gap-3 rounded-lg border border-border bg-slate-50 p-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-36 max-w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex gap-3 rounded-lg border border-border bg-white p-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
