import type { ThemeMode } from './ThemeProvider';

export interface ThemePreferenceStorage {
  load(): Promise<ThemeMode | null>;
  save(mode: ThemeMode): Promise<void>;
}
