import React from 'react';
import { HiSun, HiMoon } from 'react-icons/hi';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <HiMoon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      ) : (
        <HiSun className="h-5 w-5 text-yellow-500" />
      )}
    </button>
  );
}