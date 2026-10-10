"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BlurImage from "@/components/BlurImage";

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ImageViewer({ src, alt, className = "" }: ImageViewerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className={`cursor-zoom-in ${className}`}>
        <BlurImage src={src} alt={alt} fill className="h-full w-full" sizes="100vw" />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative aspect-square w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <BlurImage
                src={src}
                alt={alt}
                fill
                className="h-full w-full rounded-2xl object-contain"
                sizes="100vw"
              />
              <button
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
