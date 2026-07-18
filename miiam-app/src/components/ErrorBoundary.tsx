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
          className="flex flex-col items-center justify-center py-16 px-6 text-center"
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-4xl text-red-500">{icon || "error"}</span>
          </div>
          <h3 className="text-lg font-bold text-on-surface mb-1">{title || "Something went wrong"}</h3>
          <p className="text-sm text-on-surface-variant/70 max-w-xs mb-5">
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
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl active:scale-[0.98] transition-transform"
          >
            Try Again
          </button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
