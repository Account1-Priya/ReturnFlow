import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Light/dark switch. The two icons are stacked and cross-faded so the control
 * never changes size and there is no layout shift on toggle.
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      data-testid="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      data-theme={theme}
      className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border transition-colors border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:border-night-700 dark:bg-night-750 dark:text-slate-300 dark:hover:text-white dark:hover:bg-night-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-night-900 ${className}`}
    >
      <Sun
        className="absolute w-[18px] h-[18px] transition-all duration-300 rotate-0 scale-100 opacity-100 dark:-rotate-90 dark:scale-0 dark:opacity-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute w-[18px] h-[18px] transition-all duration-300 rotate-90 scale-0 opacity-0 dark:rotate-0 dark:scale-100 dark:opacity-100"
        aria-hidden="true"
      />
      <span className="sr-only">{isDark ? 'Dark mode active' : 'Light mode active'}</span>
    </button>
  );
};
