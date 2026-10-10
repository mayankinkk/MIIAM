"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on home page on first load
    if (pathname === "/") {
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="animate-fade-out-delayed pointer-events-none fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--color-primary)]">
      <div className="animate-bounce-in flex flex-col items-center justify-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-2xl">
          <span className="text-4xl font-black tracking-tighter text-[var(--color-accent)]">M</span>
        </div>
        <h1 className="text-on-primary animate-pulse text-3xl font-black tracking-widest">MIIAM</h1>
      </div>
    </div>
  );
}
