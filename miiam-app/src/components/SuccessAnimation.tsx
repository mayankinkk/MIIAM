"use client";

import { motion } from "framer-motion";

interface SuccessAnimationProps {
  icon?: string;
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SuccessAnimation({ icon = "check_circle", title, subtitle, className = "" }: SuccessAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`flex flex-col items-center text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4"
      >
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="material-symbols-outlined text-4xl text-emerald-500"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {icon}
        </motion.span>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-xl font-bold text-on-surface mb-1"
      >
        {title}
      </motion.h3>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-sm text-on-surface-variant max-w-xs"
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}
