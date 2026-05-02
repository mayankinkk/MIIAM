"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <span className="text-6xl mb-4">😵</span>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)] mb-2">Something went wrong</h2>
          <p className="text-[var(--color-on-surface-variant)] text-sm mb-6">
            Please try refreshing the page
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full font-bold"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}