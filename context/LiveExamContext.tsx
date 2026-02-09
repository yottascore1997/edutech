import React, { createContext, useState } from 'react';

type LiveExamContextType = {
  isLiveExamInProgress: boolean;
  setLiveExamInProgress: (value: boolean) => void;
};

const LiveExamContext = createContext<LiveExamContextType | null>(null);

export function LiveExamProvider({ children }: { children: React.ReactNode }) {
  const [isLiveExamInProgress, setLiveExamInProgress] = useState(false);
  return (
    <LiveExamContext.Provider value={{ isLiveExamInProgress, setLiveExamInProgress }}>
      {children}
    </LiveExamContext.Provider>
  );
}

export function useLiveExam() {
  const ctx = React.useContext(LiveExamContext);
  if (!ctx) return { isLiveExamInProgress: false, setLiveExamInProgress: () => {} };
  return ctx;
}
