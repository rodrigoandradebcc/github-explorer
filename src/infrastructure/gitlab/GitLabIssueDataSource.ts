import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { GitLabIssueDto, GitLabPageDto } from './dtos';

export interface GitLabIssueDataSource {
  listOpenIssues(
    fullPath: string,
    page: number,
    options?: RequestOptions,
  ): Promise<GitLabPageDto<GitLabIssueDto>>;
}
