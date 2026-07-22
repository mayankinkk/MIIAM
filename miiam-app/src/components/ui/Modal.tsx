"use client";

import { useEffect, useRef, useCallback } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw] max-h-[90vh]",
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      // Focus the modal after animation
      requestAnimationFrame(() => {
        modalRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      // Return focus to trigger element
      previousFocusRef.current?.focus();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (closeOnEscape && e.key === "Escape") {
      e.stopPropagation();
      handleClose();
      return;
    }
    // Focus trap
    if (e.key === "Tab" && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
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
  }, [closeOnEscape, handleClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? handleClose : undefined}
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        tabIndex={-1}
        className={`relative bg-surface-container-lowest w-full ${sizeClasses[size]} rounded-2xl shadow-2xl p-6 animate-scale-in outline-none`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 id={titleId.current} className="text-lg font-bold text-on-surface truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-on-surface-variant mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="ml-4 p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Close dialog"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="text-on-surface">
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex gap-3 mt-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface ModalButtonProps {
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function ModalButton({
  onClick,
  variant = "primary",
  disabled,
  loading,
  loadingText,
  children,
  className = "",
}: ModalButtonProps) {
  const base = "flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all";
  const styles = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-hover disabled:opacity-50",
    secondary: "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
    danger: "bg-status-error text-white hover:bg-status-error/90 disabled:opacity-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {loading ? (loadingText || "Loading...") : children}
    </button>
  );
}
