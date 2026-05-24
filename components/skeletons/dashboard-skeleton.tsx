import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-5rem)] space-y-6 bg-slate-100 px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-9 lg:px-9">
      <div>
        <Skeleton className="h-8 w-48 bg-white" />
        <Skeleton className="mt-2 h-4 w-72 bg-white" />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl bg-white" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-96 rounded-xl bg-white" />
        <Skeleton className="h-96 rounded-xl bg-white" />
      </div>
      <Skeleton className="h-80 rounded-xl bg-white" />
    </div>
  );
}
