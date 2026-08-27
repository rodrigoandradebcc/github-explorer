import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { apiClient } from './client';
import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';
import type { GitHubRepoDataSource } from './GitHubRepoDataSource';

export class AxiosGitHubRepoDataSource implements GitHubRepoDataSource {
  async searchRepositories(query: string, page: number, options: RequestOptions = {}) {
    const { data } = await apiClient.get<GitHubSearchRepositoriesResponseDto>(
      '/search/repositories',
      {
        params: { q: query, sort: 'stars', order: 'desc', page, per_page: GITHUB_PAGE_SIZE },
        signal: options.signal,
      },
    );
    return data;
  }

  async getRepository(owner: string, name: string, options: RequestOptions = {}) {
    const { data } = await apiClient.get<GitHubRepositoryDetailsDto>(`/repos/${owner}/${name}`, {
      signal: options.signal,
    });
    return data;
  }
}
