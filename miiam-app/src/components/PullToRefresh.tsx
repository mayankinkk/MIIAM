"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { motion, useAnimation } from "framer-motion";

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
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const isReadyToRefresh = useRef(false);
  const controls = useAnimation();

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
        isReadyToRefresh.current = pull >= threshold;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      isPulling.current = false;

      if (isReadyToRefresh.current) {
        setRefreshing(true);
        setPullDistance(0);
        isReadyToRefresh.current = false;
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
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
  }, [onRefresh, threshold]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Pull Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10"
        style={{
          height: refreshing ? 60 : pullDistance,
          opacity: pullDistance > 10 || refreshing ? 1 : 0,
          transition: refreshing ? "height 0.3s ease" : "none",
        }}
      >
        <div className="flex flex-col items-center gap-1.5">
          {refreshing ? (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ rotate: progress * 180, scale: 0.8 + progress * 0.4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <span className="material-symbols-outlined text-primary text-2xl">arrow_downward</span>
              </motion.div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: progress }}
                className="text-[11px] font-bold text-primary"
              >
                {progress >= 1 ? "Release to refresh" : "Pull down"}
              </motion.span>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform"
        style={{
          transform: refreshing ? "translateY(60px)" : `translateY(${pullDistance}px)`,
          transitionDuration: refreshing ? "0.3s" : pullDistance === 0 ? "0.3s" : "0s",
        }}
      >
        {children}
      </div>
    </div>
  );
}
