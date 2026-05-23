import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, action, className }: { title: string; description: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-8 text-center", className)}>
      <Inbox className="mb-3 h-9 w-9 text-muted" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
