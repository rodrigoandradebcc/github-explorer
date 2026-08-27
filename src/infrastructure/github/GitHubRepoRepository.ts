import type { RepoRepository } from '@/domain/repositories/RepoRepository';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubRepoDataSource } from './GitHubRepoDataSource';
import { mapRepo, mapRepoDetails } from './mappers';

const GITHUB_SEARCH_RESULT_LIMIT = 1000;

export class GitHubRepoRepository implements RepoRepository {
  constructor(private readonly dataSource: GitHubRepoDataSource) {}

  async search(query: string, page = 1, options?: RequestOptions) {
    const data = await this.dataSource.searchRepositories(query, page, options);
    const searchableTotal = Math.min(data.total_count, GITHUB_SEARCH_RESULT_LIMIT);
    const lastSupportedPage = Math.ceil(GITHUB_SEARCH_RESULT_LIMIT / GITHUB_PAGE_SIZE);
    const loadedThroughThisPage = page * GITHUB_PAGE_SIZE;
    return {
      items: data.items.map(mapRepo),
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
    return mapRepoDetails(data);
  }
}
