"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-surface-container-lowest max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="bg-outline/30 h-1 w-10 rounded-full" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-6 pb-4">
                <h2 className="text-on-surface text-lg font-bold">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="max-h-[calc(85vh-60px)] overflow-y-auto px-6 pb-8">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
