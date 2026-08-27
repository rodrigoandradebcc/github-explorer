import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';

export interface GitHubRepositoryDataSource {
  searchRepositories(
    query: string,
    page: number,
    options?: RequestOptions,
  ): Promise<GitHubSearchRepositoriesResponseDto>;
  getRepository(
    owner: string,
    name: string,
    options?: RequestOptions,
  ): Promise<GitHubRepositoryDetailsDto>;
}
