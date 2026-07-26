"use client";

interface SectionSkeletonProps {
  type?: "cards" | "list" | "grid" | "banner";
  count?: number;
  className?: string;
}

export default function SectionSkeleton({ type = "cards", count = 3, className = "" }: SectionSkeletonProps) {
  if (type === "banner") {
    return (
      <div className={`px-5 py-4 ${className}`}>
        <div className="h-32 rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-high animate-shimmer bg-[length:200%_100%]" />
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`px-5 py-4 space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3 bg-surface-container-lowest rounded-xl">
            <div className="w-16 h-16 rounded-lg bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
              <div className="h-3 w-24 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className={`px-5 py-4 grid grid-cols-2 gap-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl overflow-hidden">
            <div className="h-24 bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            <div className="p-2.5 space-y-2">
              <div className="h-4 w-3/4 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
              <div className="h-3 w-1/2 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`px-5 py-4 ${className}`}>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-36 bg-surface-container-lowest rounded-xl overflow-hidden">
            <div className="h-28 bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            <div className="p-2.5 space-y-2">
              <div className="h-4 w-24 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
              <div className="h-3 w-16 rounded bg-surface-container-high animate-shimmer bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}