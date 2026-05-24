import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import { leadSchema } from "@/validations/crm";

export const dynamic = "force-dynamic";

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim());
  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ inserted: 0, skipped: 0 });
  const { supabase, user, error } = await requireRole(["sales_manager"]);
  if (error) return error;
  const rows = parseCsv(await request.text());
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    const parsed = leadSchema.safeParse({
      full_name: row.full_name,
      company: row.company,
      email: row.email,
      phone: row.phone,
      status: row.status || "New",
      lead_source: row.lead_source || "CSV Import",
      last_contacted: row.last_contacted || null,
      notes: row.notes || null,
      assigned_to: null,
    });
    if (!parsed.success) {
      skipped += 1;
      continue;
    }
    const [{ data: company }, { data: duplicate }] = await Promise.all([
      supabase.from("companies").select("id").eq("name", parsed.data.company).maybeSingle(),
      supabase.from("leads").select("id").eq("email", parsed.data.email).maybeSingle(),
    ]);
    if (!company?.id || duplicate?.id) {
      skipped += 1;
      continue;
    }
    const { error: insertError } = await supabase.from("leads").insert({
      ...parsed.data,
      company_id: company.id,
      assigned_to: user.id,
      created_by: user.id,
    });
    if (insertError) return handleError(insertError);
    inserted += 1;
  }
  return NextResponse.json({ inserted, skipped });
}
