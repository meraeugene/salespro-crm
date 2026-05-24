"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { useActivities } from "@/hooks/use-crm";
import { useUiStore } from "@/store/ui-store";

const searchTargets = [
  { label: "Dashboard", href: "/dashboard", keywords: "home overview metrics" },
  { label: "Leads", href: "/leads", keywords: "prospects qualification source" },
  { label: "Deals", href: "/deals", keywords: "pipeline opportunities forecast approval review" },
  { label: "Contacts", href: "/contacts", keywords: "people stakeholders customers preferences" },
  { label: "Companies", href: "/companies", keywords: "accounts domains organizations" },
  { label: "Tasks", href: "/tasks", keywords: "follow ups overdue reminders" },
  { label: "Notes", href: "/notes", keywords: "call notes history" },
  { label: "Notifications", href: "/activities", keywords: "activity timeline alerts" },
  { label: "Analytics", href: "/analytics", keywords: "reports quota performance forecast" },
  { label: "Team", href: "/team", keywords: "reps users roles" },
  { label: "Settings", href: "/settings", keywords: "profile password account" },
];

export function Navbar() {
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const readActivityIds = useUiStore((state) => state.readActivityIds);
  const { data } = useActivities();
  const notificationCount = (data ?? []).filter((item) => !readActivityIds.includes(item.id)).length;
  const suggestions = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return searchTargets.slice(0, 5);
    return searchTargets
      .filter((target) => `${target.label} ${target.keywords}`.toLowerCase().includes(value))
      .slice(0, 6);
  }, [search]);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-start gap-3 px-4 sm:px-6 lg:px-9">
        <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              placeholder="Search pages or features"
              className="h-10 pl-9"
            />
            {focused ? (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-[0_18px_40px_rgba(17,24,39,0.12)]">
                {suggestions.length ? (
                  suggestions.map((target) => (
                    <Link
                      key={target.href}
                      href={target.href}
                      className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-50 hover:text-primary"
                      onClick={() => setSearch("")}
                    >
                      {target.label}
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted">No matching page or feature.</div>
                )}
              </div>
            ) : null}
        </div>
        <Link href="/activities" className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-foreground hover:bg-blue-50 hover:text-primary" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 ? (
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
