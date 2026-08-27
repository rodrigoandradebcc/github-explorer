import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubRepositoryDataSource } from './GitHubRepositoryDataSource';
import { mapRepository, mapRepositoryDetails } from './mappers';

const GITHUB_SEARCH_RESULT_LIMIT = 1000;

export class GitHubRepositoryRepository implements RepositoryRepository {
  constructor(private readonly dataSource: GitHubRepositoryDataSource) {}

  async search(query: string, page = 1, options?: RequestOptions) {
    const data = await this.dataSource.searchRepositories(query, page, options);
    const searchableTotal = Math.min(data.total_count, GITHUB_SEARCH_RESULT_LIMIT);
    const lastSupportedPage = Math.ceil(GITHUB_SEARCH_RESULT_LIMIT / GITHUB_PAGE_SIZE);
    const loadedThroughThisPage = page * GITHUB_PAGE_SIZE;
    return {
      items: data.items.map(mapRepository),
      total: data.total_count,
      nextPage:
        data.items.length === GITHUB_PAGE_SIZE &&
        loadedThroughThisPage < searchableTotal &&
        page < lastSupportedPage
          ? page + 1
          : null,
    };
  }

  async findByOwnerAndName(owner: string, name: string, options?: RequestOptions) {
    const data = await this.dataSource.getRepository(owner, name, options);
    return mapRepositoryDetails(data);
  }
}
