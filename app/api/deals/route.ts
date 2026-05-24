import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { probabilityForStage } from "@/lib/deal-probability";
import { deals } from "@/lib/mock-data";
import { leadStatusForDealStage } from "@/lib/pipeline-status";
import { dealSchema } from "@/validations/crm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const salesRoles = ["sales_manager", "sales_representative"] as const;
const reviewThreshold = 100000;

async function findCompanyId(supabase: Awaited<ReturnType<typeof requireRole>>["supabase"], company: string) {
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("name", company)
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error("Select an existing company before saving this deal.");
  return data.id as string;
}

export async function GET() {
  if (!hasSupabaseEnv()) return NextResponse.json(deals.map((deal) => ({ ...deal, probability: probabilityForStage(deal.stage) })));
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  let query = supabase.from("deals").select("*, assigned_profile:profiles!deals_assigned_to_fkey(full_name), creator:profiles!deals_created_by_fkey(full_name)").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(data.map((deal) => ({ ...deal, probability: probabilityForStage(deal.stage), assigned_user: deal.assigned_profile?.full_name ?? null, created_by_user: deal.creator?.full_name ?? null })));
}

export async function POST(request: Request) {
  const parsed = dealSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.stage === "Lost" && !parsed.data.loss_reason?.trim()) {
    return NextResponse.json({ error: "Loss reason is required when a deal is lost." }, { status: 400 });
  }
  if (parsed.data.stage === "Won" && Number(parsed.data.value ?? 0) >= reviewThreshold && parsed.data.review_status !== "Approved") {
    return NextResponse.json({ error: "Manager approval is required before closing high-value deals." }, { status: 400 });
  }
  const createData = {
    ...parsed.data,
    loss_reason: parsed.data.stage === "Lost" ? parsed.data.loss_reason?.trim() : null,
    probability: probabilityForStage(parsed.data.stage),
    review_status: Number(parsed.data.value ?? 0) >= reviewThreshold && parsed.data.review_status === "Not Required" ? "Pending Review" : parsed.data.review_status,
  };
  if (!hasSupabaseEnv()) return NextResponse.json({ ...createData, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  let companyId: string | null = null;
  try {
    companyId = await findCompanyId(supabase, parsed.data.company);
  } catch (companyError) {
    return handleError(companyError);
  }
  const { data, error: dbError } = await supabase
    .from("deals")
    .insert({ ...createData, company_id: companyId, stage_changed_at: new Date().toISOString(), assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  await supabase.from("activities").insert({
    action: "Deal created",
    entity_type: "deal",
    entity_id: data.id,
    created_by: user.id,
    metadata: {
      title: data.title,
      company: data.company,
      stage: data.stage,
      value: data.value,
      probability: probabilityForStage(data.stage),
    },
  });
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
  const { data: currentDeal, error: currentError } = await supabase
    .from("deals")
    .select("stage, loss_reason, value, review_status")
    .eq("id", id)
    .single();
  if (currentError) return handleError(currentError);
  if (parsedUpdates.stage === "Lost" && !(parsedUpdates.loss_reason?.trim() || currentDeal.loss_reason)) {
    return NextResponse.json({ error: "Loss reason is required when a deal is lost." }, { status: 400 });
  }
  const nextValue = Number(parsedUpdates.value ?? currentDeal.value ?? 0);
  const nextReviewStatus = parsedUpdates.review_status ?? currentDeal.review_status;
  if (parsedUpdates.stage === "Won" && nextValue >= reviewThreshold && nextReviewStatus !== "Approved") {
    return NextResponse.json({ error: "Manager approval is required before closing high-value deals." }, { status: 400 });
  }
  let companyId: string | null | undefined;
  if (parsedUpdates.company) {
    try {
      companyId = await findCompanyId(supabase, parsedUpdates.company);
    } catch (companyError) {
      return handleError(companyError);
    }
  }
  const stageChanged = Boolean(parsedUpdates.stage && parsedUpdates.stage !== currentDeal.stage);
  const updates = parsedUpdates.stage
    ? { ...parsedUpdates, probability: probabilityForStage(parsedUpdates.stage), ...(stageChanged ? { stage_changed_at: new Date().toISOString() } : {}) }
    : parsedUpdates;
  const updatesWithLossReason =
    parsedUpdates.stage && parsedUpdates.stage !== "Lost"
      ? { ...updates, loss_reason: null }
      : parsedUpdates.stage === "Lost" && parsedUpdates.loss_reason
        ? { ...updates, loss_reason: parsedUpdates.loss_reason.trim() }
      : updates;
  const updatesWithCompany = companyId !== undefined ? { ...updatesWithLossReason, company_id: companyId } : updatesWithLossReason;
  const updatesWithReview =
    updatesWithCompany.review_status === "Approved"
      ? { ...updatesWithCompany, reviewed_by: user.id, reviewed_at: new Date().toISOString() }
      : updatesWithCompany;
  if (profile?.role === "sales_representative" && "assigned_to" in updatesWithReview) {
    return NextResponse.json({ error: "Sales representatives cannot reassign deals." }, { status: 403 });
  }
  if (profile?.role === "sales_representative" && "review_status" in updatesWithReview) {
    return NextResponse.json({ error: "Sales representatives cannot approve deals." }, { status: 403 });
  }
  let query = supabase.from("deals").update(updatesWithReview).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  if (updatesWithReview.stage) {
    const leadStatus = leadStatusForDealStage(updatesWithReview.stage);
    if (leadStatus) {
      let leadQuery = supabase.from("leads").update({ status: leadStatus });
      if (data.company_id) {
        leadQuery = leadQuery.eq("company_id", data.company_id);
      } else {
        leadQuery = leadQuery.eq("company", data.company);
      }
      if (profile?.role === "sales_representative") leadQuery = leadQuery.eq("assigned_to", user.id);
      const { error: leadError } = await leadQuery;
      if (leadError) return handleError(leadError);
    }
  }
  await supabase.from("activities").insert({
    action: updates.stage ? `Deal moved to ${updates.stage}` : "Deal updated",
    entity_type: "deal",
    entity_id: id,
    created_by: user.id,
    metadata: {
      ...updatesWithReview,
      title: data.title,
      company: data.company,
      value: data.value,
      probability: probabilityForStage(data.stage),
      stage_changed_at: data.stage_changed_at,
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
