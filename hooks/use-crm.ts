"use client";

import useSWR from "swr";
import type { Activity, Company, Contact, DashboardMetrics, Deal, Lead, Note, Profile, Task } from "@/types/crm";
import { fetcher } from "@/services/fetcher";

export function useMetrics() {
  return useSWR<DashboardMetrics>("/api/metrics", fetcher);
}

export function useMe() {
  return useSWR<Profile & { role_label: string }>("/api/me", fetcher);
}

export function useSalesReps() {
  return useSWR<Profile[]>("/api/sales-reps", fetcher);
}

export function useLeads(query = "") {
  return useSWR<Lead[]>(`/api/leads${query}`, fetcher);
}

export function useDeals() {
  return useSWR<Deal[]>("/api/deals", fetcher);
}

export function useContacts() {
  return useSWR<Contact[]>("/api/contacts", fetcher);
}

export function useCompanies() {
  return useSWR<Company[]>("/api/companies", fetcher);
}

export function useActivities() {
  return useSWR<Activity[]>("/api/activities", fetcher);
}

export function useTasks() {
  return useSWR<Task[]>("/api/tasks", fetcher);
}

export function useNotes() {
  return useSWR<Note[]>("/api/notes", fetcher);
}
