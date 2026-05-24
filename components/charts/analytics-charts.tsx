"use client";

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BadgeCheck, ChartNoAxesColumnIncreasing, Globe2, Handshake, Link2, Megaphone, MousePointerClick, Radio, Send, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardMetrics } from "@/types/crm";

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #dbe6f3",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  backgroundColor: "#ffffff",
};

function formatCurrency(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function formatDays(value: unknown) {
  return `${Number(value ?? 0)} days`;
}

function formatPercent(value: unknown) {
  return `${Number(value ?? 0)}%`;
}

function ChartEmpty({ description = "Create leads and deals to populate this chart." }: { description?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <EmptyState className="h-full" title="No data yet" description={description} />
    </div>
  );
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function SummaryBar({
  label,
  value,
  total,
  color = "#2563eb",
  bgClassName = "bg-slate-50/70",
  icon,
  valueLabel,
}: {
  label: string;
  value: number;
  total: number;
  color?: string;
  bgClassName?: string;
  icon?: ReactNode;
  valueLabel?: string;
}) {
  const width = total ? Math.max(4, (value / total) * 100) : 0;
  return (
    <div className={`rounded-lg border border-border p-3 ${bgClassName}`}>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="inline-flex min-w-0 items-center gap-2 font-medium">
          {icon ? <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">{icon}</span> : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="font-semibold">{valueLabel ?? value.toLocaleString()}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1 text-xs text-muted">{percent(value, total)}% of total</p>
    </div>
  );
}

export function AnalyticsCharts({ metrics }: { metrics: DashboardMetrics }) {
  const pipelinePalette: Record<string, string> = {
    Completed: "#1d4ed8",
    "In Progress": "#3b82f6",
    Pending: "#93c5fd",
  };
  const pipelineLabels: Record<string, string> = {
    Completed: "Closed won deals",
    "In Progress": "Open active deals",
    Pending: "New deals",
    Lost: "Closed lost deals",
  };
  const pipelineHealth = metrics.pipelineProgress
    .map((item) => ({ ...item, color: pipelinePalette[item.name] ?? "#2563eb", name: pipelineLabels[item.name] ?? item.name }))
    .filter((item) => item.value > 0);
  const closedWonShare = metrics.pipelineProgress.find((item) => item.name === "Completed")?.value ?? 0;
  const sourceTotal = metrics.sourceSeries.reduce((sum, item) => sum + item.value, 0);
  const sourceStyles = [
    { bg: "bg-blue-50/80", color: "#1d4ed8" },
    { bg: "bg-sky-50/80", color: "#0284c7" },
    { bg: "bg-indigo-50/80", color: "#4f46e5" },
    { bg: "bg-cyan-50/80", color: "#0891b2" },
    { bg: "bg-blue-100/70", color: "#2563eb" },
    { bg: "bg-slate-100", color: "#3b82f6" },
  ];
  const sourceIcons = [Radio, Handshake, Link2, Globe2, Megaphone, UsersRound, Send, MousePointerClick];
  const quotaData = metrics.quotaSeries.map((item) => ({
    ...item,
    shortName: item.name.split(/\s+/).slice(0, 2).join(" "),
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="overflow-hidden xl:col-span-2">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Manager Scorecard</CardTitle>
            <p className="mt-1 text-sm text-muted">Rep-level workload, win rate, overdue work, and closed revenue in one place.</p>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.teamPerformance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-border">
                    <th className="py-3 font-medium">Rep</th>
                    <th className="py-3 font-medium">Leads</th>
                    <th className="py-3 font-medium">Active deals</th>
                    <th className="py-3 font-medium">Won / Lost</th>
                    <th className="py-3 font-medium">Win rate</th>
                    <th className="py-3 font-medium">Overdue tasks</th>
                    <th className="py-3 font-medium">Closed revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.teamPerformance.map((rep) => (
                    <tr key={rep.name} className="border-b border-border last:border-0">
                      <td className="py-3 font-semibold">{rep.name}</td>
                      <td className="py-3 text-muted">{rep.assignedLeads}</td>
                      <td className="py-3 text-muted">{rep.activeDeals}</td>
                      <td className="py-3 text-muted">{rep.wonDeals} / {rep.lostDeals}</td>
                      <td className="py-3">
                        <span className="inline-flex min-w-14 justify-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary">
                          {rep.winRate}%
                        </span>
                      </td>
                      <td className={rep.overdueTasks ? "py-3 font-semibold text-primary" : "py-3 text-muted"}>{rep.overdueTasks}</td>
                      <td className="py-3 font-semibold">{formatCurrency(rep.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No team data yet" description="Assign leads, deals, and tasks to reps to populate this table." />
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Quota Attainment</CardTitle>
            <p className="mt-1 text-sm text-muted">Booked revenue compared with each rep's monthly quota.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {quotaData.length ? (
            <ResponsiveContainer>
              <BarChart data={quotaData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="shortName" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={formatCurrency} />
                <Bar dataKey="monthlyQuota" name="Monthly quota" fill="#dbeafe" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" name="Closed revenue" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty description="Closed deals will show quota progress by rep." />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Expected Revenue By Month</CardTitle>
            <p className="mt-1 text-sm text-muted">Pipeline value by expected close month against the current target.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.revenueSeries.length ? (
            <ResponsiveContainer>
              <BarChart data={metrics.revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={formatCurrency} />
                <Bar dataKey="target" name="Target" fill="#dbeafe" radius={[8, 8, 0, 0]} />
                <Bar dataKey="revenue" name="Expected revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty description="Deals with close dates will show expected revenue by month." />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden xl:col-span-2">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Deal Status Breakdown</CardTitle>
            <p className="mt-1 text-sm text-muted">Shows what share of deals are closed won, open active, or newly created.</p>
          </div>
        </CardHeader>
        <CardContent>
          {pipelineHealth.length ? (
            <div className="space-y-4">
              <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={pipelineHealth} layout="vertical" margin={{ top: 8, right: 36, left: 32, bottom: 8 }}>
                  <CartesianGrid stroke="#e8eef7" horizontal={false} strokeDasharray="4 4" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#111827", fontSize: 12 }} width={132} />
                  <Tooltip contentStyle={tooltipStyle} formatter={formatPercent} />
                  <Bar dataKey="value" name="Deal share" radius={[0, 8, 8, 0]}>
                    {pipelineHealth.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {pipelineHealth.map((item) => (
                  <div key={item.name} className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                        {item.name === "Closed won deals" ? <BadgeCheck className="h-4 w-4" /> : item.name === "Open active deals" ? <ChartNoAxesColumnIncreasing className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      </span>
                      {item.name}
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{item.value}%</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted">
                Closed won deals currently make up <span className="font-semibold text-foreground">{closedWonShare}%</span> of tracked deals.
              </p>
            </div>
          ) : <EmptyState title="No pipeline status yet" description="Deals will appear here once the pipeline has activity." />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden xl:col-span-2">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Lead Sources</CardTitle>
            <p className="mt-1 text-sm text-muted">Where current leads are coming from, ranked by volume.</p>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.sourceSeries.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {metrics.sourceSeries
                .slice()
                .sort((a, b) => b.value - a.value)
                .map((item, index) => {
                  const Icon = sourceIcons[index % sourceIcons.length];
                  const style = sourceStyles[index % sourceStyles.length];
                  return (
                    <SummaryBar
                      key={item.name}
                      label={item.name}
                      value={item.value}
                      total={sourceTotal}
                      color={style.color}
                      bgClassName={style.bg}
                      icon={<Icon className="h-4 w-4" />}
                    />
                  );
                })}
            </div>
          ) : <EmptyState title="No lead source data" description="Leads with sources will appear here." />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Sales Activity</CardTitle>
            <p className="mt-1 text-sm text-muted">Weekly calls and demos, shown side by side for coaching conversations.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.activitySeries.length ? (
            <ResponsiveContainer>
              <BarChart data={metrics.activitySeries} barGap={8} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="calls" name="Calls" fill="#93c5fd" radius={[8, 8, 0, 0]} />
                <Bar dataKey="demos" name="Demos" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty description="Call and demo activity will appear here." />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Stage Velocity</CardTitle>
            <p className="mt-1 text-sm text-muted">Average days spent in each stage before the deal moves forward.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.velocitySeries.length ? (
            <ResponsiveContainer>
              <BarChart data={metrics.velocitySeries} layout="vertical" margin={{ left: 18, right: 8 }}>
                <CartesianGrid stroke="#eef3f8" horizontal={false} strokeDasharray="4 4" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} width={84} />
                <Tooltip contentStyle={tooltipStyle} formatter={formatDays} />
                <Bar dataKey="days" name="Days" fill="#2563eb" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmpty description="Deal movement will show average time in stage." />}
        </CardContent>
      </Card>
    </div>
  );
}
