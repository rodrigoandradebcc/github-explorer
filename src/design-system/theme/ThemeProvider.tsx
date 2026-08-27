import React, { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';

import type { ThemeMode } from '@/domain/shared/Theme';
import type { ThemePreferenceStorage } from '@/domain/shared/ThemePreferenceStorage';

import { darkColors, lightColors, type ColorPalette } from '../tokens/colors';
import type { Radius } from '../tokens/radius';
import radius from '../tokens/radius';
import type { Sizes } from '../tokens/sizes';
import sizes from '../tokens/sizes';
import type { Spacing } from '../tokens/spacing';
import spacing from '../tokens/spacing';

export interface Theme {
  colors: ColorPalette;
  spacing: Spacing;
  sizes: Sizes;
  radius: Radius;
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<Theme | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  storage?: ThemePreferenceStorage;
}

const noOpStorage: ThemePreferenceStorage = {
  load: async () => null,
  save: async () => undefined,
};

export function ThemeProvider({
  children,
  initialMode = 'light',
  storage = noOpStorage,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    storage.load().then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setMode(stored);
      }
    });
  }, [storage]);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === 'light' ? 'dark' : 'light';
      void storage.save(next);
      return next;
    });
  }, [storage]);

  const value = useMemo<Theme>(
    () => ({
      colors: mode === 'light' ? lightColors : darkColors,
      spacing,
      sizes,
      radius,
      mode,
      toggleMode,
    }),
    [mode, toggleMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = use(ThemeContext);
  if (ctx === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
