"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = 'light' | 'dark';

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  
  // On mount, set theme based on localStorage or system preference
  useEffect(() => {
    // Check for stored theme preference
    const storedTheme = localStorage.getItem('theme') as Theme;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Check system preference
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches 
        ? 'dark' 
        : 'light';
      setTheme(systemPreference);
    }
  }, []);
  
  // Update DOM when theme changes
  useEffect(() => {
    // Add or remove class from document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    
    // Store preference in localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}