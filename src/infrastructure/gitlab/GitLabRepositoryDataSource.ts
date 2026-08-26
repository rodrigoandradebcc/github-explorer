import type { GitLabPageDto, GitLabProjectDetailsDto, GitLabProjectDto } from './dtos';

export interface GitLabRepositoryDataSource {
  searchProjects(query: string, page: number): Promise<GitLabPageDto<GitLabProjectDto>>;
  getProject(fullPath: string): Promise<GitLabProjectDetailsDto>;
}
