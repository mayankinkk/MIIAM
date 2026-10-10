"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { motion } from "framer-motion";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  icon?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: props.error };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    const { fallback, reset, title, icon } = this.props;

    if (this.state.hasError || this.props.error) {
      if (fallback) return fallback;

      const errorObj = this.state.error || this.props.error;

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center px-6 py-16 text-center"
        >
          <div className="bg-status-error/10 mb-5 flex h-20 w-20 items-center justify-center rounded-full">
            <span className="material-symbols-outlined text-status-error text-4xl">
              {icon || "error"}
            </span>
          </div>
          <h3 className="text-on-surface mb-1 text-lg font-bold">
            {title || "Something went wrong"}
          </h3>
          <p className="text-on-surface-variant/70 mb-5 max-w-xs text-sm">
            {errorObj?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => {
              if (reset) {
                reset();
              } else {
                this.setState({ hasError: false, error: undefined });
              }
            }}
            className="bg-primary text-on-primary rounded-xl px-6 py-3 font-bold transition-transform active:scale-[0.98]"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
