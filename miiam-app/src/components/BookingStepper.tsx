"use client";

import { motion } from "framer-motion";

interface BookingStepperProps {
  steps: string[];
  current: number;
}

export default function BookingStepper({ steps, current }: BookingStepperProps) {
  return (
    <div className="mb-6 flex items-center justify-between px-2">
      {steps.map((label, i) => {
        const isActive = i === current;
        const isDone = i < current;

        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isDone
                    ? "var(--color-primary)"
                    : isActive
                      ? "var(--color-primary)"
                      : "var(--color-surface-container-high)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="flex h-8 w-8 items-center justify-center rounded-full"
              >
                {isDone ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="material-symbols-outlined text-on-primary text-sm"
                  >
                    check
                  </motion.span>
                ) : (
                  <span
                    className={`text-xs font-black ${isActive ? "text-on-primary" : "text-on-surface-variant"}`}
                  >
                    {i + 1}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-[10px] font-bold ${isActive ? "text-on-surface" : "text-on-surface-variant/60"}`}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="bg-surface-container-high mx-2 h-[2px] flex-1 overflow-hidden rounded-full">
                <motion.div
                  initial={false}
                  animate={{ scaleX: isDone ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-primary h-full origin-left"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
