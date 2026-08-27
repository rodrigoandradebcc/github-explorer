import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitHubIssueDto } from './dtos';

export interface GitHubIssueDataSource {
  listOpenIssues(
    owner: string,
    repository: string,
    page: number,
    options?: RequestOptions,
  ): Promise<GitHubIssueDto[]>;
}
