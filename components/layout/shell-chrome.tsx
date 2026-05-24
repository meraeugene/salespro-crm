"use client";

import { useMemo, type ReactNode } from "react";
import { SWRConfig } from "swr";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import type { Role } from "@/types/crm";

type ShellChromeProps = {
  children: ReactNode;
  userId: string;
  fullName: string;
  initials: string;
  role: Role;
  avatarUrl?: string | null;
};

export function ShellChrome({ children, userId, fullName, initials, role, avatarUrl }: ShellChromeProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const swrConfig = useMemo(() => ({ provider: () => new Map() }), [userId]);

  return (
    <SWRConfig key={userId} value={swrConfig}>
      <div className="min-h-screen bg-background">
        <Sidebar fullName={fullName} initials={initials} role={role} avatarUrl={avatarUrl} />
        <div
          className={cn(
            "",
            collapsed ? "lg:pl-20" : "lg:pl-72",
          )}
        >
          <Navbar />
          <main className="px-4 py-8 sm:px-6 lg:px-9">{children}</main>
        </div>
      </div>
    </SWRConfig>
  );
}
