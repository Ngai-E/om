export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md">
      <Skeleton className="h-48 w-full" />
      <div className="bg-pink-50 px-4 py-3 min-h-[60px] flex items-center justify-center">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="bg-white p-6 text-center space-y-3">
        <Skeleton className="h-10 w-24 mx-auto" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
