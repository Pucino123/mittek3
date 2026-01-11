import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SeniorModeContextType {
  seniorMode: boolean;
  toggleSeniorMode: () => void;
  setSeniorMode: (value: boolean) => void;
}

const SeniorModeContext = createContext<SeniorModeContextType | undefined>(undefined);

export function SeniorModeProvider({ children }: { children: ReactNode }) {
  const [seniorMode, setSeniorModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('trygtek-senior-mode');
      return saved === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('trygtek-senior-mode', String(seniorMode));
    
    if (seniorMode) {
      document.documentElement.classList.add('senior-mode');
    } else {
      document.documentElement.classList.remove('senior-mode');
    }
  }, [seniorMode]);

  const toggleSeniorMode = () => setSeniorModeState(prev => !prev);
  const setSeniorMode = (value: boolean) => setSeniorModeState(value);

  return (
    <SeniorModeContext.Provider value={{ seniorMode, toggleSeniorMode, setSeniorMode }}>
      {children}
    </SeniorModeContext.Provider>
  );
}

export function useSeniorMode() {
  const context = useContext(SeniorModeContext);
  if (context === undefined) {
    throw new Error('useSeniorMode must be used within a SeniorModeProvider');
  }
  return context;
}
