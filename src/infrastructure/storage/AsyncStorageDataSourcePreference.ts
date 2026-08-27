import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDataSourceId, type DataSourceId } from '@/domain/shared/DataSource';
import type { DataSourcePreferenceStorage } from '@/domain/shared/DataSourcePreferenceStorage';

const STORAGE_KEY = '@github_explorer/data_source';

export class AsyncStorageDataSourcePreference implements DataSourcePreferenceStorage {
  async load(): Promise<DataSourceId | null> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return isDataSourceId(stored) ? stored : null;
  }

  async save(source: DataSourceId): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, source);
  }
}
