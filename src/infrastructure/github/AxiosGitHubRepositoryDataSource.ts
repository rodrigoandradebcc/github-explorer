import { apiClient } from './client';
import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';
import type { GitHubRepositoryDataSource } from './GitHubRepositoryDataSource';

export class AxiosGitHubRepositoryDataSource implements GitHubRepositoryDataSource {
  async searchRepositories(query: string, page: number) {
    const { data } = await apiClient.get<GitHubSearchRepositoriesResponseDto>(
      '/search/repositories',
      { params: { q: query, page, per_page: GITHUB_PAGE_SIZE } },
    );
    return data;
  }

  async getRepository(owner: string, name: string) {
    const { data } = await apiClient.get<GitHubRepositoryDetailsDto>(`/repos/${owner}/${name}`);
    return data;
  }
}
