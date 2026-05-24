import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";

export const dynamic = "force-dynamic";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function joinedName(value: unknown) {
  if (Array.isArray(value)) return typeof value[0]?.full_name === "string" ? value[0].full_name : "";
  if (value && typeof value === "object" && "full_name" in value) {
    const fullName = (value as { full_name?: unknown }).full_name;
    return typeof fullName === "string" ? fullName : "";
  }
  return "";
}

export async function GET() {
  if (!hasSupabaseEnv()) return new Response("full_name,company,email,phone,status,lead_source,assigned_user,last_contacted,notes\n", { headers: { "content-type": "text/csv" } });
  const { supabase, user, profile, error } = await requireRole(["sales_manager", "sales_representative"]);
  if (error) return error;
  let query = supabase
    .from("leads")
    .select("full_name, company, email, phone, status, lead_source, last_contacted, notes, assigned_profile:profiles!leads_assigned_to_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  const rows = [
    ["full_name", "company", "email", "phone", "status", "lead_source", "assigned_user", "last_contacted", "notes"],
    ...(data ?? []).map((lead) => [
      lead.full_name,
      lead.company,
      lead.email,
      lead.phone,
      lead.status,
      lead.lead_source,
      joinedName(lead.assigned_profile),
      lead.last_contacted ?? "",
      lead.notes ?? "",
    ]),
  ];
  return new Response(rows.map((row) => row.map(csvEscape).join(",")).join("\n"), {
    headers: {
      "content-disposition": "attachment; filename=leads.csv",
      "content-type": "text/csv; charset=utf-8",
    },
  });
}
