import React, { createContext, useContext, useState } from 'react';

type StudyPartnerContextType = {
  likesCount: number;
  setLikesCount: (n: number) => void;
};

const StudyPartnerContext = createContext<StudyPartnerContextType>({
  likesCount: 0,
  setLikesCount: () => {},
});

export function StudyPartnerProvider({ children }: { children: React.ReactNode }) {
  const [likesCount, setLikesCount] = useState(0);
  return (
    <StudyPartnerContext.Provider value={{ likesCount, setLikesCount }}>
      {children}
    </StudyPartnerContext.Provider>
  );
}

export function useStudyPartner() {
  return useContext(StudyPartnerContext);
}
