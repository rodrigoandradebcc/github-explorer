import type { GitLabIssueDto, GitLabPageDto } from './dtos';

export interface GitLabIssueDataSource {
  listOpenIssues(fullPath: string, page: number): Promise<GitLabPageDto<GitLabIssueDto>>;
}
