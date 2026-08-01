"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: [0.55, 0.06, 0.68, 0.19] as [number, number, number, number],
    },
  },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
