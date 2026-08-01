"use client";

import { useSwipeBack } from "@/lib/hooks/useSwipeBack";

export default function SwipeBackProvider({ children }: { children: React.ReactNode }) {
  useSwipeBack({ enabled: true, threshold: 80, edgeWidth: 30 });
  return <>{children}</>;
}
