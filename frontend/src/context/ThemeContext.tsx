import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextType {
  /** The palette currently painted on screen. */
  theme: Theme;
  /** Convenience flag for conditional rendering. */
  isDark: boolean;
  /** True while the theme is still following the OS (no explicit choice yet). */
  isSystem: boolean;
  /** Pick a theme explicitly and remember it. */
  setTheme: (theme: Theme) => void;
  /** Flip between light and dark, and remember the choice. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  isSystem: true,
  setTheme: () => {},
  toggleTheme: () => {},
});

/** Reads the saved choice. Returns null when the user has never picked one. */
function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    // localStorage can throw in private mode or when cookies are blocked.
    return null;
  }
}

function readSystemTheme(): Theme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Applies the palette to <html>. Kept in sync with the boot script in index.html. */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // The inline script in index.html has already resolved and applied the theme
  // before first paint; start from the same answer so React never disagrees
  // with what is on screen (which is what causes a flash).
  const [stored, setStored] = useState<Theme | null>(() => readStoredTheme());
  const [systemTheme, setSystemTheme] = useState<Theme>(() => readSystemTheme());

  const theme: Theme = stored ?? systemTheme;

  // Requirement: follow the OS until the user chooses for themselves.
  useEffect(() => {
    let media: MediaQueryList;
    try {
      media = window.matchMedia(DARK_QUERY);
    } catch {
      return;
    }

    const onChange = (event: MediaQueryListEvent) =>
      setSystemTheme(event.matches ? 'dark' : 'light');

    // Safari < 14 only supports the deprecated addListener signature.
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // Keep another tab's choice in sync with this one.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setStored(event.newValue === 'dark' || event.newValue === 'light' ? event.newValue : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    // Enable colour transitions only around the switch itself, then drop them
    // again so they never interfere with hover states or the initial paint.
    const root = document.documentElement;
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 300);

    setStored(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persisting is best-effort; the theme still applies for this session.
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDark: theme === 'dark',
      isSystem: stored === null,
      setTheme,
      toggleTheme,
    }),
    [theme, stored, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
