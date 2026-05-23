"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useActivities } from "@/hooks/use-crm";
import { useUiStore } from "@/store/ui-store";

export function Navbar() {
  const search = useUiStore((state) => state.search);
  const setSearch = useUiStore((state) => state.setSearch);
  const readActivityIds = useUiStore((state) => state.readActivityIds);
  const { data } = useActivities();
  const notificationCount = (data ?? []).filter((item) => !readActivityIds.includes(item.id)).length;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 sm:px-6 lg:px-9">
        <div className="flex w-full max-w-xl items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-10 pl-9"
            />
          </div>
          <Link href="/activities" className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white text-foreground hover:bg-blue-50 hover:text-primary" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {notificationCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
