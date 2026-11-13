import { Skeleton } from '@/components/ui/Skeleton';

export function CurrentConditionsSkeleton() {
  return (
    <div
      className="space-y-6 rounded-xl bg-[var(--color-surface-secondary)] p-6"
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
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading forecast"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-secondary)] p-4"
        >
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}
