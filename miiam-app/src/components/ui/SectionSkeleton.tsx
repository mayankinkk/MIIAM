"use client";

interface SectionSkeletonProps {
  type?: "cards" | "list" | "grid" | "banner";
  count?: number;
  className?: string;
}

export default function SectionSkeleton({
  type = "cards",
  count = 3,
  className = "",
}: SectionSkeletonProps) {
  if (type === "banner") {
    return (
      <div className={`px-5 py-4 ${className}`}>
        <div className="from-surface-container-high via-surface-container to-surface-container-high animate-shimmer h-32 rounded-2xl bg-gradient-to-r bg-[length:200%_100%]" />
      </div>
    );
  }

  if (type === "list") {
    return (
      <div className={`space-y-3 px-5 py-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest flex gap-3 rounded-xl p-3">
            <div className="bg-surface-container-high animate-shimmer h-16 w-16 rounded-lg bg-[length:200%_100%]" />
            <div className="flex-1 space-y-2">
              <div className="bg-surface-container-high animate-shimmer h-4 w-32 rounded bg-[length:200%_100%]" />
              <div className="bg-surface-container-high animate-shimmer h-3 w-24 rounded bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "grid") {
    return (
      <div className={`grid grid-cols-2 gap-3 px-5 py-4 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-surface-container-lowest overflow-hidden rounded-xl">
            <div className="bg-surface-container-high animate-shimmer h-24 bg-[length:200%_100%]" />
            <div className="space-y-2 p-2.5">
              <div className="bg-surface-container-high animate-shimmer h-4 w-3/4 rounded bg-[length:200%_100%]" />
              <div className="bg-surface-container-high animate-shimmer h-3 w-1/2 rounded bg-[length:200%_100%]" />
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
          <div
            key={i}
            className="bg-surface-container-lowest w-36 flex-shrink-0 overflow-hidden rounded-xl"
          >
            <div className="bg-surface-container-high animate-shimmer h-28 bg-[length:200%_100%]" />
            <div className="space-y-2 p-2.5">
              <div className="bg-surface-container-high animate-shimmer h-4 w-24 rounded bg-[length:200%_100%]" />
              <div className="bg-surface-container-high animate-shimmer h-3 w-16 rounded bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
