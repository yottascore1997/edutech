import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { useRefresh } from '../context/RefreshContext';

interface NavigationRefreshListenerProps {
  screenName: string;
  onRefresh?: () => void;
}

const NavigationRefreshListener: React.FC<NavigationRefreshListenerProps> = ({ 
  screenName, 
  onRefresh 
}) => {
  const navigation = useNavigation();
  const { refreshScreen, getRefreshKey } = useRefresh();

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log(`🔄 Screen focused: ${screenName}`);
      
      // Trigger refresh for this specific screen
      refreshScreen(screenName);
      
      // Call the onRefresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    });

    return unsubscribe;
  }, [navigation, screenName, refreshScreen, onRefresh]);

  // Listen for refresh key changes
  useEffect(() => {
    const refreshKey = getRefreshKey(screenName);
    if (refreshKey > 0 && onRefresh) {
      console.log(`🔄 Refreshing ${screenName} due to navigation`);
      onRefresh();
    }
  }, [getRefreshKey(screenName), screenName, onRefresh]);

  return null; // This component doesn't render anything
};

export default NavigationRefreshListener; 