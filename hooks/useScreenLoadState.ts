import { useCallback, useRef } from 'react';

/**
 * Avoid full-screen loaders on every navigation/focus.
 * First visit: show blocking loader. Later visits: refresh in background.
 */
export function useScreenLoadState() {
  const hasLoadedOnceRef = useRef(false);

  const beginFetch = useCallback(
    (
      setLoading: (value: boolean) => void,
      setRefreshing: (value: boolean) => void,
      opts?: { refresh?: boolean },
    ) => {
      if (opts?.refresh || hasLoadedOnceRef.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
    },
    [],
  );

  const endFetch = useCallback(
    (setLoading: (value: boolean) => void, setRefreshing: (value: boolean) => void) => {
      hasLoadedOnceRef.current = true;
      setLoading(false);
      setRefreshing(false);
    },
    [],
  );

  const shouldBlockUI = useCallback((loading: boolean) => {
    return loading && !hasLoadedOnceRef.current;
  }, []);

  return { beginFetch, endFetch, shouldBlockUI, hasLoadedOnceRef };
}
