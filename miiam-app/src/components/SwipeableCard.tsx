"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { ReactNode } from "react";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: { label: string; color: string; icon: string };
  rightAction?: { label: string; color: string; icon: string };
  className?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = "",
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const leftOpacity = useTransform(x, [-150, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 150], [0, 1]);

  const handleDragEnd = (_: never, info: PanInfo) => {
    if (info.offset.x > 120 && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -120 && onSwipeLeft) {
      onSwipeLeft();
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left action layer */}
      {leftAction && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className="absolute inset-0 z-0 flex items-center rounded-2xl pl-5"
        >
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${leftAction.color}`}>
            <span className="material-symbols-outlined text-sm text-white">{leftAction.icon}</span>
            <span className="text-xs font-bold text-white">{leftAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* Right action layer */}
      {rightAction && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className="absolute inset-0 z-0 flex items-center justify-end rounded-2xl pr-5"
        >
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${rightAction.color}`}>
            <span className="material-symbols-outlined text-sm text-white">{rightAction.icon}</span>
            <span className="text-xs font-bold text-white">{rightAction.label}</span>
          </div>
        </motion.div>
      )}

      {/* Card */}
      <motion.div
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}
