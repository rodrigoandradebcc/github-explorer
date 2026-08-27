import AsyncStorage from '@react-native-async-storage/async-storage';

import { isThemeMode, type ThemeMode } from '@/domain/shared/Theme';
import type { ThemePreferenceStorage } from '@/domain/shared/ThemePreferenceStorage';

const STORAGE_KEY = '@github_explorer/theme_mode';

export class AsyncStorageThemePreference implements ThemePreferenceStorage {
  async load(): Promise<ThemeMode | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
  }

  async save(mode: ThemeMode): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  }
}
