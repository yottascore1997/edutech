import { apiFetchAuth } from '@/constants/api';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface WalletContextType {
  walletAmount: string;
  refreshWalletAmount: () => Promise<void>;
  updateWalletAmount: (amount: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [walletAmount, setWalletAmount] = useState<string>('0.00');

  const refreshWalletAmount = async () => {
    if (!user?.token) return;
    
    try {
      const response = await apiFetchAuth('/student/wallet', user.token);
      if (response.ok && response.data.balance) {
        setWalletAmount(response.data.balance.toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching wallet amount:', error);
    }
  };

  const updateWalletAmount = (amount: number) => {
    setWalletAmount(amount.toFixed(2));
  };

  useEffect(() => {
    if (user?.token) {
      refreshWalletAmount();
      // Set up periodic refresh every 30 seconds
      const intervalId = setInterval(refreshWalletAmount, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user?.token]);

  const value: WalletContextType = {
    walletAmount,
    refreshWalletAmount,
    updateWalletAmount,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
