import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { tasks } from "@/lib/mock-data";
import { taskSchema } from "@/validations/crm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(tasks);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("tasks").select("*, profiles:assigned_to(full_name)").order("due_date", { ascending: true });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data.map((task) => ({ ...task, assigned_user: task.profiles?.full_name ?? null })));
}

export async function POST(request: Request) {
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const assignedTo = profile?.role === "sales_representative" ? user.id : (parsed.data.assigned_to ?? user.id);
  const { data, error: dbError } = await supabase.from("tasks").insert({ ...parsed.data, assigned_to: assignedTo, created_by: user.id }).select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing task id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("tasks").delete().eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = taskSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { id, ...updates } = parsed.data;
  if (profile?.role === "sales_representative" && "assigned_to" in updates) {
    return NextResponse.json({ error: "Sales representatives cannot reassign tasks." }, { status: 403 });
  }
  let query = supabase.from("tasks").update(updates).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
