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
  if (!hasSupabaseEnv()) return new Response("full_name,company,email,phone,title,preferred_contact_method,timezone,best_time_to_contact,assigned_user\n", { headers: { "content-type": "text/csv" } });
  const { supabase, user, profile, error } = await requireRole(["sales_manager", "sales_representative"]);
  if (error) return error;
  let query = supabase
    .from("contacts")
    .select("full_name, company, email, phone, title, preferred_contact_method, timezone, best_time_to_contact, assigned_profile:profiles!contacts_assigned_to_fkey(full_name)")
    .order("created_at", { ascending: false });
  if (profile?.role === "sales_representative") query = query.eq("assigned_to", user.id);
  const { data, error: dbError } = await query;
  if (dbError) return handleError(dbError);
  const rows = [
    ["full_name", "company", "email", "phone", "title", "preferred_contact_method", "timezone", "best_time_to_contact", "assigned_user"],
    ...(data ?? []).map((contact) => [
      contact.full_name,
      contact.company,
      contact.email,
      contact.phone,
      contact.title,
      contact.preferred_contact_method,
      contact.timezone,
      contact.best_time_to_contact,
      joinedName(contact.assigned_profile),
    ]),
  ];
  return new Response(rows.map((row) => row.map(csvEscape).join(",")).join("\n"), {
    headers: {
      "content-disposition": "attachment; filename=contacts.csv",
      "content-type": "text/csv; charset=utf-8",
    },
  });
}
