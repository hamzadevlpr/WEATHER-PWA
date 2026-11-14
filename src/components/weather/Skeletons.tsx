import { Skeleton } from '@/components/ui/Skeleton';

export function CurrentConditionsSkeleton() {
  return (
    <div
      className="space-y-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
      aria-busy="true"
      aria-label="Loading current conditions"
    >
      {/* Temperature + icon row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-16 w-36" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>

      {/* Stats row */}
      <div className="flex gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>

      {/* High / Low + Updated */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

export function ForecastSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] shadow-sm"
      aria-busy="true"
      aria-label="Loading forecast"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3"
        >
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-1.5 flex-1 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}
