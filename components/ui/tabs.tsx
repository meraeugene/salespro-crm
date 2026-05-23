"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Tabs({
  value,
  onChange,
  tabs,
}: {
  value: string;
  onChange: (value: string) => void;
  tabs: Array<{ value: string; label: string; content?: ReactNode }>;
}) {
  return (
    <div>
      <div className="inline-flex rounded-lg border border-border bg-white p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium text-muted",
              value === tab.value && "bg-primary text-white shadow-sm",
            )}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((tab) => tab.value === value)?.content}
    </div>
  );
}
