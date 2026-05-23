import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { ShellChrome } from "@/components/layout/shell-chrome";
import type { Role } from "@/types/crm";

function getInitials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function AppShell({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let fullName = "Sales User";
  let role: Role = "sales_manager";
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    fullName =
      profile?.full_name ??
      user.user_metadata.full_name ??
      user.email?.split("@")[0] ??
      fullName;
    role = (profile?.role ?? user.user_metadata.role ?? "sales_manager") as Role;
    avatarUrl = profile?.avatar_url ?? user.user_metadata.avatar_url ?? null;
  }

  return (
    <ShellChrome fullName={fullName} initials={getInitials(fullName) || "SU"} role={role} avatarUrl={avatarUrl}>
      {children}
    </ShellChrome>
  );
}
