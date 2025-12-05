import { useState } from 'react';

interface UseRefreshControlProps {
  onRefresh: () => Promise<void>;
}

export const useRefreshControl = ({ onRefresh }: UseRefreshControlProps) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  return {
    refreshing,
    handleRefresh,
  };
}; 