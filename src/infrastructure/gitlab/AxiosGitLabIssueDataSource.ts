import { apiClient } from './client';
import { GITLAB_PAGE_SIZE } from './constants';
import type { GitLabIssueDto } from './dtos';
import type { GitLabIssueDataSource } from './GitLabIssueDataSource';
import { toPageDto } from './pageHeaders';

export class AxiosGitLabIssueDataSource implements GitLabIssueDataSource {
  async listOpenIssues(fullPath: string, page: number) {
    const response = await apiClient.get<GitLabIssueDto[]>(
      `/projects/${encodeURIComponent(fullPath)}/issues`,
      { params: { state: 'opened', page, per_page: GITLAB_PAGE_SIZE } },
    );
    return toPageDto(response.data, response.headers as Record<string, unknown>);
  }
}
