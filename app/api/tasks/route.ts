import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { tasks } from "@/lib/mock-data";
import { taskSchema } from "@/validations/crm";
import { z } from "zod";

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(tasks);
  const { supabase, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { data, error: dbError } = await supabase.from("tasks").select("*").order("due_date", { ascending: true });
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { data, error: dbError } = await supabase.from("tasks").insert({ ...parsed.data, assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id }).select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing task id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { error: dbError } = await supabase.from("tasks").delete().eq("id", id);
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = taskSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { id, ...updates } = parsed.data;
  const { data, error: dbError } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
