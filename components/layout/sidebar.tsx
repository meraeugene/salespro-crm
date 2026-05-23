"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgeDollarSign, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { navSections } from "@/constants/navigation";
import { LogoutButton } from "@/components/layout/logout-button";
import { Button } from "@/components/ui/button";
import { useActivities } from "@/hooks/use-crm";
import { defaultRouteForRole, roleLabels } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import type { Role } from "@/types/crm";

type SidebarProps = {
  fullName: string;
  initials: string;
  role: Role;
  avatarUrl?: string | null;
};

export function Sidebar({ fullName, initials, role, avatarUrl }: SidebarProps) {
  const pathname = usePathname();
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const previousCollapsed = useRef(collapsed);
  const [animateCollapse, setAnimateCollapse] = useState(false);
  const readActivityIds = useUiStore((state) => state.readActivityIds);
  const { data: activities } = useActivities();
  const notificationCount = (activities ?? []).filter((item) => !readActivityIds.includes(item.id)).length;
  const homeHref = defaultRouteForRole(role);
  const visibleNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((section) => section.items.length > 0);
  const visibleNavItems = visibleNavSections.flatMap(
    (section) => section.items,
  );

  useEffect(() => {
    if (previousCollapsed.current === collapsed) return;
    previousCollapsed.current = collapsed;
    setAnimateCollapse(true);
    const timeout = window.setTimeout(() => setAnimateCollapse(false), 190);
    return () => window.clearTimeout(timeout);
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden overflow-hidden border-r border-border bg-white lg:block",
        collapsed ? "w-20" : "w-72",
        animateCollapse && (collapsed ? "animate-[sidebarNarrow_180ms_ease-out]" : "animate-[sidebarWide_180ms_ease-out]"),
      )}
    >
      <div className={cn("flex h-full flex-col p-5 transition-[padding] duration-150", collapsed && "px-4")}>
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            collapsed && "justify-center",
          )}
        >
          {!collapsed ? (
            <Link href={homeHref} className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary">
                <BadgeDollarSign className="h-5 w-5 text-white" />
              </span>
              <span className="truncate whitespace-nowrap text-lg font-semibold">
                SalesPro CRM
              </span>
            </Link>
          ) : null}

          <Button
            type="button"
            variant={collapsed ? "ghost" : "secondary"}
            size="icon"
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "shrink-0",
              collapsed &&
                "h-10 w-10 rounded-xl border border-blue-100 bg-blue-50 text-primary hover:bg-blue-100",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav
          className={cn("mt-9 flex-1", collapsed ? "space-y-3" : "space-y-6")}
        >
          {collapsed
            ? visibleNavItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    title={item.label}
                    className={cn(
                      "relative mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-muted transition hover:bg-blue-50 hover:text-primary",
                      active &&
                        "bg-primary text-white shadow-sm hover:bg-primary hover:text-white",
                    )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.href === "/activities" && notificationCount > 0 ? (
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                          {notificationCount > 99 ? "99+" : notificationCount}
                        </span>
                      ) : null}
                  </Link>
                );
              })
            : visibleNavSections.map((section) => (
                <div key={section.label} className="space-y-2">
                  <div className="h-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted transition-all duration-200 hover:bg-blue-50 hover:text-primary",
                            active &&
                              "bg-primary text-white hover:bg-primary hover:text-white",
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <span className="truncate whitespace-nowrap">
                            {item.label}
                          </span>
                          {item.href === "/activities" && notificationCount > 0 ? (
                            <span className={cn(
                              "ml-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
                              active ? "bg-white text-primary" : "bg-primary text-white",
                            )}>
                              {notificationCount > 99 ? "99+" : notificationCount}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
        </nav>

        <form
          action={signOutAction}
          className={cn(
            "mt-auto flex gap-2 pt-5",
            collapsed ? "flex-col items-center" : "items-center",
          )}
        >
          <div
            className={cn(
              "inline-flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg border border-border bg-white px-4 text-sm font-medium",
              collapsed && "h-auto flex-none border-0 px-0",
            )}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-8 w-8 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-dark text-xs text-white">
                {initials}
              </span>
            )}
            {!collapsed ? (
              <span className="min-w-0 px-1 leading-tight">
                <span className="block truncate">{fullName}</span>
                <span className="block truncate text-xs font-normal text-muted">
                  {roleLabels[role]}
                </span>
              </span>
            ) : null}
          </div>
          <LogoutButton />
        </form>
      </div>
    </aside>
  );
}
