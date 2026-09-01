// src/components/ErrorBoundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center bg-avit-bg p-8">
          <h1 className="text-4xl font-semibold mb-4">
            Something went wrong
          </h1>
          <p className="max-w-2xl text-xl text-gray-500 mb-8">
            The room controls hit an unexpected error. Reload to try again, or
            contact AV Technical Support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn bg-avit-blue min-w-32 min-h-[5rem] text-white px-6 py-2 rounded-lg text-xl"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
