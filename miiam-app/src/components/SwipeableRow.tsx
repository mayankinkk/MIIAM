"use client";

import { useRef, useState, useCallback, type ReactNode } from "react";

interface SwipeableRowProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeLeftLabel?: string;
  onSwipeLeftIcon?: string;
  onSwipeRight?: () => void;
  onSwipeRightLabel?: string;
  onSwipeRightIcon?: string;
}

const SWIPE_THRESHOLD = 80;

export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeLeftLabel = "Dismiss",
  onSwipeLeftIcon = "close",
  onSwipeRight,
  onSwipeRightLabel = "Archive",
  onSwipeRightIcon = "archive",
}: SwipeableRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);

  const reset = useCallback(() => {
    setSwiping(false);
    setOffsetX(0);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return;
    const deltaX = e.touches[0].clientX - startX.current;
    const deltaY = e.touches[0].clientY - startY.current;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setOffsetX(Math.max(-200, Math.min(200, deltaX)));
    }
  }, [swiping]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - startX.current;
    const deltaY = e.changedTouches[0].clientY - startY.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SWIPE_THRESHOLD) {
      if (deltaX < -SWIPE_THRESHOLD && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > SWIPE_THRESHOLD && onSwipeRight) {
        onSwipeRight();
      }
    }
    reset();
  }, [onSwipeLeft, onSwipeRight, reset]);

  return (
    <div className="relative overflow-hidden rounded-xl" ref={containerRef}>
      {/* Left action background */}
      {onSwipeRight && (
        <div
          className="absolute inset-y-0 left-0 flex items-center justify-end pr-4 bg-secondary text-white font-bold text-sm gap-2"
          style={{ width: Math.max(0, offsetX) }}
        >
          <span className="material-symbols-outlined">{onSwipeRightIcon}</span>
          <span className={offsetX < 60 ? "hidden" : ""}>{onSwipeRightLabel}</span>
        </div>
      )}
      {/* Right action background */}
      {onSwipeLeft && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-start pl-4 bg-error text-white font-bold text-sm gap-2"
          style={{ width: Math.max(0, -offsetX) }}
        >
          <span className={-offsetX < 60 ? "hidden" : ""}>{onSwipeLeftLabel}</span>
          <span className="material-symbols-outlined">{onSwipeLeftIcon}</span>
        </div>
      )}
      {/* Content */}
      <div
        className="relative bg-white rounded-xl transition-transform"
        style={{
          transform: swiping ? `translateX(${offsetX}px)` : undefined,
          transition: swiping ? "none" : "transform 0.3s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
