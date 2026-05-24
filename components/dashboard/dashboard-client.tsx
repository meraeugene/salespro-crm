"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Handshake, MoreVertical, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTable } from "@/components/tables/leads-table";
import { ProgressChart } from "@/components/charts/progress-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { useLeads, useMe, useMetrics } from "@/hooks/use-crm";
import { currency } from "@/lib/utils";

const statIcons = [Handshake, WalletCards, TrendingUp, Crown];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardClient() {
  const [period, setPeriod] = useState("yearly");
  const [analyticsView, setAnalyticsView] = useState("product");
  const { data: me } = useMe();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();
  const { data: leads, isLoading: leadsLoading } = useLeads();

  if (metricsLoading || !metrics) return <DashboardSkeleton />;

  const stats = [
    { label: "Total Deals Closed", value: metrics.totalDealsClosed.toLocaleString(), delta: "+12%", positive: false, iconClass: "text-indigo-600" },
    { label: "Revenue Generated", value: currency(metrics.revenueGenerated), delta: "+10%", positive: true, iconClass: "text-emerald-600" },
    { label: "Sales Conversion Rate", value: `${metrics.conversionRate}%`, delta: "+3%", positive: false, iconClass: "text-blue-600" },
    { label: "Top Sales Rep", value: metrics.topSalesRep, delta: "15 deals closed", positive: true, iconClass: "text-amber-600" },
  ];
  const periodLimit = period === "weekly" ? 4 : period === "monthly" ? 6 : metrics.revenueSeries.length;
  const revenueSeries = metrics.revenueSeries.slice(-periodLimit);
  const analyticsTitle = analyticsView === "revenue" ? "Monthly sales" : "Total Product insights";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {me ? <Badge className="mb-2 border-blue-200 bg-blue-50 text-blue-700">{me.role_label}</Badge> : null}
            <span className="block">
            {greeting()}, {me?.full_name ?? "Sales User"}
            </span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-muted">Review pipeline health, assigned work, and revenue progress before prioritizing the day.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Select className="w-32 cursor-pointer" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = statIcons[index];
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${stat.iconClass}`} />
                    <CardTitle className="text-sm text-muted">{stat.label}</CardTitle>
                  </div>
                  <MoreVertical className="h-5 w-5 text-muted" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <div className={stat.label === "Top Sales Rep" ? "text-2xl font-semibold tracking-tight" : "text-4xl font-semibold tracking-tight"}>{stat.value}</div>
                      <div className="mt-2 flex items-center gap-1 text-sm">
                        <span>{stat.delta}</span>
                        {stat.positive ? <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> : <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                      </div>
                    </div>
                    <div className="flex h-16 items-end gap-2">
                      {[36, 58, 28].map((height, barIndex) => (
                        <span
                          key={barIndex}
                          className="w-7 rounded-t-md bg-gradient-to-t from-primary/30 to-primary/80"
                          style={{ height }}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>{analyticsTitle}</CardTitle>
            <Select className="w-56 cursor-pointer" value={analyticsView} onChange={(event) => setAnalyticsView(event.target.value)}>
              <option value="product">Total Product insights</option>
              <option value="revenue">Monthly sales</option>
            </Select>
          </CardHeader>
          <CardContent>
            {revenueSeries.length ? (
              <RevenueChart data={revenueSeries} />
            ) : (
              <EmptyState title="No data yet" description="Create leads and deals to populate this chart." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal Status</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.pipelineProgress.some((item) => item.value > 0) ? (
              <ProgressChart data={metrics.pipelineProgress} />
            ) : (
              <EmptyState title="No data yet" description="Create deals to see won, active, and pending opportunities." />
            )}
          </CardContent>
        </Card>
      </div>

      <LeadsTable leads={leads} isLoading={leadsLoading} />
    </div>
  );
}
