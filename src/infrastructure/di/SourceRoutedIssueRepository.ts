import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedIssueRepository implements IssueRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  findOpenByRepository(owner: string, repository: string, page?: number) {
    return this.registry[this.activeSource()].issues.findOpenByRepository(owner, repository, page);
  }
}
