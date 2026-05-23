import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Todo: "bg-orange-50 text-orange-700 ring-orange-200",
  "In Progress": "bg-blue-50 text-primary ring-blue-200",
  Done: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  New: "bg-blue-50 text-primary ring-blue-200",
  Contacted: "bg-sky-50 text-sky-700 ring-sky-200",
  Qualified: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Proposal: "bg-violet-50 text-violet-700 ring-violet-200",
  Won: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Lost: "bg-red-50 text-red-700 ring-red-200",
  General: "bg-slate-100 text-slate-700 ring-slate-200",
  Lead: "bg-sky-50 text-sky-700 ring-sky-200",
  Deal: "bg-violet-50 text-violet-700 ring-violet-200",
  Contact: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function statusBadgeClass(status: string) {
  return statusStyles[status] ?? "bg-slate-100 text-muted ring-slate-200";
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium ring-1", statusBadgeClass(status), className)}>
      {status}
    </span>
  );
}
