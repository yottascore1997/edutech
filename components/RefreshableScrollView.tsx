import React from 'react';
import { RefreshControl, ScrollView, ScrollViewProps } from 'react-native';
import { useRefreshControl } from '../hooks/useRefreshControl';

interface RefreshableScrollViewProps extends ScrollViewProps {
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
}

const RefreshableScrollView: React.FC<RefreshableScrollViewProps> = ({
  onRefresh,
  refreshing: externalRefreshing,
  children,
  ...scrollViewProps
}) => {
  const { refreshing: internalRefreshing, handleRefresh } = useRefreshControl({
    onRefresh,
  });

  const isRefreshing = externalRefreshing !== undefined ? externalRefreshing : internalRefreshing;

  return (
    <ScrollView
      {...scrollViewProps}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScrollView; 