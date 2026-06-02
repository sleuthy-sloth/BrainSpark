"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-dvh flex items-center justify-center p-4">
          <div className="glass-card-static p-8 max-w-sm w-full text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-extrabold text-text-primary mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-text-secondary mb-2">
              This game encountered an unexpected error.
            </p>
            <p className="text-xs text-text-muted mb-6 font-mono break-all">
              {this.state.error?.message || "Unknown error"}
            </p>
            <button
              onClick={this.handleRetry}
              className="btn btn-md btn-primary"
            >
              Tap to Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
