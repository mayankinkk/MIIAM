"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  items: T[];
  pageSize?: number;
  threshold?: number;
  rootMargin?: string;
}

interface UseInfiniteScrollSimpleOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll<T>(
  arg: T[] | UseInfiniteScrollOptions<T>,
  options?: UseInfiniteScrollSimpleOptions
) {
  const isObjectArg = !Array.isArray(arg);
  const items = isObjectArg ? arg.items : arg;
  const opts = isObjectArg ? arg : options || {};
  const { threshold = 0.1, rootMargin = "100px" } = opts;
  const pageSize = isObjectArg ? (opts as UseInfiniteScrollOptions<T>).pageSize || 10 : 10;

  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, pageSize, threshold, rootMargin]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  return { visibleItems, hasMore, loadMore, sentinelRef };
}
