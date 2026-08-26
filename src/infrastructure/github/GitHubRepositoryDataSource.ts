import type { GitHubRepositoryDetailsDto, GitHubSearchRepositoriesResponseDto } from './dtos';

export interface GitHubRepositoryDataSource {
  searchRepositories(query: string, page: number): Promise<GitHubSearchRepositoriesResponseDto>;
  getRepository(owner: string, name: string): Promise<GitHubRepositoryDetailsDto>;
}
