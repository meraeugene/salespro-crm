import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-white p-5 shadow-[0_8px_22px_rgba(17,24,39,0.04)] ${className}`}>
      {children}
    </div>
  );
}

function CardHeaderSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className="mb-5">
      <Skeleton className="h-5 w-40 bg-slate-100" />
      <Skeleton className={`mt-2 h-3 bg-slate-100 ${wide ? "w-96 max-w-full" : "w-72 max-w-full"}`} />
    </div>
  );
}

function ChartBars({ horizontal = false }: { horizontal?: boolean }) {
  if (horizontal) {
    return (
      <div className="space-y-5">
        {[42, 72, 28].map((width, index) => (
          <div key={index} className="flex items-center gap-4">
            <Skeleton className="h-4 w-28 bg-slate-100" />
            <Skeleton className="h-9 flex-1 rounded-lg bg-slate-100" style={{ maxWidth: `${width}%` }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-52 items-end gap-3">
      {[52, 76, 44, 68, 58].map((height, index) => (
        <Skeleton key={index} className="w-full rounded-lg bg-slate-100" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-36 bg-slate-100" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full bg-slate-100" />
      </div>

      <CardShell className="xl:col-span-2">
        <CardHeaderSkeleton wide />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1.2fr_0.7fr_0.8fr_0.7fr_0.8fr_0.8fr] gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
              <Skeleton className="h-4 bg-slate-100" />
              <Skeleton className="h-4 bg-slate-100" />
              <Skeleton className="h-4 bg-slate-100" />
              <Skeleton className="h-6 rounded-full bg-blue-50" />
              <Skeleton className="h-4 bg-slate-100" />
              <Skeleton className="h-4 bg-slate-100" />
            </div>
          ))}
        </div>
      </CardShell>

      <div className="grid gap-5 xl:grid-cols-2">
        <CardShell>
          <CardHeaderSkeleton />
          <ChartBars />
        </CardShell>
        <CardShell>
          <CardHeaderSkeleton />
          <ChartBars />
        </CardShell>
      </div>

      <CardShell>
        <CardHeaderSkeleton wide />
        <ChartBars horizontal />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-lg bg-blue-50" />
          ))}
        </div>
      </CardShell>

      <CardShell>
        <CardHeaderSkeleton wide />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border bg-blue-50/60 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg bg-white" />
                  <Skeleton className="h-4 w-24 bg-white" />
                </div>
                <Skeleton className="h-4 w-6 bg-white" />
              </div>
              <Skeleton className="mt-3 h-2.5 w-full rounded-full bg-white" />
              <Skeleton className="mt-2 h-3 w-20 bg-white" />
            </div>
          ))}
        </div>
      </CardShell>

      <div className="grid gap-5 xl:grid-cols-2">
        <CardShell>
          <CardHeaderSkeleton />
          <ChartBars />
        </CardShell>
        <CardShell>
          <CardHeaderSkeleton />
          <ChartBars horizontal />
        </CardShell>
      </div>
    </div>
  );
}
