"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { z } from "zod";
import { useSWRConfig } from "swr";
import { AlertCircle, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AssignedUserSelect } from "@/components/forms/assigned-user-select";
import { CompanySelect } from "@/components/forms/company-select";
import { PhoneField } from "@/components/forms/phone-field";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCompanies, useContacts, useDeals, useLeads, useMe } from "@/hooks/use-crm";
import { dealStageOptions } from "@/lib/pipeline-status";
import { mutateJson } from "@/services/fetcher";
import { activityLogSchema, companySchema, contactSchema, dealSchema, noteSchema, taskSchema } from "@/validations/crm";

type FormMode = "create" | "edit";

const timezoneOptions = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

function updateResourceCache<T extends Record<string, unknown>>(current: T[] | undefined, saved: T, mode: FormMode) {
  if (!current) return saved ? [saved] : current;
  if (mode === "edit") return current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item));
  return [saved, ...current];
}

function Required({ children }: { children: string }) {
  return <span>{children} <span className="text-red-500">*</span></span>;
}

function errorClass(message?: string) {
  return message ? "border-red-500 focus:border-red-500 focus:ring-red-100" : "";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
      {message}
    </div>
  );
}

function SaveLabel({ saving, label }: { saving: boolean; label: string }) {
  return (
    <>
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {saving ? "Saving..." : label}
    </>
  );
}

export function CompanyForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<z.input<typeof companySchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.input<typeof companySchema>>({ resolver: zodResolver(companySchema), defaultValues: { name: initialValues?.name ?? "", domain: initialValues?.domain ?? "", industry: initialValues?.industry ?? "", size: initialValues?.size ?? "" } });
  async function onSubmit(values: z.input<typeof companySchema>) {
    try {
      const saved = await mutateJson<Record<string, unknown>>("/api/companies", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...values, id } : values);
      await mutate("/api/companies", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      toast.success(mode === "edit" ? "Company updated." : "Company saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save company." });
    }
  }
  const errors = form.formState.errors;
  return (
    <form className="grid gap-4 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <label className="text-sm font-medium md:col-span-2"><Required>Company name</Required><Input className={`mt-2 ${errorClass(errors.name?.message)}`} placeholder="Acme Inc." {...form.register("name")} /><FieldError message={errors.name?.message} /></label>
      <label className="text-sm font-medium"><Required>Domain</Required><Input className={`mt-2 ${errorClass(errors.domain?.message)}`} placeholder="acme.com" {...form.register("domain")} /><FieldError message={errors.domain?.message} /></label>
      <label className="text-sm font-medium"><Required>Industry</Required><Input className={`mt-2 ${errorClass(errors.industry?.message)}`} placeholder="Software" {...form.register("industry")} /><FieldError message={errors.industry?.message} /></label>
      <label className="text-sm font-medium md:col-span-2"><Required>Size</Required><Input className={`mt-2 ${errorClass(errors.size?.message)}`} placeholder="50-100 employees" {...form.register("size")} /><FieldError message={errors.size?.message} /></label>
      <FormError message={errors.root?.message} />
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label={mode === "edit" ? "Update Company" : "Save Company"} /></Button>
    </form>
  );
}

export function ContactForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<z.input<typeof contactSchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const canAssign = me?.role === "sales_manager";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialValues?.avatar_url ?? "");
  const form = useForm<z.input<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { full_name: initialValues?.full_name ?? "", company: initialValues?.company ?? "", email: initialValues?.email ?? "", phone: initialValues?.phone ?? "", title: initialValues?.title ?? "", preferred_contact_method: initialValues?.preferred_contact_method ?? "Email", timezone: initialValues?.timezone ?? "Asia/Manila", best_time_to_contact: initialValues?.best_time_to_contact ?? "9:00 AM - 5:00 PM", avatar_url: initialValues?.avatar_url ?? "", assigned_to: initialValues?.assigned_to ?? null } });
  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
        form.setValue("avatar_url", reader.result);
      }
    };
    reader.readAsDataURL(file);
  }
  async function onSubmit(values: z.input<typeof contactSchema>) {
    try {
      const payload = { ...values, avatar_url: avatarUrl };
      if (!canAssign) delete payload.assigned_to;
      const saved = await mutateJson<Record<string, unknown>>("/api/contacts", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...payload, id } : payload);
      await mutate("/api/contacts", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      toast.success(mode === "edit" ? "Contact updated." : "Contact saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save contact." });
    }
  }
  const errors = form.formState.errors;
  return (
    <form className="grid gap-4 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <input type="hidden" {...form.register("avatar_url")} />
      <div className="md:col-span-2 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-primary">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : "IMG"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Add profile picture
          </Button>
          {avatarUrl ? (
            <Button type="button" variant="danger" onClick={() => { setAvatarUrl(""); form.setValue("avatar_url", ""); }}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
          <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
        </div>
      </div>
      {canAssign ? (
        <label className="text-sm font-medium md:col-span-2">
          Assigned sales rep
          <Controller
            control={form.control}
            name="assigned_to"
            render={({ field }) => <AssignedUserSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.assigned_to?.message} />}
          />
          <FieldError message={errors.assigned_to?.message} />
        </label>
      ) : null}
      <label className="text-sm font-medium"><Required>Full name</Required><Input className={`mt-2 ${errorClass(errors.full_name?.message)}`} placeholder="Maya Chen" {...form.register("full_name")} /><FieldError message={errors.full_name?.message} /></label>
      <label className="text-sm font-medium">
        <Required>Company</Required>
        <Controller
          control={form.control}
          name="company"
          render={({ field }) => <CompanySelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.company?.message} />}
        />
        <FieldError message={errors.company?.message} />
      </label>
      <label className="text-sm font-medium"><Required>Email</Required><Input className={`mt-2 ${errorClass(errors.email?.message)}`} placeholder="maya@acme.com" type="email" {...form.register("email")} /><FieldError message={errors.email?.message} /></label>
      <label className="text-sm font-medium">
        <Required>Phone</Required>
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => <PhoneField value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.phone?.message} />}
        />
      </label>
      <label className="text-sm font-medium md:col-span-2"><Required>Title</Required><Input className={`mt-2 ${errorClass(errors.title?.message)}`} placeholder="VP Sales" {...form.register("title")} /><FieldError message={errors.title?.message} /></label>
      <label className="text-sm font-medium">
        <Required>Preferred contact</Required>
        <Select className={`mt-2 ${errorClass(errors.preferred_contact_method?.message)}`} {...form.register("preferred_contact_method")}>
          <option>Email</option>
          <option>Phone</option>
          <option>No preference</option>
        </Select>
        <FieldError message={errors.preferred_contact_method?.message} />
      </label>
      <label className="text-sm font-medium">
        <Required>Timezone</Required>
        <Select className={`mt-2 ${errorClass(errors.timezone?.message)}`} {...form.register("timezone")}>
          {timezoneOptions.map((timezone) => (
            <option key={timezone}>{timezone}</option>
          ))}
        </Select>
        <FieldError message={errors.timezone?.message} />
      </label>
      <label className="text-sm font-medium md:col-span-2"><Required>Best time to contact</Required><Input className={`mt-2 ${errorClass(errors.best_time_to_contact?.message)}`} placeholder="9:00 AM - 11:00 AM" {...form.register("best_time_to_contact")} /><FieldError message={errors.best_time_to_contact?.message} /></label>
      <FormError message={errors.root?.message} />
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label={mode === "edit" ? "Update Contact" : "Save Contact"} /></Button>
    </form>
  );
}

export function TaskForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<z.input<typeof taskSchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const canAssign = me?.role === "sales_manager";
  const form = useForm<z.input<typeof taskSchema>>({ resolver: zodResolver(taskSchema), defaultValues: { title: initialValues?.title ?? "", description: initialValues?.description ?? "", status: initialValues?.status ?? "Todo", due_date: initialValues?.due_date ?? "", assigned_to: initialValues?.assigned_to ?? null } });
  async function onSubmit(values: z.input<typeof taskSchema>) {
    try {
      const payload = { ...values };
      if (!canAssign) delete payload.assigned_to;
      const saved = await mutateJson<Record<string, unknown>>("/api/tasks", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...payload, id } : payload);
      await mutate("/api/tasks", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      toast.success(mode === "edit" ? "Task updated." : "Task saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save task." });
    }
  }
  const errors = form.formState.errors;
  const watchedStatus = form.watch("status");
  return (
    <form className="grid gap-4 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      {canAssign ? (
        <label className="text-sm font-medium md:col-span-2">
          Assigned sales rep
          <Controller
            control={form.control}
            name="assigned_to"
            render={({ field }) => <AssignedUserSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.assigned_to?.message} />}
          />
          <FieldError message={errors.assigned_to?.message} />
        </label>
      ) : null}
      <label className="text-sm font-medium md:col-span-2"><Required>Title</Required><Input className={`mt-2 ${errorClass(errors.title?.message)}`} placeholder="Follow up with Maya" {...form.register("title")} /><FieldError message={errors.title?.message} /></label>
      <label className="text-sm font-medium">
        <div className="flex items-center justify-between gap-3">
          <Required>Status</Required>
          <StatusBadge status={watchedStatus ?? "Todo"} />
        </div>
        <Select className={`mt-2 ${errorClass(errors.status?.message)}`} {...form.register("status")}>
          <option>Todo</option>
          <option>In Progress</option>
          <option>Done</option>
        </Select>
        <FieldError message={errors.status?.message} />
      </label>
      <label className="text-sm font-medium"><Required>Due date</Required><Input className={`mt-2 ${errorClass(errors.due_date?.message)}`} placeholder="mm/dd/yyyy" type="date" {...form.register("due_date")} /><FieldError message={errors.due_date?.message} /></label>
      <label className="text-sm font-medium md:col-span-2"><Required>Description</Required><Textarea className={`mt-2 ${errorClass(errors.description?.message)}`} placeholder="What needs to happen next?" {...form.register("description")} /><FieldError message={errors.description?.message} /></label>
      <FormError message={errors.root?.message} />
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label={mode === "edit" ? "Update Task" : "Save Task"} /></Button>
    </form>
  );
}

export function DealForm({ onDone, initialValues, id, mode = "create" }: { onDone?: (saved?: Record<string, unknown>) => void; initialValues?: Partial<z.input<typeof dealSchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const canAssign = me?.role === "sales_manager";
  const form = useForm<z.input<typeof dealSchema>>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      company: initialValues?.company ?? "",
      products_services: initialValues?.products_services ?? "",
      value: initialValues?.value ?? 0,
      stage: initialValues?.stage ?? "Qualified",
      loss_reason: initialValues?.loss_reason ?? "",
      next_step: initialValues?.next_step ?? "",
      next_step_date: initialValues?.next_step_date ?? "",
      forecast_category: initialValues?.forecast_category ?? "Pipeline",
      review_status: initialValues?.review_status ?? "Not Required",
      assigned_to: initialValues?.assigned_to ?? null,
      expected_close_date: initialValues?.expected_close_date ?? "",
    },
  });
  async function onSubmit(values: z.input<typeof dealSchema>) {
    try {
      if (values.stage === "Lost" && !values.loss_reason?.trim()) {
        form.setError("loss_reason", { message: "Enter a loss reason." });
        return;
      }
      if (values.stage === "Won" && values.review_status === "Pending Review") {
        form.setError("review_status", { message: "Approve this deal before marking it Won." });
        return;
      }
      const payload = { ...values };
      if (!canAssign) delete payload.assigned_to;
      const saved = await mutateJson<Record<string, unknown>>("/api/deals", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...payload, id } : payload);
      await mutate("/api/deals", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      await Promise.all([mutate("/api/leads"), mutate("/api/metrics")]);
      toast.success(mode === "edit" ? "Deal updated." : "Deal saved.");
      onDone?.(saved);
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save deal." });
    }
  }
  const errors = form.formState.errors;
  const watchedStage = form.watch("stage");
  const requiresLossReason = watchedStage === "Lost";
  return (
    <form className="grid gap-4 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      {canAssign ? (
        <label className="text-sm font-medium md:col-span-2">
          Assigned sales rep
          <Controller
            control={form.control}
            name="assigned_to"
            render={({ field }) => <AssignedUserSelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.assigned_to?.message} />}
          />
          <FieldError message={errors.assigned_to?.message} />
        </label>
      ) : null}
      <label className="text-sm font-medium md:col-span-2"><Required>Deal name</Required><Input className={`mt-2 ${errorClass(errors.title?.message)}`} placeholder="Acme Sales Hub" {...form.register("title")} /><FieldError message={errors.title?.message} /></label>
      <label className="text-sm font-medium md:col-span-2"><Required>Products or services</Required><Textarea className={`mt-2 ${errorClass(errors.products_services?.message)}`} placeholder="SalesPro CRM seats, onboarding, reporting, or services included in this deal" {...form.register("products_services")} /><FieldError message={errors.products_services?.message} /></label>
      <label className="text-sm font-medium">
        <Required>Company</Required>
        <Controller
          control={form.control}
          name="company"
          render={({ field }) => <CompanySelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.company?.message} />}
        />
        <FieldError message={errors.company?.message} />
      </label>
      <label className="text-sm font-medium"><Required>Deal value</Required><Input className={`mt-2 ${errorClass(errors.value?.message)}`} placeholder="86000" type="number" min="0" step="1" {...form.register("value")} /><FieldError message={errors.value?.message} /></label>
      <label className="text-sm font-medium">
        <div className="flex items-center justify-between gap-3">
          <Required>Stage</Required>
          <StatusBadge status={watchedStage ?? "Qualified"} />
        </div>
        <Select className={`mt-2 ${errorClass(errors.stage?.message)}`} {...form.register("stage")}>
          {dealStageOptions.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
        </Select>
        <p className="mt-1.5 text-xs font-normal text-muted">Close probability is calculated from this stage.</p>
        <FieldError message={errors.stage?.message} />
      </label>
      <label className="text-sm font-medium"><Required>Expected close date</Required><Input className={`mt-2 ${errorClass(errors.expected_close_date?.message)}`} type="date" {...form.register("expected_close_date")} /><FieldError message={errors.expected_close_date?.message} /></label>
      <label className="text-sm font-medium"><Required>Next step</Required><Input className={`mt-2 ${errorClass(errors.next_step?.message)}`} placeholder="Send security docs" {...form.register("next_step")} /><FieldError message={errors.next_step?.message} /></label>
      <label className="text-sm font-medium"><Required>Next step date</Required><Input className={`mt-2 ${errorClass(errors.next_step_date?.message)}`} type="date" {...form.register("next_step_date")} /><FieldError message={errors.next_step_date?.message} /></label>
      <label className="text-sm font-medium">
        <Required>Forecast category</Required>
        <Select className={`mt-2 ${errorClass(errors.forecast_category?.message)}`} {...form.register("forecast_category")}>
          <option>Pipeline</option>
          <option>Best Case</option>
          <option>Commit</option>
        </Select>
        <FieldError message={errors.forecast_category?.message} />
      </label>
      <label className="text-sm font-medium">
        <Required>Manager review</Required>
        <Select className={`mt-2 ${errorClass(errors.review_status?.message)}`} {...form.register("review_status")}>
          <option>Not Required</option>
          <option>Pending Review</option>
          <option>Approved</option>
          <option>Changes Requested</option>
        </Select>
        <FieldError message={errors.review_status?.message} />
      </label>
      {requiresLossReason ? (
        <label className="text-sm font-medium md:col-span-2"><Required>Loss reason</Required><Textarea className={`mt-2 ${errorClass(errors.loss_reason?.message)}`} placeholder="Budget frozen, chose competitor, timing changed..." {...form.register("loss_reason")} /><FieldError message={errors.loss_reason?.message} /></label>
      ) : null}
      <FormError message={errors.root?.message} />
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label={mode === "edit" ? "Update Deal" : "Save Deal"} /></Button>
    </form>
  );
}

export function NoteForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<z.input<typeof noteSchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const form = useForm<z.input<typeof noteSchema>>({ resolver: zodResolver(noteSchema), defaultValues: { body: initialValues?.body ?? "", related_type: initialValues?.related_type ?? "general", related_id: initialValues?.related_id ?? null } });
  async function onSubmit(values: z.input<typeof noteSchema>) {
    try {
      const saved = await mutateJson<Record<string, unknown>>("/api/notes", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...values, id } : values);
      await mutate("/api/notes", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      toast.success(mode === "edit" ? "Note updated." : "Note saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save note." });
    }
  }
  const errors = form.formState.errors;
  const relatedType = form.watch("related_type") ?? "general";
  const relatedLabel = String(relatedType).charAt(0).toUpperCase() + String(relatedType).slice(1);
  return (
    <form className="grid gap-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <label className="text-sm font-medium">
        <div className="flex items-center justify-between gap-3">
          <Required>Type</Required>
          <StatusBadge status={relatedLabel} />
        </div>
        <Select className="mt-2" {...form.register("related_type")}>
          <option value="general">General</option>
          <option value="lead">Lead</option>
          <option value="deal">Deal</option>
          <option value="contact">Contact</option>
        </Select>
      </label>
      <label className="text-sm font-medium"><Required>Note</Required><Textarea className={`mt-2 ${errorClass(errors.body?.message)}`} placeholder="Add a useful sales note" {...form.register("body")} /><FieldError message={errors.body?.message} /></label>
      <FormError message={errors.root?.message} />
      <Button disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label={mode === "edit" ? "Update Note" : "Save Note"} /></Button>
    </form>
  );
}

export function ActivityLogForm({ onDone, initialValues }: { onDone?: () => void; initialValues?: Partial<z.input<typeof activityLogSchema>> }) {
  const { mutate } = useSWRConfig();
  const { data: leads } = useLeads();
  const { data: deals } = useDeals();
  const { data: contacts } = useContacts();
  const { data: companies } = useCompanies();
  const relatedOptions = useMemo(
    () => [
      ...(leads ?? []).map((item) => ({ value: `lead:${item.id}`, label: `Lead - ${item.full_name}` })),
      ...(deals ?? []).map((item) => ({ value: `deal:${item.id}`, label: `Deal - ${item.title}` })),
      ...(contacts ?? []).map((item) => ({ value: `contact:${item.id}`, label: `Contact - ${item.full_name}` })),
      ...(companies ?? []).map((item) => ({ value: `company:${item.id}`, label: `Company - ${item.name}` })),
    ],
    [companies, contacts, deals, leads],
  );
  const initialRelated = initialValues?.entity_type && initialValues?.entity_id ? `${initialValues.entity_type}:${initialValues.entity_id}` : "";
  const [relatedValue, setRelatedValue] = useState(initialRelated);
  const form = useForm<z.input<typeof activityLogSchema>>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: {
      activity_type: initialValues?.activity_type ?? "Call",
      entity_type: initialValues?.entity_type ?? "lead",
      entity_id: initialValues?.entity_id ?? null,
      subject: initialValues?.subject ?? "",
      body: initialValues?.body ?? "",
      outcome: initialValues?.outcome ?? "",
      scheduled_at: initialValues?.scheduled_at ?? "",
    },
  });

  async function onSubmit(values: z.input<typeof activityLogSchema>) {
    try {
      const saved = await mutateJson<Record<string, unknown>>("/api/activities", "POST", {
        ...values,
        entity_id: values.entity_id || null,
        outcome: values.outcome || null,
        scheduled_at: values.scheduled_at || null,
      });
      await mutate("/api/activities", (current: Array<Record<string, unknown>> | undefined) => [saved, ...(current ?? [])], { revalidate: true });
      toast.success(values.scheduled_at ? "Activity scheduled." : "Activity logged.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save activity." });
    }
  }

  const errors = form.formState.errors;
  const watchedType = form.watch("activity_type");
  return (
    <form className="grid gap-4 md:grid-cols-2" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <label className="text-sm font-medium">
        <div className="flex items-center justify-between gap-3">
          <Required>Activity type</Required>
          <StatusBadge status={watchedType ?? "Call"} />
        </div>
        <Select className={`mt-2 ${errorClass(errors.activity_type?.message)}`} {...form.register("activity_type")}>
          <option>Call</option>
          <option>Email</option>
          <option>Meeting</option>
          <option>Demo</option>
        </Select>
        <FieldError message={errors.activity_type?.message} />
      </label>
      <label className="text-sm font-medium">
        Related record
        <Select
          className="mt-2"
          value={relatedValue}
          onChange={(event) => {
            const value = event.target.value;
            setRelatedValue(value);
            const [type, recordId] = value.split(":");
            form.setValue("entity_type", (type || "lead") as z.input<typeof activityLogSchema>["entity_type"], { shouldValidate: true });
            form.setValue("entity_id", recordId || null, { shouldValidate: true });
          }}
        >
          <option value="">No specific record</option>
          {relatedOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </Select>
        <FieldError message={errors.entity_type?.message ?? errors.entity_id?.message} />
      </label>
      <label className="text-sm font-medium md:col-span-2"><Required>Subject</Required><Input className={`mt-2 ${errorClass(errors.subject?.message)}`} placeholder="Call recap, outreach email, scheduled demo..." {...form.register("subject")} /><FieldError message={errors.subject?.message} /></label>
      <label className="text-sm font-medium md:col-span-2"><Required>Details</Required><Textarea className={`mt-2 ${errorClass(errors.body?.message)}`} placeholder="What happened, what was sent, or what is planned?" {...form.register("body")} /><FieldError message={errors.body?.message} /></label>
      <label className="text-sm font-medium"><span>Outcome</span><Input className={`mt-2 ${errorClass(errors.outcome?.message)}`} placeholder="Connected, left voicemail, accepted meeting..." {...form.register("outcome")} /><FieldError message={errors.outcome?.message} /></label>
      <label className="text-sm font-medium"><span>Scheduled time</span><Input className={`mt-2 ${errorClass(errors.scheduled_at?.message)}`} type="datetime-local" {...form.register("scheduled_at")} /><FieldError message={errors.scheduled_at?.message} /></label>
      <FormError message={errors.root?.message} />
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}><SaveLabel saving={form.formState.isSubmitting} label="Save Activity" /></Button>
    </form>
  );
}
