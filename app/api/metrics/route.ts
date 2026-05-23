import { NextResponse } from "next/server";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import type { DashboardMetrics } from "@/types/crm";

function joinedProfileName(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0]?.full_name === "string" ? value[0].full_name : undefined;
  }
  if (value && typeof value === "object" && "full_name" in value) {
    const fullName = (value as { full_name?: unknown }).full_name;
    return typeof fullName === "string" ? fullName : undefined;
  }
  return undefined;
}

export async function GET() {
  const emptyMetrics: DashboardMetrics = {
    totalDealsClosed: 0,
    revenueGenerated: 0,
    conversionRate: 0,
    topSalesRep: "No rep yet",
    revenueSeries: [],
    sourceSeries: [],
    pipelineProgress: [
      { name: "Completed", value: 0, color: "#1d4ed8" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Pending", value: 0, color: "#dbeafe" },
    ],
    teamPerformance: [],
    forecastSeries: [],
    velocitySeries: [],
    quotaSeries: [],
    activitySeries: [],
  };
  if (!hasSupabaseEnv()) return NextResponse.json(emptyMetrics);

  const { supabase, error } = await requireRole(["sales_manager", "sales_representative"]);
  if (error) return error;

  try {
    const [{ data: deals, error: dealsError }, { data: leads, error: leadsError }] = await Promise.all([
      supabase
        .from("deals")
        .select("id, value, stage, assigned_to, expected_close_date, created_at, profiles:assigned_to(full_name)")
        .order("created_at", { ascending: true }),
      supabase
        .from("leads")
        .select("id, status, lead_source, created_at, assigned_to, profiles:assigned_to(full_name)")
        .order("created_at", { ascending: true }),
    ]);

    if (dealsError) throw dealsError;
    if (leadsError) throw leadsError;

    const totalDealsClosed = deals.filter((deal) => deal.stage === "Won").length;
    const revenueGenerated = deals
      .filter((deal) => deal.stage === "Won")
      .reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
    const closedLeads = leads.filter((lead) => lead.status === "Won" || lead.status === "Lost").length;
    const wonLeads = leads.filter((lead) => lead.status === "Won").length;
    const conversionRate = closedLeads ? Math.round((wonLeads / closedLeads) * 100) : 0;

    const revenueByMonth = new Map<string, number>();
    for (const deal of deals) {
      const date = deal.expected_close_date ?? deal.created_at;
      const key = new Date(date).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(deal.value ?? 0));
    }

    const revenueSeries = Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({
      month,
      revenue,
      target: Math.round(revenue * 1.1),
    }));

    const sourceCounts = new Map<string, number>();
    for (const lead of leads) {
      sourceCounts.set(lead.lead_source, (sourceCounts.get(lead.lead_source) ?? 0) + 1);
    }

    const sourceSeries = Array.from(sourceCounts.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const stageCounts = new Map<string, number>();
    for (const deal of deals) {
      stageCounts.set(deal.stage, (stageCounts.get(deal.stage) ?? 0) + 1);
    }

    const totalDeals = deals.length || 1;
    const pipelineProgress = [
      { name: "Completed", value: Math.round(((stageCounts.get("Won") ?? 0) / totalDeals) * 100), color: "#1d4ed8" },
      {
        name: "In Progress",
        value: Math.round(
          (((stageCounts.get("Negotiation") ?? 0) + (stageCounts.get("Proposal Sent") ?? 0) + (stageCounts.get("Qualified") ?? 0)) /
            totalDeals) *
            100,
        ),
        color: "#3b82f6",
      },
      { name: "Pending", value: Math.round(((stageCounts.get("New Lead") ?? 0) / totalDeals) * 100), color: "#dbeafe" },
    ];

    const repTotals = new Map<string, { deals: number; revenue: number }>();
    for (const deal of deals) {
      const repName = joinedProfileName(deal.profiles) ?? "Unassigned";
      const existing = repTotals.get(repName) ?? { deals: 0, revenue: 0 };
      repTotals.set(repName, {
        deals: existing.deals + 1,
        revenue: existing.revenue + Number(deal.value ?? 0),
      });
    }

    const teamPerformance = Array.from(repTotals.entries())
      .map(([name, totals]) => ({
        name,
        deals: totals.deals,
        revenue: totals.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const response: DashboardMetrics = {
      totalDealsClosed,
      revenueGenerated,
      conversionRate,
      topSalesRep: teamPerformance[0]?.name ?? "No rep yet",
      revenueSeries,
      sourceSeries,
      pipelineProgress,
      teamPerformance,
      forecastSeries:
        revenueSeries.length > 0
          ? revenueSeries.map((item) => ({
              month: item.month,
              committed: Math.round(item.revenue * 0.82),
              forecast: item.target,
            }))
          : [],
      velocitySeries:
        deals.length > 0
          ? [
              { stage: "New Lead", days: 4 },
              { stage: "Contacted", days: 7 },
              { stage: "Qualified", days: 11 },
              { stage: "Proposal", days: 13 },
              { stage: "Negotiation", days: 9 },
              { stage: "Won", days: 5 },
            ]
          : [],
      quotaSeries:
        teamPerformance.length > 0
          ? teamPerformance.map((item) => ({
              name: item.name,
              quota: Math.round(item.revenue * 1.15),
              revenue: item.revenue,
            }))
          : [],
      activitySeries:
        leads.length > 0
          ? [
              { week: "W1", calls: leads.length * 6, demos: Math.max(2, Math.round(leads.length * 1.6)) },
              { week: "W2", calls: leads.length * 7, demos: Math.max(3, Math.round(leads.length * 1.9)) },
              { week: "W3", calls: leads.length * 5, demos: Math.max(2, Math.round(leads.length * 1.4)) },
              { week: "W4", calls: leads.length * 8, demos: Math.max(4, Math.round(leads.length * 2.2)) },
              { week: "W5", calls: leads.length * 7, demos: Math.max(3, Math.round(leads.length * 2.0)) },
            ]
          : [],
    };

    return NextResponse.json(response);
  } catch (caughtError) {
    return handleError(caughtError);
  }
}
