import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { DataSourceId } from '@/domain/shared/DataSource';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { DataSourceRegistry } from './DataSourceRegistry';

export class SourceRoutedIssueRepository implements IssueRepository {
  constructor(
    private readonly registry: DataSourceRegistry,
    private readonly activeSource: () => DataSourceId,
  ) {}

  findOpenByRepository(owner: string, repository: string, page?: number, options?: RequestOptions) {
    return this.registry[this.activeSource()].issues.findOpenByRepository(
      owner,
      repository,
      page,
      options,
    );
  }
}
