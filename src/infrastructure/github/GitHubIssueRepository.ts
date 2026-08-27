import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { RequestOptions } from '@/domain/shared/RequestOptions';

import { GITHUB_PAGE_SIZE } from './constants';
import type { GitHubIssueDataSource } from './GitHubIssueDataSource';
import { mapIssue } from './mappers';

export class GitHubIssueRepository implements IssueRepository {
  constructor(private readonly dataSource: GitHubIssueDataSource) {}

  async findOpenByRepository(
    owner: string,
    repository: string,
    page = 1,
    options?: RequestOptions,
  ) {
    const data = await this.dataSource.listOpenIssues(owner, repository, page, options);

    return {
      items: data.map(mapIssue),
      total: null,
      nextPage: data.length === GITHUB_PAGE_SIZE ? page + 1 : null,
    };
  }
}
