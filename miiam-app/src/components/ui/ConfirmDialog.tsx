"use client";

import { useState, useCallback, useRef, useEffect, createContext, useContext, ReactNode } from "react";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmContext = createContext<{
  confirm: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "default";
  }) => Promise<boolean>;
}>({ confirm: () => Promise.resolve(false) });

export function useConfirm() {
  return useContext(ConfirmContext);
}

function useFocusTrap(onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return containerRef;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const confirm = useCallback(
    (options: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      variant?: "danger" | "default";
    }) =>
      new Promise<boolean>((resolve) => {
        setState({
          open: true,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          variant: options.variant,
          onConfirm: () => {
            setState((s) => ({ ...s, open: false }));
            resolve(true);
          },
          onCancel: () => {
            setState((s) => ({ ...s, open: false }));
            resolve(false);
          },
        });
      }),
    []
  );

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <ConfirmDialogInner state={state} />
      )}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialogInner({ state }: { state: ConfirmState }) {
  const containerRef = useFocusTrap(state.onCancel);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 id="confirm-dialog-title" className="font-bold text-lg text-[var(--color-on-surface)] mb-2">{state.title}</h3>
        <p className="text-sm text-[var(--color-on-surface-variant)] mb-6">{state.message}</p>
        <div className="flex gap-3">
          <button
            onClick={state.onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] transition-colors"
          >
            {state.cancelText || "Cancel"}
          </button>
          <button
            onClick={state.onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors ${
              state.variant === "danger"
                ? "bg-status-error hover:bg-status-error/90"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dim)]"
            }`}
          >
            {state.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
