import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { apiClient } from './client';
import { GITLAB_PAGE_SIZE } from './constants';
import type { GitLabProjectDetailsDto, GitLabProjectDto } from './dtos';
import type { GitLabRepositoryDataSource } from './GitLabRepositoryDataSource';
import { toPageDto } from './pageHeaders';

export class AxiosGitLabRepositoryDataSource implements GitLabRepositoryDataSource {
  async searchProjects(query: string, page: number, options: RequestOptions = {}) {
    const response = await apiClient.get<GitLabProjectDto[]>('/projects', {
      params: {
        search: query,
        order_by: 'star_count',
        sort: 'desc',
        page,
        per_page: GITLAB_PAGE_SIZE,
      },
      signal: options.signal,
    });
    return toPageDto(response.data, response.headers as Record<string, unknown>);
  }

  async getProject(fullPath: string, options: RequestOptions = {}) {
    const { data } = await apiClient.get<GitLabProjectDetailsDto>(
      `/projects/${encodeURIComponent(fullPath)}`,
      { signal: options.signal },
    );
    return data;
  }
}
