import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { handleError, hasSupabaseEnv, requireRole } from "@/lib/api";
import type { DashboardMetrics } from "@/types/crm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    topSalesRepStats: undefined,
    revenueSeries: [],
    sourceSeries: [],
    pipelineProgress: [
      { name: "Completed", value: 0, color: "#1d4ed8" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Pending", value: 0, color: "#dbeafe" },
      { name: "Lost", value: 0, color: "#bfdbfe" },
    ],
    teamPerformance: [],
    forecastSeries: [],
    velocitySeries: [],
    quotaSeries: [],
    activitySeries: [],
  };
  if (!hasSupabaseEnv()) return NextResponse.json(emptyMetrics);

  const { supabase, user, profile, error } = await requireRole(["sales_manager", "sales_representative"]);
  if (error) return error;

  try {
    let dealsQuery = supabase
      .from("deals")
      .select("id, value, stage, assigned_to, expected_close_date, created_at, forecast_category, profiles:assigned_to(full_name)")
      .order("created_at", { ascending: true });
    let leadsQuery = supabase
      .from("leads")
      .select("id, status, lead_source, created_at, assigned_to, profiles:assigned_to(full_name)")
      .order("created_at", { ascending: true });
    let tasksQuery = supabase
      .from("tasks")
      .select("id, status, due_date, assigned_to, profiles:assigned_to(full_name)")
      .order("due_date", { ascending: true });
    if (profile?.role === "sales_representative") {
      dealsQuery = dealsQuery.eq("assigned_to", user.id);
      leadsQuery = leadsQuery.eq("assigned_to", user.id);
      tasksQuery = tasksQuery.eq("assigned_to", user.id);
    }
    const [{ data: deals, error: dealsError }, { data: leads, error: leadsError }, { data: tasks, error: tasksError }] = await Promise.all([
      dealsQuery,
      leadsQuery,
      tasksQuery,
    ]);

    if (dealsError) throw dealsError;
    if (leadsError) throw leadsError;
    if (tasksError) throw tasksError;

    let leaderboardDeals = deals;
    let leaderboardLeads = leads;
    let leaderboardTasks = tasks;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (profile?.role === "sales_representative" && serviceRoleKey && supabaseUrl) {
      const adminClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const [
        { data: allDeals, error: allDealsError },
        { data: allLeads, error: allLeadsError },
        { data: allTasks, error: allTasksError },
      ] = await Promise.all([
        adminClient
          .from("deals")
          .select("id, value, stage, assigned_to, expected_close_date, created_at, forecast_category, profiles:assigned_to(full_name)")
          .order("created_at", { ascending: true }),
        adminClient
          .from("leads")
          .select("id, status, lead_source, created_at, assigned_to, profiles:assigned_to(full_name)")
          .order("created_at", { ascending: true }),
        adminClient
          .from("tasks")
          .select("id, status, due_date, assigned_to, profiles:assigned_to(full_name)")
          .order("due_date", { ascending: true }),
      ]);
      if (allDealsError) throw allDealsError;
      if (allLeadsError) throw allLeadsError;
      if (allTasksError) throw allTasksError;
      leaderboardDeals = allDeals ?? [];
      leaderboardLeads = allLeads ?? [];
      leaderboardTasks = allTasks ?? [];
    }

    const totalDealsClosed = deals.filter((deal) => deal.stage === "Won").length;
    const revenueGenerated = deals
      .filter((deal) => deal.stage === "Won")
      .reduce((sum, deal) => sum + Number(deal.value ?? 0), 0);
    const wonLeads = leads.filter((lead) => lead.status === "Won").length;
    const conversionRate = leads.length ? Math.round((wonLeads / leads.length) * 100) : 0;

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
          (((stageCounts.get("Contacted") ?? 0) + (stageCounts.get("Negotiation") ?? 0) + (stageCounts.get("Proposal Sent") ?? 0) + (stageCounts.get("Qualified") ?? 0)) /
            totalDeals) *
            100,
        ),
        color: "#3b82f6",
      },
      { name: "Pending", value: Math.round(((stageCounts.get("New Lead") ?? 0) / totalDeals) * 100), color: "#dbeafe" },
      { name: "Lost", value: Math.round(((stageCounts.get("Lost") ?? 0) / totalDeals) * 100), color: "#bfdbfe" },
    ];

    const buildRepPerformance = (
      repDeals: typeof deals,
      repLeads: typeof leads,
      repTasks: typeof tasks,
    ) => {
      const repTotals = new Map<string, { assignedLeads: number; activeDeals: number; wonDeals: number; lostDeals: number; overdueTasks: number; revenue: number }>();
      const ensureRep = (name: string) => {
        const existing = repTotals.get(name) ?? { assignedLeads: 0, activeDeals: 0, wonDeals: 0, lostDeals: 0, overdueTasks: 0, revenue: 0 };
        repTotals.set(name, existing);
        return existing;
      };
      for (const lead of repLeads) {
        const repName = joinedProfileName(lead.profiles) ?? "Unassigned";
        ensureRep(repName).assignedLeads += 1;
      }
      for (const deal of repDeals) {
        const repName = joinedProfileName(deal.profiles) ?? "Unassigned";
        const totals = ensureRep(repName);
        if (deal.stage === "Won") {
          totals.wonDeals += 1;
          totals.revenue += Number(deal.value ?? 0);
        } else if (deal.stage === "Lost") {
          totals.lostDeals += 1;
        } else {
          totals.activeDeals += 1;
        }
      }
      const today = new Date();
      const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      for (const task of repTasks) {
        const repName = joinedProfileName(task.profiles) ?? "Unassigned";
        const dueTime = task.due_date ? new Date(task.due_date).getTime() : null;
        if (task.status !== "Done" && dueTime !== null && dueTime < todayKey) ensureRep(repName).overdueTasks += 1;
      }
      return Array.from(repTotals.entries())
        .map(([name, totals]) => ({
          name,
          assignedLeads: totals.assignedLeads,
          activeDeals: totals.activeDeals,
          wonDeals: totals.wonDeals,
          lostDeals: totals.lostDeals,
          winRate: totals.wonDeals + totals.lostDeals ? Math.round((totals.wonDeals / (totals.wonDeals + totals.lostDeals)) * 100) : 0,
          overdueTasks: totals.overdueTasks,
          revenue: totals.revenue,
        }))
        .sort((a, b) => {
          if (b.wonDeals !== a.wonDeals) return b.wonDeals - a.wonDeals;
          if (b.revenue !== a.revenue) return b.revenue - a.revenue;
          if (b.activeDeals !== a.activeDeals) return b.activeDeals - a.activeDeals;
          return b.assignedLeads - a.assignedLeads;
        });
    };

    const teamPerformance = buildRepPerformance(deals, leads, tasks);
    const leaderboard = buildRepPerformance(leaderboardDeals, leaderboardLeads, leaderboardTasks);
    const topSalesRepStats = leaderboard[0]
      ? {
          name: leaderboard[0].name,
          assignedLeads: leaderboard[0].assignedLeads,
          activeDeals: leaderboard[0].activeDeals,
          wonDeals: leaderboard[0].wonDeals,
          revenue: leaderboard[0].revenue,
        }
      : undefined;
    const forecastByMonth = new Map<string, { month: string; commit: number; bestCase: number; pipeline: number }>();
    for (const deal of deals.filter((item) => item.stage !== "Won" && item.stage !== "Lost")) {
      const date = deal.expected_close_date ?? deal.created_at;
      const month = new Date(date).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      const bucket = forecastByMonth.get(month) ?? { month, commit: 0, bestCase: 0, pipeline: 0 };
      const value = Number(deal.value ?? 0);
      if (deal.forecast_category === "Commit") bucket.commit += value;
      else if (deal.forecast_category === "Best Case") bucket.bestCase += value;
      else bucket.pipeline += value;
      forecastByMonth.set(month, bucket);
    }

    const response: DashboardMetrics = {
      totalDealsClosed,
      revenueGenerated,
      conversionRate,
      topSalesRep: topSalesRepStats?.name ?? "No rep yet",
      topSalesRepStats,
      revenueSeries,
      sourceSeries,
      pipelineProgress,
      teamPerformance,
      forecastSeries: Array.from(forecastByMonth.values()),
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
              monthlyQuota: 75000,
              quarterlyQuota: 225000,
              revenue: item.revenue,
              attainment: Math.round((item.revenue / 75000) * 100),
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
