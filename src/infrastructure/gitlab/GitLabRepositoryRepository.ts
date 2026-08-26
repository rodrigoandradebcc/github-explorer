import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

import type { GitLabRepositoryDataSource } from './GitLabRepositoryDataSource';
import { mapProject, mapProjectDetails, parsePositiveIntHeader } from './mappers';

export class GitLabRepositoryRepository implements RepositoryRepository {
  constructor(private readonly dataSource: GitLabRepositoryDataSource) {}

  async search(query: string, page = 1) {
    const data = await this.dataSource.searchProjects(query, page);

    return {
      items: data.items.map(mapProject),
      total: parsePositiveIntHeader(data.totalHeader),
      nextPage: parsePositiveIntHeader(data.nextPageHeader),
    };
  }

  async findByOwnerAndName(owner: string, name: string) {
    const data = await this.dataSource.getProject(`${owner}/${name}`);
    return mapProjectDetails(data);
  }
}
