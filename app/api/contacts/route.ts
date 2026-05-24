import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { contacts } from "@/lib/mock-data";
import { contactSchema } from "@/validations/crm";
import { z } from "zod";

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(contacts);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("contacts").select("*, profiles:assigned_to(full_name)").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data.map((contact) => ({ ...contact, assigned_user: contact.profiles?.full_name ?? null })));
}

export async function POST(request: Request) {
  const parsed = contactSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { data, error: dbError } = await supabase
    .from("contacts")
    .insert({ ...parsed.data, assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing contact id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { error: dbError } = await supabase.from("contacts").delete().eq("id", id);
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = contactSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { id, ...updates } = parsed.data;
  if (profile?.role === "sales_representative" && "assigned_to" in updates) {
    return NextResponse.json({ error: "Sales representatives cannot reassign contacts." }, { status: 403 });
  }
  let query = supabase.from("contacts").update(updates).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
