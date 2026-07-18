"use client";

import { motion } from "framer-motion";

interface DeliveryStep {
  label: string;
  icon: string;
  completed: boolean;
  current?: boolean;
  time?: string;
}

interface DeliveryStepperProps {
  steps: DeliveryStep[];
}

export default function DeliveryStepper({ steps }: DeliveryStepperProps) {
  return (
    <div className="relative">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex items-start gap-4 pb-6 last:pb-0"
          >
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-20px)] bg-surface-container-high">
                {step.completed && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.15, duration: 0.3 }}
                    className="w-full h-full bg-primary origin-top"
                  />
                )}
              </div>
            )}

            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{
                scale: step.current ? [1, 1.15, 1] : 1,
              }}
              transition={step.current ? { repeat: Infinity, duration: 2 } : { delay: i * 0.1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                step.completed
                  ? "bg-primary text-on-primary"
                  : step.current
                    ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: step.completed ? "'FILL' 1" : "'FILL' 0" }}>
                {step.completed ? "check" : step.icon}
              </span>
            </motion.div>

            {/* Label */}
            <div className="pt-1">
              <p className={`text-sm font-bold ${
                step.completed || step.current ? "text-on-surface" : "text-on-surface-variant/50"
              }`}>
                {step.label}
              </p>
              {step.time && (
                <p className="text-xs text-on-surface-variant/60 mt-0.5">{step.time}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
