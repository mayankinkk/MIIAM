"use client";

import React from "react";

interface ErrorBoundaryProps {
  children?: React.ReactNode;
  fallback?: React.ReactNode;
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  icon?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError || this.props.error) {
      if (this.props.fallback) return this.props.fallback;

      const error = this.state.error || this.props.error;
      const title = this.props.title || "Something went wrong";
      const icon = this.props.icon || "error";

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          <span className="material-symbols-outlined text-5xl text-amber-500 mb-3">{icon}</span>
          <h2 className="text-lg font-bold text-on-surface mb-2">{title}</h2>
          <p className="text-on-surface-variant text-sm mb-4 max-w-sm">
            {error?.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          {this.props.reset ? (
            <button
              onClick={this.props.reset}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              Try Again
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            >
              Refresh Page
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
