import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";

const activities = [
  { id: "a1", action: "Deal moved to Negotiation", entity_type: "deal", created_at: "2026-05-20" },
  { id: "a2", action: "Lead assigned to Maya Chen", entity_type: "lead", created_at: "2026-05-19" },
];

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(activities);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(50);
  if (profile?.role === "sales_representative") query = query.eq("created_by", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;

  const id = typeof body.id === "string" ? body.id : null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const writeClient = serviceRoleKey && supabaseUrl
    ? createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : supabase;
  let query = writeClient.from("activities").delete();
  if (id) query = query.eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("created_by", user.id);
  if (!id && profile?.role !== "sales_representative") query = query.neq("action", "__never__");
  const { error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}
