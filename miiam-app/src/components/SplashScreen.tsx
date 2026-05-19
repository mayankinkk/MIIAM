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
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#ba001c] animate-fade-out-delayed pointer-events-none">
      <div className="flex flex-col items-center justify-center animate-bounce-in">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <span className="text-4xl font-black text-[#ba001c] tracking-tighter">M</span>
        </div>
        <h1 className="text-white text-3xl font-black tracking-widest animate-pulse">MIIAM</h1>
      </div>
    </div>
  );
}
