import { NextResponse } from "next/server";
import type { Role } from "@/types/crm";
import { createClient } from "@/lib/supabase/server";

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { supabase, user, error: null };
}

export async function requireRole(allowedRoles: Role[]) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return { ...auth, profile: null };

  const { data: profile, error: profileError } = await auth.supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  const role = (profile?.role ?? auth.user.user_metadata.role) as Role | undefined;

  if (profileError || !role || !allowedRoles.includes(role)) {
    return {
      ...auth,
      profile: profile ?? null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ...auth, profile: { role }, error: null };
}

export function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error";
  return NextResponse.json({ error: message }, { status: 500 });
}
