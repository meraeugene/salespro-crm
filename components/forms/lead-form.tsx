"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useSWRConfig } from "swr";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AssignedUserSelect } from "@/components/forms/assigned-user-select";
import { CompanySelect } from "@/components/forms/company-select";
import { PhoneField } from "@/components/forms/phone-field";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useMe } from "@/hooks/use-crm";
import { mutateJson } from "@/services/fetcher";
import { leadSchema } from "@/validations/crm";

type LeadValues = z.input<typeof leadSchema>;
type FormMode = "create" | "edit";

export function LeadForm({ onDone, initialValues, id, mode = "create" }: { onDone?: () => void; initialValues?: Partial<LeadValues>; id?: string; mode?: FormMode }) {
  const { mutate } = useSWRConfig();
  const { data: me } = useMe();
  const canAssign = me?.role === "sales_manager";
  const form = useForm<LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      full_name: initialValues?.full_name ?? "",
      company: initialValues?.company ?? "",
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      status: initialValues?.status ?? "New",
      lead_source: initialValues?.lead_source ?? "Website",
      assigned_to: initialValues?.assigned_to ?? null,
      notes: initialValues?.notes ?? "",
    },
  });

  async function onSubmit(values: LeadValues) {
    try {
      const payload = { ...values };
      if (!canAssign) delete payload.assigned_to;
      await mutateJson("/api/leads", mode === "edit" ? "PATCH" : "POST", mode === "edit" ? { ...payload, id } : payload);
      await mutate("/api/leads");
      if (mode === "create") form.reset();
      toast.success(mode === "edit" ? "Lead updated." : "Lead saved.");
      onDone?.();
    } catch (error) {
      form.setError("root", { message: error instanceof Error ? error.message : "Unable to save lead." });
    }
  }

  const errors = form.formState.errors;
  const watchedStatus = form.watch("status");
  const errorClass = (message?: string) => (message ? "border-red-500 focus:border-red-500 focus:ring-red-100" : undefined);
  const required = (label: string) => <span>{label} <span className="text-red-500">*</span></span>;
  const fieldError = (message?: string) => message ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-red-600">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  ) : null;

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
          {fieldError(errors.assigned_to?.message)}
        </label>
      ) : null}
      <label className="text-sm font-medium">{required("Full name")}<Input className={`mt-2 ${errorClass(errors.full_name?.message) ?? ""}`} placeholder="Maya Chen" {...form.register("full_name")} />{fieldError(errors.full_name?.message)}</label>
      <label className="text-sm font-medium">
        {required("Company")}
        <Controller
          control={form.control}
          name="company"
          render={({ field }) => <CompanySelect value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.company?.message} />}
        />
        {fieldError(errors.company?.message)}
      </label>
      <label className="text-sm font-medium">{required("Email")}<Input className={`mt-2 ${errorClass(errors.email?.message) ?? ""}`} placeholder="maya@acme.com" type="email" {...form.register("email")} />{fieldError(errors.email?.message)}</label>
      <label className="text-sm font-medium">
        {required("Phone")}
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => <PhoneField value={field.value} onChange={field.onChange} onBlur={field.onBlur} error={errors.phone?.message} />}
        />
      </label>
      <label className="text-sm font-medium">
        <div className="flex items-center justify-between gap-3">
          {required("Status")}
          <StatusBadge status={watchedStatus ?? "New"} />
        </div>
        <Select className={`mt-2 ${errorClass(errors.status?.message) ?? ""}`} {...form.register("status")}>
        <option value="" disabled>Select status</option>
        {["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"].map((status) => (
          <option key={status}>{status}</option>
        ))}
      </Select>{fieldError(errors.status?.message)}</label>
      <label className="text-sm font-medium">{required("Lead source")}<Select className={`mt-2 ${errorClass(errors.lead_source?.message) ?? ""}`} {...form.register("lead_source")}>
        <option value="" disabled>Select source</option>
        {["Website", "Referral", "LinkedIn", "Webinar", "Event", "Partner", "Outbound"].map((source) => (
          <option key={source}>{source}</option>
        ))}
      </Select>{fieldError(errors.lead_source?.message)}</label>
      <label className="text-sm font-medium md:col-span-2">Notes (optional)<Textarea className="mt-2" placeholder="Add context about this lead" {...form.register("notes")} /></label>
      {errors.root?.message ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">{errors.root.message}</div> : null}
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {form.formState.isSubmitting ? "Saving..." : mode === "edit" ? "Update Lead" : "Save Lead"}
      </Button>
    </form>
  );
}
