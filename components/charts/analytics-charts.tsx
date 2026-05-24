"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { DashboardMetrics } from "@/types/crm";

const tooltipStyle = {
  borderRadius: 14,
  border: "1px solid #dbe6f3",
  boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
  backgroundColor: "#ffffff",
};

function formatCurrencyTooltip(value: unknown) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function formatDaysTooltip(value: unknown) {
  return `${Number(value ?? 0)} days`;
}

function ChartEmpty() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <EmptyState className="h-full" title="No data yet" description="Create leads and deals to populate this chart." />
    </div>
  );
}

export function AnalyticsCharts({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="overflow-hidden xl:col-span-2">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Team Performance By Rep</CardTitle>
            <p className="mt-1 text-sm text-muted">Assigned leads, active deals, win rate, overdue tasks, and booked revenue.</p>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.teamPerformance.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-border">
                    <th className="py-3 font-medium">Rep</th>
                    <th className="py-3 font-medium">Assigned leads</th>
                    <th className="py-3 font-medium">Active deals</th>
                    <th className="py-3 font-medium">Win rate</th>
                    <th className="py-3 font-medium">Overdue tasks</th>
                    <th className="py-3 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.teamPerformance.map((rep) => (
                    <tr key={rep.name} className="border-b border-border last:border-0">
                      <td className="py-3 font-semibold">{rep.name}</td>
                      <td className="py-3 text-muted">{rep.assignedLeads}</td>
                      <td className="py-3 text-muted">{rep.activeDeals}</td>
                      <td className="py-3 text-muted">{rep.winRate}%</td>
                      <td className="py-3 text-muted">{rep.overdueTasks}</td>
                      <td className="py-3 font-semibold">{formatCurrencyTooltip(rep.revenue)}</td>
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
            <CardTitle>Forecast Categories</CardTitle>
            <p className="mt-1 text-sm text-muted">Commit, best case, and pipeline value by expected close month.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.forecastSeries.length ? <ResponsiveContainer>
            <BarChart data={metrics.forecastSeries}>
              <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={formatCurrencyTooltip} />
              <Bar dataKey="commit" stackId="forecast" fill="#1d4ed8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="bestCase" stackId="forecast" fill="#60a5fa" />
              <Bar dataKey="pipeline" stackId="forecast" fill="#bfdbfe" />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Sales Motion</CardTitle>
            <p className="mt-1 text-sm text-muted">Weekly call and demo volume with the same calm dashboard treatment.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.activitySeries.length ? <ResponsiveContainer>
            <BarChart data={metrics.activitySeries} barGap={10}>
              <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="calls" fill="#bfdbfe" radius={[10, 10, 10, 10]} />
              <Bar dataKey="demos" fill="#2563eb" radius={[10, 10, 10, 10]} />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Stage Velocity</CardTitle>
            <p className="mt-1 text-sm text-muted">Average days spent in each pipeline stage before moving forward.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.velocitySeries.length ? <ResponsiveContainer>
            <BarChart data={metrics.velocitySeries} layout="vertical" margin={{ left: 18 }}>
              <CartesianGrid stroke="#eef3f8" horizontal={false} strokeDasharray="4 4" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis type="category" dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} width={84} />
              <Tooltip contentStyle={tooltipStyle} formatter={formatDaysTooltip} />
              <Bar dataKey="days" fill="#3b82f6" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Quota Attainment</CardTitle>
            <p className="mt-1 text-sm text-muted">Booked revenue against quota for each rep this cycle.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.quotaSeries.length ? <ResponsiveContainer>
            <BarChart data={metrics.quotaSeries} barGap={12}>
              <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={formatCurrencyTooltip} />
              <Bar dataKey="monthlyQuota" fill="#e5eefb" radius={[10, 10, 0, 0]} />
              <Bar dataKey="revenue" fill="#1d4ed8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
        </CardContent>
      </Card>
    </div>
  );
}
