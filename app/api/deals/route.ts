import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { probabilityForStage } from "@/lib/deal-probability";
import { deals } from "@/lib/mock-data";
import { dealSchema } from "@/validations/crm";
import { z } from "zod";

const salesRoles = ["sales_manager", "sales_representative"] as const;

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(deals.map((deal) => ({ ...deal, probability: probabilityForStage(deal.stage) })));
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("deals").select("*, profiles:assigned_to(full_name)").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data.map((deal) => ({ ...deal, probability: probabilityForStage(deal.stage), assigned_user: deal.profiles?.full_name ?? null })));
}

export async function POST(request: Request) {
  const parsed = dealSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const createData = { ...parsed.data, probability: probabilityForStage(parsed.data.stage) };
  if (!hasSupabaseEnv()) return NextResponse.json({ ...createData, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { data, error: dbError } = await supabase
    .from("deals")
    .insert({ ...createData, assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const parsed = dealSchema.partial().extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json(body);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { id, ...parsedUpdates } = parsed.data;
  const updates = parsedUpdates.stage
    ? { ...parsedUpdates, probability: probabilityForStage(parsedUpdates.stage) }
    : parsedUpdates;
  if (profile?.role === "sales_representative" && "assigned_to" in updates) {
    return NextResponse.json({ error: "Sales representatives cannot reassign deals." }, { status: 403 });
  }
  let query = supabase.from("deals").update(updates).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  await supabase.from("activities").insert({
    action: updates.stage ? `Deal moved to ${updates.stage}` : "Deal updated",
    entity_type: "deal",
    entity_id: id,
    created_by: user.id,
    metadata: {
      ...updates,
      title: data.title,
      company: data.company,
      value: data.value,
      probability: probabilityForStage(data.stage),
    },
  });
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  if (!id || typeof id !== "string") return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ok: true });
  const { supabase, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { error: dbError } = await supabase.from("deals").delete().eq("id", id);
  if (dbError) return handleError(dbError);
  return NextResponse.json({ ok: true });
}
