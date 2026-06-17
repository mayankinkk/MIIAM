"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(true);
    setProgress(0);
    const t1 = setTimeout(() => setProgress(40), 10);
    const t2 = setTimeout(() => setProgress(70), 200);
    const t3 = setTimeout(() => setProgress(100), 400);
    const t4 = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div
      className="fixed top-0 left-0 h-[3px] bg-primary z-[200] transition-all duration-200 ease-out"
      style={{ width: `${progress}%`, maxWidth: "100%" }}
    />
  );
}
