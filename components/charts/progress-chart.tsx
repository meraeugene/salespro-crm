"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardMetrics } from "@/types/crm";

export function ProgressChart({ data }: { data: DashboardMetrics["pipelineProgress"] }) {
  return (
    <div>
      <div className="relative mx-auto h-72 max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={78} outerRadius={112} paddingAngle={4} cornerRadius={18} dataKey="value">
              {data.map((item) => (
                <Cell key={item.name} fill={item.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold">41%</span>
          <span className="mt-1 text-sm text-muted">Pipeline Won</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-5 text-sm text-muted">
        {data.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
