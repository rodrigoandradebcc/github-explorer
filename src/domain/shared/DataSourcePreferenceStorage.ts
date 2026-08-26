import type { DataSourceId } from './DataSource';

export interface DataSourcePreferenceStorage {
  load(): Promise<DataSourceId | null>;
  save(source: DataSourceId): Promise<void>;
}
