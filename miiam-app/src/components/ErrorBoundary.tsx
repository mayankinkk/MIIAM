"use client";

import { Component, ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
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

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#fff4f4] flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-[#ba001c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-[#ba001c]">error_outline</span>
            </div>
            <h1 className="text-2xl font-bold text-[#4d212a] mb-2">Something went wrong</h1>
            <p className="text-[#814c55] mb-6">
              We're sorry, but something unexpected happened. Please try again.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-6 py-3 bg-[#ffe1e4] text-[#ba001c] rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html>
      <body className="bg-[#fff4f4]">
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="w-24 h-24 bg-[#ba001c]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl text-[#ba001c]">error_outline</span>
            </div>
            <h1 className="text-2xl font-bold text-[#4d212a] mb-2">Application Error</h1>
            <p className="text-[#814c55] mb-4">
              A critical error occurred. Please refresh the page.
            </p>
            {error?.digest && (
              <p className="text-xs text-[#a06770] mb-4">Error ID: {error.digest}</p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#ba001c] text-white rounded-xl font-bold hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}