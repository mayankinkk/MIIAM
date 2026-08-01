"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface UseSwipeBackOptions {
  threshold?: number;
  edgeWidth?: number;
  enabled?: boolean;
}

export function useSwipeBack(options: UseSwipeBackOptions = {}) {
  const { threshold = 80, edgeWidth = 30, enabled = true } = options;
  const router = useRouter();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    if (touch.clientX <= edgeWidth) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      isSwiping.current = true;
    }
  }, [enabled, edgeWidth]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    if (deltaY > deltaX) {
      isSwiping.current = false;
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    if (deltaX > threshold) {
      router.back();
    }
  }, [router, threshold]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
