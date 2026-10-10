"use client";

import { motion } from "framer-motion";

interface VendorCardSkeletonProps {
  count?: number;
}

export function VendorCardSkeletonGrid({ count = 4 }: VendorCardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <VendorCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}

function VendorCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-surface-container-lowest overflow-hidden rounded-2xl shadow-sm"
    >
      {/* Image */}
      <div className="bg-surface-container animate-shimmer relative h-32">
        <div className="animate-shimmer absolute bottom-2 left-2 h-4 w-12 rounded-full bg-black/20" />
      </div>

      {/* Content */}
      <div className="space-y-2 p-3">
        <div className="bg-surface-container animate-shimmer h-4 w-3/4 rounded-full" />
        <div className="bg-surface-container animate-shimmer h-3 w-1/2 rounded-full" />
        <div className="flex items-center gap-2">
          <div className="bg-surface-container animate-shimmer h-3 w-8 rounded-full" />
          <div className="bg-surface-container animate-shimmer h-3 w-12 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

export function StoreItemSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-surface-container-lowest overflow-hidden rounded-2xl shadow-sm"
        >
          <div className="bg-surface-container animate-shimmer h-28" />
          <div className="space-y-2 p-3">
            <div className="bg-surface-container animate-shimmer h-3 w-4/5 rounded-full" />
            <div className="bg-surface-container animate-shimmer h-3 w-1/3 rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
