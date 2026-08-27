import type { ThemeMode } from './Theme';

export interface ThemePreferenceStorage {
  load(): Promise<ThemeMode | null>;
  save(mode: ThemeMode): Promise<void>;
}
