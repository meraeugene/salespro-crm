"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
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
import { useMe } from "@/hooks/use-crm";
import { mutateJson } from "@/services/fetcher";
import { companySchema, contactSchema, dealSchema, noteSchema, taskSchema } from "@/validations/crm";

type FormMode = "create" | "edit";

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
  const form = useForm<z.input<typeof contactSchema>>({ resolver: zodResolver(contactSchema), defaultValues: { full_name: initialValues?.full_name ?? "", company: initialValues?.company ?? "", email: initialValues?.email ?? "", phone: initialValues?.phone ?? "", title: initialValues?.title ?? "", avatar_url: initialValues?.avatar_url ?? "", assigned_to: initialValues?.assigned_to ?? null } });
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

export function DealForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<z.input<typeof dealSchema>>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const canAssign = me?.role === "sales_manager";
  const form = useForm<z.input<typeof dealSchema>>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: initialValues?.title ?? "",
      company: initialValues?.company ?? "",
      value: initialValues?.value ?? 0,
      stage: initialValues?.stage ?? "Qualified",
      assigned_to: initialValues?.assigned_to ?? null,
      expected_close_date: initialValues?.expected_close_date ?? "",
    },
  });
  async function onSubmit(values: z.input<typeof dealSchema>) {
    try {
      const payload = { ...values };
      if (!canAssign) delete payload.assigned_to;
      const saved = await mutateJson<Record<string, unknown>>("/api/deals", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...payload, id } : payload);
      await mutate("/api/deals", (current: Array<Record<string, unknown>> | undefined) => updateResourceCache(current, saved, mode), { revalidate: true });
      toast.success(mode === "edit" ? "Deal updated." : "Deal saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save deal." });
    }
  }
  const errors = form.formState.errors;
  const watchedStage = form.watch("stage");
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
          <option>New Lead</option>
          <option>Contacted</option>
          <option>Qualified</option>
          <option>Proposal Sent</option>
          <option>Negotiation</option>
          <option>Won</option>
          <option>Lost</option>
        </Select>
        <p className="mt-1.5 text-xs font-normal text-muted">Close probability is calculated from this stage.</p>
        <FieldError message={errors.stage?.message} />
      </label>
      <label className="text-sm font-medium"><Required>Expected close date</Required><Input className={`mt-2 ${errorClass(errors.expected_close_date?.message)}`} type="date" {...form.register("expected_close_date")} /><FieldError message={errors.expected_close_date?.message} /></label>
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
