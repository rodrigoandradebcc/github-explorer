import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitLabRepoDataSource } from './GitLabRepoDataSource';
import { mapProject, mapProjectDetails, parsePositiveIntHeader } from './mappers';

export class GitLabRepoRepository implements RepoRepository {
  constructor(private readonly dataSource: GitLabRepoDataSource) {}

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
