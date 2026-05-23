import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\+\d{7,15}$/, "Enter a valid phone number."));

export const authSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const leadSchema = z.object({
  full_name: z.string().min(2, "Enter a lead name."),
  company: z.string().min(2, "Enter a company name."),
  email: z.string().email("Enter a valid email address."),
  phone: phoneSchema,
  status: z.enum(["New", "Contacted", "Qualified", "Proposal", "Won", "Lost"]).default("New"),
  lead_source: z.string().min(2, "Enter a lead source."),
  assigned_to: z.string().uuid().optional().nullable(),
  last_contacted: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const dealSchema = z.object({
  title: z.string().min(2),
  company: z.string().min(2),
  value: z.coerce.number().nonnegative(),
  probability: z.coerce.number().min(0).max(100).optional(),
  stage: z.enum(["New Lead", "Contacted", "Qualified", "Proposal Sent", "Negotiation", "Won", "Lost"]),
  assigned_to: z.string().uuid().optional().nullable(),
  expected_close_date: z.string(),
});

export const taskSchema = z.object({
  title: z.string().min(2, "Enter a task title."),
  description: z.string().min(2, "Enter a task description."),
  status: z.enum(["Todo", "In Progress", "Done"]).default("Todo"),
  due_date: z.string().min(1, "Choose a due date."),
  related_type: z.string().optional().nullable(),
  related_id: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const companySchema = z.object({
  name: z.string().min(2, "Enter a company name."),
  domain: z.string().min(2, "Enter a company domain."),
  industry: z.string().min(2, "Enter an industry."),
  size: z.string().min(1, "Enter the company size."),
});

export const contactSchema = z.object({
  full_name: z.string().min(2, "Enter a contact name."),
  company: z.string().min(2, "Enter a company name."),
  email: z.string().email("Enter a valid email address."),
  phone: phoneSchema,
  title: z.string().min(2, "Enter a title."),
  avatar_url: z
    .union([
      z.string().url("Enter a valid URL."),
      z.string().startsWith("data:image/", "Choose a valid image."),
      z.literal(""),
    ])
    .optional(),
  assigned_to: z.string().uuid().optional().nullable(),
});

export const noteSchema = z.object({
  body: z.string().min(2, "Enter a note."),
  related_type: z.string().min(2, "Choose what this note is related to.").default("general"),
  related_id: z.string().uuid().optional().nullable(),
});

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().min(2, "Enter at least 2 characters."),
  avatar_url: z
    .union([
      z.string().url("Enter a valid URL."),
      z.string().startsWith("data:image/", "Choose a valid image."),
      z.literal(""),
    ])
    .transform((value) => value || null),
});

export const passwordSettingsSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(8, "Use at least 8 characters."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
