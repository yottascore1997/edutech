import { createContext, ReactNode, useContext, useState } from 'react';

interface CategoryContextType {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  clearCategory: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const clearCategory = () => {
    setSelectedCategory(null);
  };

  return (
    <CategoryContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        clearCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    // Return default values instead of throwing error
    // This allows components to work even if CategoryProvider is not available
    return {
      selectedCategory: null,
      setSelectedCategory: () => {},
      clearCategory: () => {},
    };
  }
  return context;
};
