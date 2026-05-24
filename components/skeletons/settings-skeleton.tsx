import { Skeleton } from "@/components/ui/skeleton";

export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-72" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-32 rounded-lg bg-white" />
        <Skeleton className="h-10 w-28 rounded-lg bg-white" />
      </div>

      <section className="rounded-xl border border-border bg-white p-6 shadow-[0_18px_45px_rgba(17,24,39,0.06)]">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-5 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Skeleton className="h-16 w-16 shrink-0 rounded-full bg-blue-100" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="flex justify-end">
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </section>
    </div>
  );
}
