import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitLabRepositoryDataSource } from './GitLabRepositoryDataSource';
import { mapProject, mapProjectDetails, parsePositiveIntHeader } from './mappers';

export class GitLabRepositoryRepository implements RepositoryRepository {
  constructor(private readonly dataSource: GitLabRepositoryDataSource) {}

  async search(query: string, page = 1, options?: RequestOptions) {
    const data = await this.dataSource.searchProjects(query, page, options);

    return {
      items: data.items.map(mapProject),
      total: parsePositiveIntHeader(data.totalHeader),
      nextPage: parsePositiveIntHeader(data.nextPageHeader),
    };
  }

  async findByOwnerAndName(owner: string, name: string, options?: RequestOptions) {
    const data = await this.dataSource.getProject(`${owner}/${name}`, options);
    return mapProjectDetails(data);
  }
}
