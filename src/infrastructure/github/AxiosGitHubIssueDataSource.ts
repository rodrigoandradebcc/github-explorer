import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { apiClient } from './client';
import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubIssueDto } from './dtos';
import type { GitHubIssueDataSource } from './GitHubIssueDataSource';

export class AxiosGitHubIssueDataSource implements GitHubIssueDataSource {
  async listOpenIssues(
    owner: string,
    repository: string,
    page: number,
    options: RequestOptions = {},
  ) {
    const { data } = await apiClient.get<GitHubIssueDto[]>(`/repos/${owner}/${repository}/issues`, {
      params: { state: 'open', page, per_page: GITHUB_PAGE_SIZE },
      signal: options.signal,
    });
    return data;
  }
}
