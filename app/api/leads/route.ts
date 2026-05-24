import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { probabilityForStage } from "@/lib/deal-probability";
import { leads } from "@/lib/mock-data";
import { leadStatusToDealStage } from "@/lib/pipeline-status";
import { leadSchema } from "@/validations/crm";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const salesRoles = ["sales_manager", "sales_representative"] as const;

async function ensureLeadCompany(supabase: Awaited<ReturnType<typeof requireRole>>["supabase"], lead: { company: string; company_id?: string | null; email?: string | null }) {
  if (lead.company_id) return lead.company_id;
  const { data: existingCompany, error: findError } = await supabase
    .from("companies")
    .select("id")
    .eq("name", lead.company)
    .maybeSingle();
  if (findError) throw findError;
  if (existingCompany?.id) return existingCompany.id;
  throw new Error("Select an existing company before saving this lead.");
}

async function ensureWonLeadContact(supabase: Awaited<ReturnType<typeof requireRole>>["supabase"], lead: {
  id: string;
  full_name: string;
  company: string;
  company_id?: string | null;
  email: string;
  phone: string;
  assigned_to?: string | null;
}, userId: string) {
  const companyId = await ensureLeadCompany(supabase, lead);
  if (!lead.company_id) {
    await supabase.from("leads").update({ company_id: companyId }).eq("id", lead.id);
  }
  const contactPayload = {
    full_name: lead.full_name,
    company: lead.company,
    company_id: companyId,
    email: lead.email,
    phone: lead.phone,
    title: "Customer",
    assigned_to: lead.assigned_to ?? userId,
    created_by: userId,
  };
  const { data: existingContact, error: findContactError } = await supabase
    .from("contacts")
    .select("id")
    .eq("email", lead.email)
    .maybeSingle();
  if (findContactError) throw findContactError;
  if (existingContact?.id) {
    const { error: updateContactError } = await supabase
      .from("contacts")
      .update(contactPayload)
      .eq("id", existingContact.id);
    if (updateContactError) throw updateContactError;
    return existingContact.id as string;
  }
  const { data: contact, error: createContactError } = await supabase
    .from("contacts")
    .insert(contactPayload)
    .select("id")
    .single();
  if (createContactError) throw createContactError;
  return contact.id as string;
}

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json(leads);
  const { supabase, user, profile, error } = await requireRole([...salesRoles]);
  if (error) return error;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  let query = supabase.from("leads").select("*, assigned_profile:profiles!leads_assigned_to_fkey(full_name), creator:profiles!leads_created_by_fkey(full_name)").order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  if (q) query = query.or(`full_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  return NextResponse.json(
    data.map((lead) => ({ ...lead, assigned_user: lead.assigned_profile?.full_name ?? null, created_by_user: lead.creator?.full_name ?? null })),
  );
}

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (!hasSupabaseEnv()) return NextResponse.json({ ...parsed.data, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const { data: duplicate, error: duplicateError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", parsed.data.email)
    .maybeSingle();
  if (duplicateError) return handleError(duplicateError);
  if (duplicate?.id) return NextResponse.json({ error: "A lead with this email already exists." }, { status: 409 });
  let companyId: string;
  try {
    companyId = await ensureLeadCompany(supabase, parsed.data);
  } catch (companyError) {
    return handleError(companyError);
  }
  const { data, error: dbError } = await supabase
    .from("leads")
    .insert({ ...parsed.data, company_id: companyId, assigned_to: parsed.data.assigned_to ?? user.id, created_by: user.id })
    .select()
    .single();
  if (dbError) return handleError(dbError);
  await supabase.from("activities").insert({
    action: "Lead created",
    entity_type: "lead",
    entity_id: data.id,
    created_by: user.id,
    metadata: {
      title: data.full_name,
      company: data.company,
      status: data.status,
      assigned_to: data.assigned_to,
    },
  });
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
  if (updates.email) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("leads")
      .select("id")
      .eq("email", updates.email)
      .neq("id", id)
      .limit(1)
      .maybeSingle();
    if (duplicateError) return handleError(duplicateError);
    if (duplicate?.id) return NextResponse.json({ error: "A lead with this email already exists." }, { status: 409 });
  }
  let companyId: string | undefined;
  if (updates.company) {
    try {
      companyId = await ensureLeadCompany(supabase, updates as { company: string; company_id?: string | null; email?: string | null });
    } catch (companyError) {
      return handleError(companyError);
    }
  }
  const updatesWithCompany = companyId ? { ...updates, company_id: companyId } : updates;
  let query = supabase.from("leads").update(updatesWithCompany).eq("id", id);
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query.select().single();
  if (dbError) return handleError(dbError);
  if (updates.status) {
    const dealStage = leadStatusToDealStage[updates.status];
    const dealUpdates = {
      stage: dealStage,
      probability: probabilityForStage(dealStage),
      stage_changed_at: new Date().toISOString(),
      loss_reason: dealStage === "Lost" ? (data.notes || "Lead marked lost") : null,
    };
    let dealQuery = supabase
      .from("deals")
      .update(dealUpdates);
    if (data.company_id) {
      dealQuery = dealQuery.eq("company_id", data.company_id);
    } else {
      dealQuery = dealQuery.eq("company", data.company);
    }
    if (profile?.role === "sales_representative") dealQuery = dealQuery.eq("assigned_to", user.id);
    const { error: dealError } = await dealQuery;
    if (dealError) return handleError(dealError);
    if (data.company_id) {
      let legacyDealQuery = supabase
        .from("deals")
        .update(dealUpdates)
        .eq("company", data.company)
        .is("company_id", null);
      if (profile?.role === "sales_representative") legacyDealQuery = legacyDealQuery.eq("assigned_to", user.id);
      const { error: legacyDealError } = await legacyDealQuery;
      if (legacyDealError) return handleError(legacyDealError);
    }
    if (updates.status === "Won") {
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const writeClient = serviceRoleKey && supabaseUrl
          ? createSupabaseAdmin(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
          : supabase;
        const contactId = await ensureWonLeadContact(writeClient, data, user.id);
        await supabase.from("activities").insert({
          action: "Lead converted to contact",
          entity_type: "lead",
          entity_id: data.id,
          created_by: user.id,
          metadata: {
            title: data.full_name,
            company: data.company,
            contact_id: contactId,
          },
        });
      } catch (conversionError) {
        return handleError(conversionError);
      }
    }
  }
  await supabase.from("activities").insert({
    action: updates.status ? `Lead moved to ${updates.status}` : "Lead updated",
    entity_type: "lead",
    entity_id: data.id,
    created_by: user.id,
    metadata: {
      ...updatesWithCompany,
      title: data.full_name,
      company: data.company,
      status: data.status,
      assigned_to: data.assigned_to,
    },
  });
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
