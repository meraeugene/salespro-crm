import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { leads } from "@/lib/mock-data";
import { leadSchema } from "@/validations/crm";
import { z } from "zod";

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json(leads);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  let query = supabase.from("leads").select("*, profiles:assigned_to(full_name)").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  if (q) query = query.or(`full_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(
    data.map((lead) => ({ ...lead, assigned_user: lead.profiles?.full_name ?? null })),
  );
}

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { data, error: dbError } = await supabase
    .from("leads")
    .insert({ ...parsed.data, assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = leadSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { id, ...updates } = parsed.data;
  if (profile?.role === "sales_representative" && "assigned_to" in updates) {
    return NextResponse.json({ error: "Sales representatives cannot reassign leads." }, { status: 403 });
  }
  let query = supabase.from("leads").update(updates).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing lead id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { error: dbError } = await supabase.from("leads").delete().eq("id", id);
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}
