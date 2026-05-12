"use client";

export function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 ${className}`}>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        div {
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite linear;
        }
      `}</style>
    </div>
  );
}

export function ShimmerCard() {
  return (
    <div className="bg-white rounded-2xl p-4">
      <Shimmer className="h-32 w-full rounded-xl mb-4" />
      <Shimmer className="h-4 w-3/4 mb-2" />
      <Shimmer className="h-3 w-1/2" />
    </div>
  );
}

export function ShimmerList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 bg-white rounded-xl">
          <Shimmer className="w-20 h-20 rounded-lg" />
          <div className="flex-1">
            <Shimmer className="h-4 w-3/4 mb-2" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShimmerProductCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden">
      <Shimmer className="h-32 w-full" />
      <div className="p-3">
        <Shimmer className="h-4 w-3/4 mb-2" />
        <Shimmer className="h-3 w-1/2 mb-2" />
        <Shimmer className="h-6 w-20" />
      </div>
    </div>
  );
}