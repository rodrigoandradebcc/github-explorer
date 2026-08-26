import type { GitHubIssueDto } from './dtos';

export interface GitHubIssueDataSource {
  listOpenIssues(owner: string, repository: string, page: number): Promise<GitHubIssueDto[]>;
}
