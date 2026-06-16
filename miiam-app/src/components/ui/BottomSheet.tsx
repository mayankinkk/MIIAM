"use client";

import { useEffect, useRef, useCallback } from "react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function BottomSheet({ open, onClose, title, subtitle, children, actions }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`bottomsheet-title-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Focus the sheet after animation
      requestAnimationFrame(() => {
        sheetRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      // Return focus to trigger element
      previousFocusRef.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    // Focus trap
    if (e.key === "Tab" && sheetRef.current) {
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        tabIndex={-1}
        className="bg-surface-container-lowest w-full max-w-lg rounded-t-3xl shadow-2xl p-6 pb-10 animate-slide-reveal outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="w-12 h-1.5 bg-surface-container-high rounded-full mx-auto mb-5" />
        <h2 id={titleId.current} className="text-lg font-bold text-on-surface mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-on-surface-variant mb-5">{subtitle}</p>}

        {children}

        {actions && (
          <div className="flex gap-3 mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface BottomSheetButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheetButton({ onClick, variant = "primary", disabled, loading, loadingText, children, className = "" }: BottomSheetButtonProps) {
  const base = "flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all";
  const styles = variant === "primary"
    ? "bg-primary text-white disabled:opacity-50"
    : "bg-surface-container text-on-surface-variant";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles} ${className}`}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {loading ? (loadingText || "Loading...") : children}
    </button>
  );
}
