"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Factory,
  Mail,
  Loader2,
  MoreHorizontal,
  NotebookText,
  Pencil,
  Phone,
  Plus,
  StickyNote,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { AnalyticsCharts } from "@/components/charts/analytics-charts";
import { PipelineBoard } from "@/components/deals/pipeline-board";
import { LeadForm } from "@/components/forms/lead-form";
import {
  CompanyForm,
  ContactForm,
  DealForm,
  NoteForm,
  TaskForm,
} from "@/components/forms/resource-forms";
import { LeadsTable } from "@/components/tables/leads-table";
import { TaskBoard } from "@/components/tasks/task-board";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useActivities,
  useCompanies,
  useContacts,
  useDeals,
  useLeads,
  useMe,
  useMetrics,
  useNotes,
  useSalesReps,
} from "@/hooks/use-crm";
import { shortDate, shortDateTime } from "@/lib/utils";
import { mutateJson } from "@/services/fetcher";
import { useUiStore } from "@/store/ui-store";
import type { Deal, Lead } from "@/types/crm";

export function LeadsPageClient() {
  const [open, setOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const { data, isLoading } = useLeads();
  const { data: deals } = useDeals();
  const { data: me } = useMe();
  const { mutate } = useSWRConfig();
  const isManager = me?.role === "sales_manager";
  const convertingDeal = useMemo(() => {
    if (!convertingLead) return null;
    return (
      deals?.find(
        (deal) =>
          deal.company === convertingLead.company &&
          deal.stage !== "Won" &&
          deal.stage !== "Lost",
      ) ?? null
    );
  }, [convertingLead, deals]);

  async function handleDeleteLead(id: string) {
    setDeletePending(true);
    try {
      await mutateJson("/api/leads", "DELETE", { id });
      await mutate("/api/leads", (current: Lead[] | undefined) => current?.filter((lead) => lead.id !== id), { revalidate: false });
      await mutate("/api/leads");
      toast.success("Lead deleted.");
      setDeletingLead(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete lead.");
    } finally {
      setDeletePending(false);
    }
  }

  async function handleLeadConverted(lead: Lead, savedDeal?: Record<string, unknown>) {
    setConvertingLead(null);
    try {
      const convertedStatus = "Proposal" as const;
      const updatedLead = await mutateJson<Lead>("/api/leads", "PATCH", { id: lead.id, status: convertedStatus });
      await mutate(
        "/api/leads",
        (current: Lead[] | undefined) =>
          current?.map((item) => (item.id === lead.id ? { ...item, ...updatedLead, status: convertedStatus } : item)),
        { revalidate: false },
      );
      if (savedDeal?.id) {
        await mutate(
          "/api/deals",
          (current: Deal[] | undefined) => {
            const alreadyExists = current?.some((deal) => deal.id === savedDeal.id);
            if (alreadyExists) return current;
            return [{ ...(savedDeal as Deal) }, ...(current ?? [])];
          },
          { revalidate: false },
        );
      }
      await Promise.all([mutate("/api/leads"), mutate("/api/deals"), mutate("/api/metrics")]);
      toast.success("Lead converted to deal.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deal was created, but the lead status was not updated.");
    }
  }

  function defaultCloseDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Leads</h1>
          <p className="mt-1 text-muted">
            Leads are potential buyers or opportunities you are still qualifying. Assign a sales rep, update status, and turn qualified interest into a deal.
          </p>
        </div>
        {isManager ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        ) : null}
      </div>
      <LeadsTable leads={data} isLoading={isLoading} onEdit={setEditingLead} onDelete={isManager ? setDeletingLead : undefined} onConvert={isManager ? setConvertingLead : undefined} />
      <Modal open={open} title="Create lead" onClose={() => setOpen(false)}>
        <LeadForm onDone={() => setOpen(false)} />
      </Modal>
      <Modal open={Boolean(editingLead)} title="Edit lead" onClose={() => setEditingLead(null)}>
        {editingLead ? (
          <LeadForm
            mode="edit"
            id={editingLead.id}
            onDone={() => setEditingLead(null)}
            initialValues={{
              full_name: editingLead.full_name,
              company: editingLead.company,
              email: editingLead.email,
              phone: editingLead.phone,
              status: editingLead.status,
              lead_source: editingLead.lead_source,
              assigned_to: editingLead.assigned_to ?? null,
              notes: editingLead.notes ?? "",
            }}
          />
        ) : null}
      </Modal>
      <Modal open={Boolean(deletingLead)} title="Delete lead" onClose={() => setDeletingLead(null)}>
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This action will remove the lead immediately. You can create it again later if needed.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDeletingLead(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deletePending}
              onClick={() => (deletingLead?.id ? handleDeleteLead(deletingLead.id) : null)}
            >
              {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal open={Boolean(convertingLead)} title="Convert lead to deal" onClose={() => setConvertingLead(null)}>
        {convertingLead ? (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              {convertingDeal
                ? "Update the existing open deal for this qualified lead. It will move to Proposal after saving."
                : "Create a deal from this qualified lead. The new deal will appear in Proposal after saving."}
            </p>
            <DealForm
              mode={convertingDeal ? "edit" : "create"}
              id={convertingDeal?.id}
              onDone={(savedDeal) => {
                void handleLeadConverted(convertingLead, savedDeal);
              }}
              initialValues={{
                title: convertingDeal?.title ?? `${convertingLead.company} Opportunity`,
                company: convertingDeal?.company ?? convertingLead.company,
                products_services: convertingDeal?.products_services ?? "SalesPro CRM subscription and onboarding",
                value: convertingDeal?.value ?? 0,
                stage: "Proposal Sent",
                loss_reason: convertingDeal?.loss_reason ?? "",
                next_step: convertingDeal?.next_step ?? "Send proposal follow-up",
                next_step_date: convertingDeal?.next_step_date ?? defaultCloseDate(),
                assigned_to: convertingDeal?.assigned_to ?? convertingLead.assigned_to ?? null,
                expected_close_date: convertingDeal?.expected_close_date ?? defaultCloseDate(),
              }}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export function DealsPageClient() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Deal Pipeline</h1>
        <p className="mt-1 text-muted">
          Create a deal when a qualified lead becomes a real opportunity. Move it through stages to update close probability automatically.
        </p>
      </div>
      <PipelineBoard />
    </div>
  );
}

export function AnalyticsPageClient() {
  const { data, isLoading } = useMetrics();
  if (isLoading || !data) return <Skeleton className="h-[680px] rounded-xl" />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-1 text-muted">
          Use revenue, conversion, source, and rep performance charts to spot pipeline gaps and coaching opportunities.
        </p>
      </div>
      <AnalyticsCharts metrics={data} />
    </div>
  );
}

export function ContactsPageClient() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useContacts();
  const { data: me } = useMe();
  const isManager = me?.role === "sales_manager";
  return (
    <>
      <SimpleList
        resource="contacts"
        title="Contacts"
        subtitle="Contacts are known stakeholders tied to companies. Keep decision-makers and long-term buyer details organized here."
        data={data}
        isLoading={isLoading}
        onAdd={isManager ? () => setOpen(true) : undefined}
        canDeleteRecords={isManager}
      />
      <Modal open={open} title="Create contact" onClose={() => setOpen(false)}>
        <ContactForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function CompaniesPageClient() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useCompanies();
  return (
    <>
      <SimpleList
        resource="companies"
        title="Companies"
        subtitle="Create companies first so leads, contacts, and deals can be connected to the right account."
        data={data}
        isLoading={isLoading}
        onAdd={() => setOpen(true)}
      />
      <Modal open={open} title="Create company" onClose={() => setOpen(false)}>
        <CompanyForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function ActivitiesPageClient() {
  const { data, isLoading } = useActivities();
  const { mutate } = useSWRConfig();

  async function clearAll() {
    try {
      await mutateJson("/api/activities", "DELETE", {});
      await mutate("/api/activities", [], { revalidate: false });
      toast.success("Notifications cleared.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to clear notifications.",
      );
    }
  }

  return (
    <SimpleList
      resource="notifications"
      title="Notifications"
      subtitle="Review sales activity updates. Click a notification to mark it as read without deleting the history."
      data={data}
      isLoading={isLoading}
      onClear={data?.length ? clearAll : undefined}
    />
  );
}

export function TasksPageClient() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Tasks</h1>
          <p className="mt-1 text-muted">Turn follow-ups into owner-based work. Drag tasks across statuses as reps complete the next steps.</p>
        </div>
        <TaskBoard onAdd={() => setOpen(true)} />
      </div>
      <Modal open={open} title="Create task" onClose={() => setOpen(false)}>
        <TaskForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function NotesPageClient() {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useNotes();
  return (
    <>
      <SimpleList
        resource="notes"
        title="Notes"
        subtitle="Capture call context, objections, next steps, and decision details across leads, contacts, and deals."
        data={data}
        isLoading={isLoading}
        onAdd={() => setOpen(true)}
      />
      <Modal open={open} title="Create note" onClose={() => setOpen(false)}>
        <NoteForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

export function SimpleList({
  resource,
  title,
  subtitle,
  data,
  isLoading,
  onAdd,
  onClear,
  canDeleteRecords,
}: {
  resource: "companies" | "contacts" | "tasks" | "notes" | "notifications";
  title: string;
  subtitle: string;
  data?: Array<Record<string, unknown>>;
  isLoading?: boolean;
  onAdd?: () => void;
  onClear?: () => void;
  canDeleteRecords?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const { data: reps } = useSalesReps();
  const globalSearch = useUiStore((state) => state.search);
  const [repFilter, setRepFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const isManager = me?.role === "sales_manager";
  const statuses = useMemo(() => {
    if (resource !== "tasks") return [];
    return Array.from(new Set((data ?? []).map((item) => String(item.status ?? "")).filter(Boolean))).sort();
  }, [data, resource]);
  const canDelete =
    (canDeleteRecords ?? true) &&
    (resource === "companies" ||
      resource === "contacts" ||
      resource === "tasks" ||
      resource === "notes" ||
      resource === "notifications");
  const [editingItem, setEditingItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [deletingItem, setDeletingItem] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const visibleData = useMemo(() => {
    const items = data ?? [];
    const terms = globalSearch.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((item) => {
      const haystack = Object.values(item)
        .map((value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          return String(value);
        })
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .filter((item) => (repFilter ? item.assigned_to === repFilter : true))
    .filter((item) => (statusFilter ? item.status === statusFilter : true));
  }, [data, globalSearch, repFilter, statusFilter]);

  async function handleDelete(id: string) {
    setDeletePending(true);
    try {
      const endpoint =
        resource === "notifications" ? "/api/activities" : `/api/${resource}`;
      await mutateJson(endpoint, "DELETE", { id });
      await mutate(
        endpoint,
        (current: Array<Record<string, unknown>> | undefined) =>
          current?.filter((item) => item.id !== id),
        { revalidate: false },
      );
      await mutate(endpoint);
      toast.success("Deleted.");
      setDeletingItem(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete.");
    } finally {
      setDeletePending(false);
    }
  }

  function renderEditForm() {
    if (!editingItem) return null;
    const id = String(editingItem.id ?? "");
    const done = () => setEditingItem(null);
    if (resource === "companies") {
      return (
        <CompanyForm
          mode="edit"
          id={id}
          onDone={done}
          initialValues={{
            name: String(editingItem.name ?? ""),
            domain: String(editingItem.domain ?? ""),
            industry: String(editingItem.industry ?? ""),
            size: String(editingItem.size ?? ""),
          }}
        />
      );
    }
    if (resource === "contacts") {
      return (
        <ContactForm
          mode="edit"
          id={id}
          onDone={done}
          initialValues={{
            full_name: String(editingItem.full_name ?? ""),
            company: String(editingItem.company ?? ""),
            email: String(editingItem.email ?? ""),
            phone: String(editingItem.phone ?? ""),
            title: String(editingItem.title ?? ""),
            preferred_contact_method: String(editingItem.preferred_contact_method ?? "Email") as "Email" | "Phone" | "No preference",
            timezone: String(editingItem.timezone ?? "Asia/Manila"),
            best_time_to_contact: String(editingItem.best_time_to_contact ?? "9:00 AM - 5:00 PM"),
            avatar_url:
              typeof editingItem.avatar_url === "string"
                ? editingItem.avatar_url
                : "",
            assigned_to:
              typeof editingItem.assigned_to === "string"
                ? editingItem.assigned_to
                : null,
          }}
        />
      );
    }
    if (resource === "tasks") {
      return (
        <TaskForm
          mode="edit"
          id={id}
          onDone={done}
          initialValues={{
            title: String(editingItem.title ?? ""),
            description: String(editingItem.description ?? ""),
            status: String(editingItem.status ?? "Todo") as
              | "Todo"
              | "In Progress"
              | "Done",
            due_date: String(editingItem.due_date ?? ""),
            assigned_to:
              typeof editingItem.assigned_to === "string"
                ? editingItem.assigned_to
                : null,
          }}
        />
      );
    }
    if (resource === "notes") {
      return (
        <NoteForm
          mode="edit"
          id={id}
          onDone={done}
          initialValues={{
            body: String(editingItem.body ?? ""),
            related_type: String(editingItem.related_type ?? "general"),
            related_id:
              typeof editingItem.related_id === "string"
                ? editingItem.related_id
                : null,
          }}
        />
      );
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-2">
            {isManager && (resource === "contacts" || resource === "tasks") ? (
              <select value={repFilter} onChange={(event) => setRepFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
                <option value="">Any rep</option>
                {(reps ?? []).map((rep) => (
                  <option key={rep.id} value={rep.id}>{rep.full_name}</option>
                ))}
              </select>
            ) : null}
            {resource === "tasks" ? (
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
                <option value="">Any status</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            ) : null}
            {onClear ? (
              <Button
                size="sm"
                variant="danger"
                className="bg-red-50 text-red-700 hover:bg-red-100"
                onClick={() => setConfirmingClear(true)}
              >
                Clear
              </Button>
            ) : null}
            {onAdd ? (
              <Button size="sm" onClick={onAdd}>
                <Plus className="h-4 w-4" />
                {resource === "notifications" ? "Log" : "Add"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ResourceSkeletonGrid resource={resource} />
          ) : visibleData.length ? (
            <div
              className={
                resource === "companies" ||
                resource === "contacts" ||
                resource === "tasks" ||
                resource === "notes"
                  ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
                  : resource === "notifications"
                    ? "space-y-2"
                  : "divide-y divide-border"
              }
            >
              {visibleData.map((item, index) => (
                <ResourceItem
                  key={String(item.id ?? index)}
                  resource={resource}
                  item={item}
                  canDelete={canDelete}
                  onEdit={setEditingItem}
                  onDelete={setDeletingItem}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={`No ${title.toLowerCase()}`}
              description="Create your first record to start building a complete CRM history."
            />
          )}
        </CardContent>
      </Card>
      <Modal
        open={Boolean(editingItem)}
        title={`Edit ${title.slice(0, -1).toLowerCase()}`}
        onClose={() => setEditingItem(null)}
      >
        {renderEditForm()}
      </Modal>
      <Modal
        open={Boolean(deletingItem)}
        title="Delete record"
        onClose={() => setDeletingItem(null)}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This action will remove the record immediately. You can create it
            again later if needed.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeletingItem(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deletePending}
              onClick={() =>
                deletingItem?.id ? handleDelete(String(deletingItem.id)) : null
              }
            >
              {deletePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {deletePending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={confirmingClear}
      title="Clear notifications"
        onClose={() => setConfirmingClear(false)}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This will remove all notifications from the list.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmingClear(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                setConfirmingClear(false);
                onClear?.();
              }}
            >
              Clear notifications
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ResourceSkeletonGrid({
  resource,
}: {
  resource: "companies" | "contacts" | "tasks" | "notes" | "notifications";
}) {
  if (resource === "notifications") {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between"
          >
            <div className="flex min-w-0 items-start gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-80 max-w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-14 rounded-full" />
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => {
        if (resource === "contacts") return <ContactCardSkeleton key={index} />;
        if (resource === "companies")
          return <CompanyCardSkeleton key={index} />;
        if (resource === "notes") return <NoteCardSkeleton key={index} />;
        return <TaskCardSkeleton key={index} />;
      })}
    </div>
  );
}

function SkeletonAction() {
  return <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />;
}

function ContactCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
          <div className="min-w-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-44" />
          </div>
        </div>
        <SkeletonAction />
      </div>
      <div className="mt-5 space-y-2 border-t border-border pt-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function CompanyCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        </div>
        <SkeletonAction />
      </div>
      <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32 sm:col-span-2" />
      </div>
    </div>
  );
}

function TaskCardSkeleton() {
  return (
    <div className="min-h-[196px] rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="mt-4 h-4 w-40" />
            <Skeleton className="mt-3 h-3 w-56 max-w-full" />
          </div>
        </div>
        <SkeletonAction />
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

function NoteCardSkeleton() {
  return (
    <div className="min-h-[158px] rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="mt-4 h-4 w-56 max-w-full" />
          </div>
        </div>
        <SkeletonAction />
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

function ResourceCardActions({
  id,
  label,
  item,
  canDelete,
  onEdit,
  onDelete,
}: {
  id: string;
  label: string;
  item: Record<string, unknown>;
  canDelete: boolean;
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
}) {
  const [open, setOpen] = useState(false);
  if (!id) return null;

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label={`${label} actions`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-11 z-20 w-36 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-[0_16px_35px_rgba(17,24,39,0.14)]">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit(item);
            }}
            className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-blue-50 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete(item);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ResourceItem({
  resource,
  item,
  canDelete,
  onEdit,
  onDelete,
}: {
  resource: "companies" | "contacts" | "tasks" | "notes" | "notifications";
  item: Record<string, unknown>;
  canDelete: boolean;
  onEdit: (item: Record<string, unknown>) => void;
  onDelete: (item: Record<string, unknown>) => void;
}) {
  const id = String(item.id ?? "");
  const readActivityIds = useUiStore((state) => state.readActivityIds);
  const markActivityRead = useUiStore((state) => state.markActivityRead);

  if (resource === "companies") {
    return (
      <div className="min-h-[176px] rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">
                <Link href={`/companies/${id}`} className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">
                  {String(item.name ?? "Company")}
                </Link>
              </h3>
              <p className="mt-1 text-sm text-muted">
                {String(item.domain ?? "No domain")}
              </p>
            </div>
          </div>
          <ResourceCardActions id={id} label="Company" item={item} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="mt-4 grid gap-2 border-t border-border pt-4 text-sm text-muted sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Factory className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">Industry:</span>{" "}
              {String(item.industry ?? "Not set")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-primary" />
            <span>
              <span className="font-medium text-foreground">Size:</span>{" "}
              {String(item.size ?? "Not set")}
            </span>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />
          Added {shortDate(String(item.created_at ?? ""))}
        </div>
      </div>
    );
  }

  if (resource === "contacts") {
    const name = String(item.full_name ?? "Contact");
    const avatarUrl =
      typeof item.avatar_url === "string" ? item.avatar_url : "";
    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "CO";
    return (
      <div className="rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-semibold text-primary">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">
                <Link href={`/contacts/${id}`} className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">{name}</Link>
              </h3>
              <p className="mt-1 text-sm text-muted">
                {String(item.title ?? "No title")} at{" "}
                {String(item.company ?? "No company")}
              </p>
            </div>
          </div>
          <ResourceCardActions id={id} label="Contact" item={item} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {String(item.email ?? "No email")}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            {String(item.phone ?? "No phone")}
          </div>
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Assigned sales rep: {String(item.assigned_user ?? "Unassigned")}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Prefers {String(item.preferred_contact_method ?? "Email")} - {String(item.best_time_to_contact ?? "9:00 AM - 5:00 PM")}
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Timezone: {String(item.timezone ?? "Asia/Manila")}
          </div>
        </div>
      </div>
    );
  }

  if (resource === "tasks") {
    const status = String(item.status ?? "Todo");
    const statusTone =
      status === "Done"
        ? "bg-emerald-50 text-emerald-700"
        : status === "In Progress"
          ? "bg-blue-50 text-primary"
          : "bg-orange-50 text-orange-700";
    return (
      <div className="min-h-[196px] rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <CheckSquare className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone}`}
              >
                {status === "Done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <CheckSquare className="h-3.5 w-3.5" />
                )}
                {status}
              </span>
              <h3 className="mt-4 line-clamp-1 font-semibold">
                <Link href={`/tasks/${id}`} className="text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary">{String(item.title ?? "Task")}</Link>
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {String(item.description ?? "No description")}
              </p>
            </div>
          </div>
          <ResourceCardActions id={id} label="Task" item={item} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />
          Due {shortDate(String(item.due_date ?? item.created_at ?? ""))}
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
          <UsersRound className="h-4 w-4" />
          Assigned sales rep: {String(item.assigned_user ?? "Unassigned")}
        </div>
      </div>
    );
  }

  if (resource === "notes") {
    const noteType =
      String(item.related_type ?? "general")
        .charAt(0)
        .toUpperCase() + String(item.related_type ?? "general").slice(1);
    return (
      <div className="min-h-[158px] rounded-xl border border-border bg-white p-4 shadow-[0_8px_22px_rgba(17,24,39,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
              <NotebookText className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <StatusBadge status={noteType} />
              <h3 className="mt-4 line-clamp-2 font-semibold">
                {String(item.body ?? "Note")}
              </h3>
            </div>
          </div>
          <ResourceCardActions id={id} label="Note" item={item} canDelete={canDelete} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
    );
  }

  if (resource === "notifications") {
    const isRead = readActivityIds.includes(id);
    const metadata = (
      item.metadata && typeof item.metadata === "object" ? item.metadata : {}
    ) as Record<string, unknown>;
    const title = String(item.action ?? "Notification").replace(/_/g, " ");
    const activityType = String(metadata.activity_type ?? "");
    const subject = String(metadata.subject ?? "");
    const body = String(metadata.body ?? "");
    const outcome = String(metadata.outcome ?? "");
    const scheduledAt = String(metadata.scheduled_at ?? "");
    const detail = subject
      ? `${subject}${scheduledAt ? ` scheduled for ${shortDateTime(scheduledAt)}` : ""}${outcome ? ` - ${outcome}` : ""}${body ? `: ${body}` : ""}`
      : metadata.title
        ? `${String(metadata.title)} for ${String(metadata.company ?? "unknown company")}${metadata.stage ? ` is now in ${String(metadata.stage)}` : ""}.`
        : `${String(item.entity_type ?? "Activity")} update recorded in the CRM.`;
    const ActivityIcon = activityType === "Email" ? Mail : activityType === "Call" ? Phone : activityType === "Meeting" || activityType === "Demo" ? CalendarDays : Bell;
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => id ? markActivityRead(id) : null}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && id) {
            event.preventDefault();
            markActivityRead(id);
          }
        }}
        className={`flex w-full cursor-pointer flex-col gap-4 text-left transition md:flex-row md:items-center md:justify-between ${
          isRead ? "rounded-xl border border-transparent px-5 py-5 opacity-75 hover:bg-slate-50" : "rounded-xl border border-blue-100 bg-blue-50/80 px-5 py-5 shadow-[0_10px_26px_rgba(37,99,235,0.08)] hover:bg-blue-50"
        }`}
      >
        <div className="flex min-w-0 items-start gap-4">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isRead ? "bg-slate-50 text-muted" : "bg-blue-50 text-primary"
          }`}>
            <ActivityIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 space-y-2">
            <div>
              <h3 className="font-semibold capitalize">{title}</h3>
              <p className="mt-1 text-sm text-muted">{detail}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <StatusBadge
                status={
                  String(item.entity_type ?? "system")
                    .charAt(0)
                    .toUpperCase() +
                  String(item.entity_type ?? "system").slice(1)
                }
              />
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {shortDateTime(String(item.created_at ?? ""))}
              </span>
            </div>
          </div>
        </div>
        {id ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(item);
            }}
          >
            Delete
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary">
          <StickyNote className="h-5 w-5" />
        </span>
        <div className="min-w-0 space-y-2">
          <div>
            <h3 className="truncate font-semibold">
              {String(
                item.full_name ??
                  item.title ??
                  item.body ??
                  item.action ??
                  "Activity",
              )}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted">
              {String(
                item.company ??
                  item.description ??
                  item.related_type ??
                  item.email ??
                  item.entity_type ??
                  "",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {shortDate(String(item.created_at ?? ""))}
            </span>
          </div>
        </div>
      </div>
      {canDelete && id ? (
        <Button
          type="button"
          variant="danger"
          size="icon"
          onClick={() => onDelete(item)}
          aria-label="Delete record"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
