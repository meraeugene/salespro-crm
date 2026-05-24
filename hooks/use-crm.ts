"use client";

import useSWR from "swr";
import type { Activity, Company, Contact, DashboardMetrics, Deal, Lead, Note, Profile, Task } from "@/types/crm";
import { fetcher } from "@/services/fetcher";

const liveOptions = {
  dedupingInterval: 0,
  focusThrottleInterval: 0,
  keepPreviousData: false,
  refreshInterval: 3000,
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnMount: true,
  revalidateOnReconnect: true,
} as const;

export function useMetrics() {
  return useSWR<DashboardMetrics>("/api/metrics", fetcher, liveOptions);
}

export function useMe() {
  return useSWR<Profile & { role_label: string }>("/api/me", fetcher, liveOptions);
}

export function useSalesReps() {
  return useSWR<Profile[]>("/api/sales-reps", fetcher, liveOptions);
}

export function useLeads(query = "") {
  return useSWR<Lead[]>(`/api/leads${query}`, fetcher, liveOptions);
}

export function useDeals() {
  return useSWR<Deal[]>("/api/deals", fetcher, liveOptions);
}

export function useContacts() {
  return useSWR<Contact[]>("/api/contacts", fetcher, liveOptions);
}

export function useCompanies() {
  return useSWR<Company[]>("/api/companies", fetcher, liveOptions);
}

export function useActivities() {
  return useSWR<Activity[]>("/api/activities", fetcher, liveOptions);
}

export function useTasks() {
  return useSWR<Task[]>("/api/tasks", fetcher, liveOptions);
}

export function useNotes() {
  return useSWR<Note[]>("/api/notes", fetcher, liveOptions);
}
