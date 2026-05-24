import { NextResponse } from "next/server";
import { roleLabels } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/crm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, manager_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const role = profile.role as Role;

  return NextResponse.json({
    ...profile,
    role_label: roleLabels[role],
  });
}
