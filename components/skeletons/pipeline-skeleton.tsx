import { Skeleton } from "@/components/ui/skeleton";

export function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>
      <div className="grid min-h-[500px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, columnIndex) => (
          <div key={columnIndex} className="rounded-lg border border-border bg-white p-3">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: columnIndex === 4 ? 1 : 2 }).map((_, cardIndex) => (
                <div key={cardIndex} className="rounded-lg border border-blue-100 bg-blue-50/60 p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="mt-2 h-3 w-24" />
                      <Skeleton className="mt-4 h-3 w-28" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
