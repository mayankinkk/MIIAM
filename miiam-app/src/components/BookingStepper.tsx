"use client";

import { motion } from "framer-motion";

interface BookingStepperProps {
  steps: string[];
  current: number;
}

export default function BookingStepper({ steps, current }: BookingStepperProps) {
  return (
    <div className="flex items-center justify-between mb-6 px-2">
      {steps.map((label, i) => {
        const isActive = i === current;
        const isDone = i < current;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isDone ? "var(--color-primary)" : isActive ? "var(--color-primary)" : "var(--color-surface-container-high)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="w-8 h-8 rounded-full flex items-center justify-center"
              >
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="material-symbols-outlined text-sm text-on-primary"
                  >
                    check
                  </motion.span>
                ) : (
                  <span className={`text-xs font-black ${isActive ? "text-on-primary" : "text-on-surface-variant"}`}>
                    {i + 1}
                  </span>
                )}
              </motion.div>
              <span className={`text-[10px] font-bold ${isActive ? "text-on-surface" : "text-on-surface-variant/60"}`}>
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-primary origin-left"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
