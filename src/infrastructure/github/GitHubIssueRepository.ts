import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import { apiClient } from './client';
import type { GitHubIssueDto } from './dtos';
import { GITHUB_PAGE_SIZE } from './GitHubRepositoryRepository';
import { mapIssue } from './mappers';

export class GitHubIssueRepository implements IssueRepository {
  async findOpenByRepository(owner: string, repository: string, page = 1) {
    const { data } = await apiClient.get<GitHubIssueDto[]>(`/repos/${owner}/${repository}/issues`, {
      params: { state: 'open', page, per_page: GITHUB_PAGE_SIZE },
    });

    return {
      items: data.map(mapIssue),
      total: null,
      nextPage: data.length === GITHUB_PAGE_SIZE ? page + 1 : null,
    };
  }
}

export const issueRepository = new GitHubIssueRepository();
