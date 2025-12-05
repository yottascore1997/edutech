import React, { createContext, useCallback, useContext, useState } from 'react';

interface RefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
  refreshScreen: (screenName: string) => void;
  getRefreshKey: (screenName: string) => number;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (!context) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

interface RefreshProviderProps {
  children: React.ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [screenRefreshKeys, setScreenRefreshKeys] = useState<{ [key: string]: number }>({});

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const refreshScreen = useCallback((screenName: string) => {
    setScreenRefreshKeys(prev => ({
      ...prev,
      [screenName]: (prev[screenName] || 0) + 1
    }));
  }, []);

  const getRefreshKey = useCallback((screenName: string) => {
    return screenRefreshKeys[screenName] || 0;
  }, [screenRefreshKeys]);

  const value: RefreshContextType = {
    refreshKey,
    triggerRefresh,
    refreshScreen,
    getRefreshKey,
  };

  return (
    <RefreshContext.Provider value={value}>
      {children}
    </RefreshContext.Provider>
  );
}; 