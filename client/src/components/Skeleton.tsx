interface SkeletonProps {
  className?: string
  rows?: number
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="px-4 py-6 space-y-4">
      <div className="card p-6 space-y-4">
        <Skeleton className="h-5 w-32 mx-auto" />
        <Skeleton className="h-20 w-48 mx-auto rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="card p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}
