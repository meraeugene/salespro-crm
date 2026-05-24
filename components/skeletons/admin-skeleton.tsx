import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-28" />
        <Skeleton className="mt-2 h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-32 rounded-lg bg-white" />
        ))}
      </div>

      <Card>
        <CardHeader className="items-start py-6">
          <div>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="mt-2 h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-24 rounded-lg" />
        </CardHeader>
        <CardContent className="overflow-hidden pb-6">
          <div className="grid min-w-[720px] grid-cols-[72px_1.15fr_1.3fr_180px_120px] gap-4 border-b border-border pb-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid min-w-[720px] grid-cols-[72px_1.15fr_1.3fr_180px_120px] items-center gap-4 py-4"
              >
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
