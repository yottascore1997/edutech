import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  refreshFunction: () => void | Promise<void>;
  screenName: string;
  enabled?: boolean;
  debounceMs?: number;
}

export const useAutoRefresh = ({
  refreshFunction,
  screenName,
  enabled = true,
  debounceMs = 1000
}: UseAutoRefreshOptions) => {
  const navigation = useNavigation();
  const lastRefreshTime = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);

  const debouncedRefresh = useCallback(async () => {
    const now = Date.now();
    
    // Prevent multiple rapid refreshes
    if (now - lastRefreshTime.current < debounceMs || isRefreshing.current) {
      return;
    }

    try {
      isRefreshing.current = true;
      lastRefreshTime.current = now;
      console.log(`🔄 Auto-refreshing ${screenName}`);
      await refreshFunction();
    } catch (error) {
      console.error(`Error auto-refreshing ${screenName}:`, error);
    } finally {
      isRefreshing.current = false;
    }
  }, [refreshFunction, screenName, debounceMs]);

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = navigation.addListener('focus', () => {
      console.log(`📱 Screen focused: ${screenName}`);
      debouncedRefresh();
    });

    return unsubscribe;
  }, [navigation, screenName, debouncedRefresh, enabled]);

  return {
    refresh: debouncedRefresh,
    isRefreshing: isRefreshing.current
  };
}; 