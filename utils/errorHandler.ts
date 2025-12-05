// Simple Global Error Handler for React Native app

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private isDevelopment = __DEV__;

  private constructor() {
    // No automatic setup to avoid loops
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private handleError(errorInfo: ErrorInfo) {
    // Simple logging without loops
    if (this.isDevelopment) {
      console.log('🔴 Error Handler:', errorInfo.message);
      if (errorInfo.stack) {
        console.log('Stack:', errorInfo.stack);
      }
    }
  }

  // Method to manually handle errors
  public handleManualError(error: Error | string, context?: string) {
    const errorInfo: ErrorInfo = {
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
    };

    if (context) {
      errorInfo.message = `[${context}] ${errorInfo.message}`;
    }

    this.handleError(errorInfo);
  }

  // Method to handle API errors specifically
  public handleApiError(error: any, endpoint?: string) {
    const errorInfo: ErrorInfo = {
      message: `API Error${endpoint ? ` (${endpoint})` : ''}: ${
        error?.message || error?.error || 'Unknown API error'
      }`,
      stack: error?.stack,
    };

    this.handleError(errorInfo);
  }
}

// Export singleton instance
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Export convenience functions
export const handleError = (error: Error | string, context?: string) => {
  globalErrorHandler.handleManualError(error, context);
};

export const handleApiError = (error: any, endpoint?: string) => {
  globalErrorHandler.handleApiError(error, endpoint);
}; 