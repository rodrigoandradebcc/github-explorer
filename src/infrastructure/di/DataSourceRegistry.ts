import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

export interface DataSourceRegistryEntry {
  repositories: RepositoryRepository;
  issues: IssueRepository;
}

export type DataSourceRegistry = Record<DataSourceId, DataSourceRegistryEntry>;
