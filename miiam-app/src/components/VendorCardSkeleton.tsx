"use client";

import { motion } from "framer-motion";

interface VendorCardSkeletonProps {
  count?: number;
}

export function VendorCardSkeletonGrid({ count = 4 }: VendorCardSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
      className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Image */}
      <div className="h-32 bg-surface-container animate-shimmer relative">
        <div className="absolute bottom-2 left-2 w-12 h-4 bg-black/20 rounded-full animate-shimmer" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-surface-container rounded-full w-3/4 animate-shimmer" />
        <div className="h-3 bg-surface-container rounded-full w-1/2 animate-shimmer" />
        <div className="flex items-center gap-2">
          <div className="h-3 bg-surface-container rounded-full w-8 animate-shimmer" />
          <div className="h-3 bg-surface-container rounded-full w-12 animate-shimmer" />
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
          className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="h-28 bg-surface-container animate-shimmer" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-surface-container rounded-full w-4/5 animate-shimmer" />
            <div className="h-3 bg-surface-container rounded-full w-1/3 animate-shimmer" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
