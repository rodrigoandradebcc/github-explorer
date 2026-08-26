import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeMode, ThemePreferenceStorage } from '@/design-system';

const STORAGE_KEY = '@github_explorer/theme_mode';

export class AsyncStorageThemePreference implements ThemePreferenceStorage {
  async load(): Promise<ThemeMode | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  }

  async save(mode: ThemeMode): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }
}

export const asyncStorageThemePreference = new AsyncStorageThemePreference();
