import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

export interface DataSourceRegistryEntry {
  repos: RepoRepository;
  issues: IssueRepository;
}

export type DataSourceRegistry = Record<DataSourceId, DataSourceRegistryEntry>;
