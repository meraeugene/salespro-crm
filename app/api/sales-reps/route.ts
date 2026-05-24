import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { profiles } from "@/lib/mock-data";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(profiles.filter((profile) => profile.role === "sales_representative"));
  }

  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, avatar_url, manager_id")
    .eq("role", "sales_representative")
    .order("full_name");

  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
