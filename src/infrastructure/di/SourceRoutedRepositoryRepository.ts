import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedRepositoryRepository implements RepositoryRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  search(query: string, page?: number) {
    return this.registry[this.activeSource()].repositories.search(query, page);
  }

  findByOwnerAndName(owner: string, name: string) {
    return this.registry[this.activeSource()].repositories.findByOwnerAndName(owner, name);
  }
}
