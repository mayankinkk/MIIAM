"use client";

import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from "react";

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

function EscapeListener({ onCancel }: { onCancel: () => void }) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);
  return null;
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
      {state.open && <EscapeListener onCancel={state.onCancel} />}
      {state.open && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <div className="bg-[var(--color-surface-container-lowest)] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 id="confirm-dialog-title" className="font-bold text-lg text-slate-900 mb-2">{state.title}</h3>
            <p className="text-sm text-slate-600 mb-6">{state.message}</p>
            <div className="flex gap-3">
              <button
                onClick={state.onCancel}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                {state.cancelText || "Cancel"}
              </button>
              <button
                onClick={state.onConfirm}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors ${
                  state.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#ba001c] hover:bg-[#a00018]"
                }`}
              >
                {state.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
