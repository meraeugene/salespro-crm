"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardMetrics } from "@/types/crm";

export function RevenueChart({ data }: { data: DashboardMetrics["revenueSeries"] }) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={8}>
          <CartesianGrid stroke="#eef1f2" vertical={false} strokeDasharray="4 4" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            cursor={{ fill: "rgba(139, 227, 106, 0.08)" }}
            contentStyle={{ borderRadius: 10, border: "1px solid #E8E8E8", boxShadow: "0 14px 30px rgba(0,0,0,.08)" }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
          />
          <Bar dataKey="target" radius={[8, 8, 8, 8]} fill="#f2f4f5" />
          <Bar dataKey="revenue" radius={[8, 8, 8, 8]}>
            {data.map((entry) => (
              <Cell key={entry.month} fill={entry.month === "Jun" ? "#3B82F6" : "#eef1f2"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
