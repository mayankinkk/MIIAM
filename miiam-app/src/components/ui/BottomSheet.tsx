"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (diff > 100) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="bg-surface-container-lowest absolute right-0 bottom-0 left-0 max-h-[85vh] overflow-hidden rounded-t-3xl transition-transform duration-300"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="bg-on-surface-variant/30 h-1 w-10 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="border-outline-variant/10 border-b px-5 pb-3">
            <h2 className="text-on-surface text-lg font-black">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="max-h-[calc(85vh-60px)] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
