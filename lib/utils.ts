import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function humanize(value?: string | null) {
  if (!value) return "";
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function shortDate(value?: string | null) {
  if (!value) return "Not contacted";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}

export function shortDateTime(value?: string | null) {
  if (!value) return "No time recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
