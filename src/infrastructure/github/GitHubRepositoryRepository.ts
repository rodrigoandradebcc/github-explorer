import type { RepositoryRepository } from '@/domain/repositories/RepositoryRepository';

import { apiClient } from './client';
import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';
import { mapRepository, mapRepositoryDetails } from './mappers';

export const GITHUB_PAGE_SIZE = 30;
const GITHUB_SEARCH_RESULT_LIMIT = 1000;

export class GitHubRepositoryRepository implements RepositoryRepository {
  async search(query: string, page = 1) {
    const { data } = await apiClient.get<GitHubSearchRepositoriesResponseDto>(
      '/search/repositories',
      { params: { q: query, page, per_page: GITHUB_PAGE_SIZE } },
    );
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

  async findByOwnerAndName(owner: string, name: string) {
    const { data } = await apiClient.get<GitHubRepositoryDetailsDto>(`/repos/${owner}/${name}`);
    return mapRepositoryDetails(data);
  }
}

export const repositoryRepository = new GitHubRepositoryRepository();
