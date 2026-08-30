import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'dark' | 'light';

export interface JunctionConfig {
  id: string;
  name: string;
  url: string;
}

interface SettingsContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  advancedFeatures: boolean;
  setAdvancedFeatures: (enabled: boolean) => void;
  junctions: JunctionConfig[];
  selectedJunction: string;
  setSelectedJunction: (id: string) => void;
  addJunction: (name: string, url: string) => void;
  deleteJunction: (id: string) => void;
  resetAllData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const THEME_KEY = 'trafix_theme';
const ADVANCED_KEY = 'trafix_advanced_features';
const JUNCTIONS_KEY = 'trafix_junctions';
const SELECTED_JUNCTION_KEY = 'trafix_selected_junction';

const DEFAULT_JUNCTIONS: JunctionConfig[] = [
  { id: 'J001', name: 'Central Plaza (J001)', url: 'http://10.213.45.183' },
  { id: 'CP01', name: 'Connaught Place (CP-01)', url: 'http://10.213.45.184' },
  { id: 'AIIMS02', name: 'AIIMS Flyover (AIIMS-02)', url: 'http://10.213.45.185' },
  { id: 'CYB03', name: 'Cyber City (CYB-03)', url: 'http://10.213.45.186' },
  { id: 'SEC62', name: 'Sector 62 (SEC62-04)', url: 'http://10.213.45.187' },
  { id: 'INDG05', name: 'India Gate (INDG-05)', url: 'http://10.213.45.188' },
  { id: 'NOIDA07', name: 'Noida Expressway (NOIDA-07)', url: 'http://10.213.45.189' },
];

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State: defaults to 'dark'
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  // Advanced Features Toggle State: defaults to true
  const [advancedFeatures, setAdvancedFeaturesState] = useState<boolean>(() => {
    const saved = localStorage.getItem(ADVANCED_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // Junctions List
  const [junctions, setJunctions] = useState<JunctionConfig[]>(() => {
    try {
      const saved = localStorage.getItem(JUNCTIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved junctions', e);
    }
    return DEFAULT_JUNCTIONS;
  });

  // Selected Active Junction
  const [selectedJunction, setSelectedJunctionState] = useState<string>(() => {
    const saved = localStorage.getItem(SELECTED_JUNCTION_KEY);
    return saved || 'J001';
  });

  // Apply Theme to Document root
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setAdvancedFeatures = (enabled: boolean) => {
    setAdvancedFeaturesState(enabled);
    localStorage.setItem(ADVANCED_KEY, String(enabled));
  };

  const setSelectedJunction = (id: string) => {
    setSelectedJunctionState(id);
    localStorage.setItem(SELECTED_JUNCTION_KEY, id);
  };

  const addJunction = (name: string, url: string) => {
    if (!name.trim()) return;
    const newJ: JunctionConfig = {
      id: `J${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      url: url.trim() || 'http://10.213.45.189',
    };
    setJunctions((prev) => {
      const updated = [...prev, newJ];
      localStorage.setItem(JUNCTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteJunction = (id: string) => {
    setJunctions((prev) => {
      const updated = prev.filter((j) => j.id !== id);
      localStorage.setItem(JUNCTIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetAllData = () => {
    localStorage.removeItem('trafix_violations');
    localStorage.removeItem('trafix_sim_config');
    localStorage.removeItem('trafix_telemetry_history');
    setJunctions(DEFAULT_JUNCTIONS);
    localStorage.setItem(JUNCTIONS_KEY, JSON.stringify(DEFAULT_JUNCTIONS));
    setSelectedJunction('J001');
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        advancedFeatures,
        setAdvancedFeatures,
        junctions,
        selectedJunction,
        setSelectedJunction,
        addJunction,
        deleteJunction,
        resetAllData,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
