import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import { apiClient } from './client';
import type { GitHubIssueDto } from './dtos';
import { GITHUB_PAGE_SIZE } from './GitHubRepositoryRepository';
import { mapIssue } from './mappers';

export class GitHubIssueRepository implements IssueRepository {
  async findOpenByRepository(owner: string, repository: string, page = 1) {
    let currentPage = page;

    while (true) {
      const { data } = await apiClient.get<GitHubIssueDto[]>(
        `/repos/${owner}/${repository}/issues`,
        { params: { state: 'open', page: currentPage, per_page: GITHUB_PAGE_SIZE } },
      );
      const issues = data.filter((item) => !item.pull_request).map(mapIssue);
      const hasAnotherApiPage = data.length === GITHUB_PAGE_SIZE;

      if (issues.length > 0 || !hasAnotherApiPage) {
        return {
          items: issues,
          total: null,
          nextPage: hasAnotherApiPage ? currentPage + 1 : null,
        };
      }

      currentPage += 1;
    }
  }
}

export const issueRepository = new GitHubIssueRepository();
