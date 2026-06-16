"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "70%" }}
          exit={{ width: "100%" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 h-[3px] bg-primary z-[200]"
          style={{ maxWidth: "100%" }}
        />
      )}
    </AnimatePresence>
  );
}
