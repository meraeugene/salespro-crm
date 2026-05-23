"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
      <Card className="overflow-hidden">
        <CardHeader className="items-start">
          <div>
            <CardTitle>Revenue Forecast</CardTitle>
            <p className="mt-1 text-sm text-muted">Committed revenue versus forecasted pipeline by month.</p>
          </div>
        </CardHeader>
        <CardContent className="h-80">
          {metrics.forecastSeries.length ? <ResponsiveContainer>
            <ComposedChart data={metrics.forecastSeries}>
              <defs>
                <linearGradient id="forecastArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#93c5fd" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e8eef7" vertical={false} strokeDasharray="4 4" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
              <Tooltip contentStyle={tooltipStyle} formatter={formatCurrencyTooltip} />
              <Area type="monotone" dataKey="forecast" stroke="#93c5fd" fill="url(#forecastArea)" strokeWidth={2} />
              <Line type="monotone" dataKey="committed" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#2563eb" }} />
            </ComposedChart>
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
              <Bar dataKey="quota" fill="#e5eefb" radius={[10, 10, 0, 0]} />
              <Bar dataKey="revenue" fill="#1d4ed8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer> : <ChartEmpty />}
        </CardContent>
      </Card>
    </div>
  );
}
