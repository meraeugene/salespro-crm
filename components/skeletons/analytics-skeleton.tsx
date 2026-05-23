import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
          <div className="flex h-[420px] items-end gap-3">
            {Array.from({ length: 12 }).map((_, index) => (
              <Skeleton key={index} className="w-full rounded-md" style={{ height: `${35 + (index % 5) * 12}%` }} />
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
