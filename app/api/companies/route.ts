import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { companies } from "@/lib/mock-data";
import { companySchema } from "@/validations/crm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(companies);
  const { supabase, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { data, error: dbError } = await supabase.from("companies").select("*").order("name");
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const parsed = companySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { data, error: dbError } = await supabase.from("companies").insert({ ...parsed.data, created_by: user.id }).select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing company id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { error: dbError } = await supabase.from("companies").delete().eq("id", id);
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = companySchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...body, updated_at: new Date().toISOString() });
  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { id, ...updates } = parsed.data;
  const { data, error: dbError } = await supabase.from("companies").update(updates).eq("id", id).select().single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}
