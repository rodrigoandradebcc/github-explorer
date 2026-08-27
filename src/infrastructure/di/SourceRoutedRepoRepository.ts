import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedRepoRepository implements RepoRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  search(query: string, page?: number, options?: RequestOptions) {
    return this.registry[this.activeSource()].repos.search(query, page, options);
  }

  findByOwnerAndName(owner: string, name: string, options?: RequestOptions) {
    return this.registry[this.activeSource()].repos.findByOwnerAndName(owner, name, options);
  }
}
