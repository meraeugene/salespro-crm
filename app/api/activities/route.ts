import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { activityLogSchema } from "@/validations/crm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = activityLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid activity." }, { status: 400 });
  }
  const values = parsed.data;
  if (!hasSupabaseEnv()) {
    return NextResponse.json({
      id: crypto.randomUUID(),
      action: values.scheduled_at ? `${values.activity_type} scheduled` : `${values.activity_type} logged`,
      entity_type: values.entity_type,
      entity_id: values.entity_id ?? null,
      metadata: values,
      created_at: new Date().toISOString(),
    });
  }
  const { supabase, user, error } = await requireRole([...salesRoles]);
  if (error) return error;

  const { data, error: dbError } = await supabase
    .from("activities")
    .insert({
      action: values.scheduled_at ? `${values.activity_type} scheduled` : `${values.activity_type} logged`,
      entity_type: values.entity_type,
      entity_id: values.entity_id ?? null,
      metadata: {
        activity_type: values.activity_type,
        subject: values.subject,
        body: values.body,
        outcome: values.outcome ?? null,
        scheduled_at: values.scheduled_at ?? null,
      },
      created_by: user.id,
    })
    .select("*")
    .single();
  if (dbError) return handleError(dbError);
  return NextResponse.json(data, { status: 201 });
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
