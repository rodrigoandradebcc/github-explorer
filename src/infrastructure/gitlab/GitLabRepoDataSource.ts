import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitLabPageDto, GitLabProjectDetailsDto, GitLabProjectDto } from './dtos';

export interface GitLabRepoDataSource {
  searchProjects(
    query: string,
    page: number,
    options?: RequestOptions,
  ): Promise<GitLabPageDto<GitLabProjectDto>>;
  getProject(fullPath: string, options?: RequestOptions): Promise<GitLabProjectDetailsDto>;
}
