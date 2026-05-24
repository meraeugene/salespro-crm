import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { notes } from "@/lib/mock-data";
import { noteSchema } from "@/validations/crm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(notes);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("notes").select("*").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("created_by", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const parsed = noteSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { data, error: dbError } = await supabase
    .from("notes")
    .insert({ ...parsed.data, related_type: parsed.data.related_type ?? "general", related_id: parsed.data.related_id ?? crypto.randomUUID(), created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing note id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const writeClient = serviceRoleKey && supabaseUrl
    ? createSupabaseAdmin(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;
  let query = writeClient.from("notes").delete().eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("created_by", user.id);
  const { error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = noteSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const writeClient = serviceRoleKey && supabaseUrl
    ? createSupabaseAdmin(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : supabase;
  const { id, ...updates } = parsed.data;
  let query = writeClient.from("notes").update(updates).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("created_by", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
