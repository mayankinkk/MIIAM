"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export default function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = ""
}: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        e.preventDefault();
        const pull = Math.min(diff * 0.5, threshold * 1.5);
        setPullDistance(pull);
        setPulling(pull >= threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      isPulling.current = false;

      if (pulling) {
        setRefreshing(true);
        setPullDistance(0);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setPulling(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onRefresh, pulling, threshold]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          height: refreshing ? 60 : pullDistance,
          opacity: pullDistance > 10 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-1">
          {refreshing ? (
            <>
              <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-brand-primary">Refreshing...</span>
            </>
          ) : (
            <>
              <div
                className="w-6 h-6 transition-transform duration-200"
                style={{ transform: `rotate(${Math.min(pullDistance, threshold)}deg)` }}
              >
                <span className="material-symbols-outlined text-brand-primary">arrow_downward</span>
              </div>
              <span className="text-xs font-medium text-surface-neutral">
                {pulling ? "Release to refresh" : "Pull down"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{ transform: pullDistance > threshold ? `translateY(${threshold}px)` : `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
}
