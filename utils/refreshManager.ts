// Simple Refresh Manager for Auto-Refresh functionality

class RefreshManager {
  private refreshCallbacks: Map<string, () => void> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  // Register a screen for auto-refresh
  registerScreen(screenName: string, refreshCallback: () => void, intervalMs: number = 30000) {
        
    // Store the callback
    this.refreshCallbacks.set(screenName, refreshCallback);
    
    // Set up interval
    const interval = setInterval(() => {
      const callback = this.refreshCallbacks.get(screenName);
      if (callback) {
                callback();
      }
    }, intervalMs);
    
    this.intervals.set(screenName, interval);
  }

  // Unregister a screen
  unregisterScreen(screenName: string) {
        
    const interval = this.intervals.get(screenName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(screenName);
    }
    
    this.refreshCallbacks.delete(screenName);
  }

  // Manually trigger refresh for a screen
  triggerRefresh(screenName: string) {
    const callback = this.refreshCallbacks.get(screenName);
    if (callback) {
            callback();
    }
  }

  // Clear all intervals
  clearAll() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.refreshCallbacks.clear();
  }
}

// Create singleton instance
export const refreshManager = new RefreshManager();

// Hook for easy use in components
export const useAutoRefresh = (screenName: string, refreshCallback: () => void, intervalMs: number = 30000) => {
  React.useEffect(() => {
    refreshManager.registerScreen(screenName, refreshCallback, intervalMs);
    
    return () => {
      refreshManager.unregisterScreen(screenName);
    };
  }, [screenName, refreshCallback, intervalMs]);
}; 