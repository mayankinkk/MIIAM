"use client";

import { useEffect } from "react";

export default function AdminThemeLock({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force light mode on admin, restore on unmount
    const root = document.documentElement;
    const prevClass = root.className;
    root.classList.remove("dark");
    root.classList.add("light");
    root.style.colorScheme = "light";

    return () => {
      root.className = prevClass;
    };
  }, []);

  return <>{children}</>;
}
