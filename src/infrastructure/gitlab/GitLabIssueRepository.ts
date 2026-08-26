import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import type { GitLabIssueDataSource } from './GitLabIssueDataSource';
import { mapIssue, parsePositiveIntHeader } from './mappers';

export class GitLabIssueRepository implements IssueRepository {
  constructor(private readonly dataSource: GitLabIssueDataSource) {}

  async findOpenByRepository(owner: string, repository: string, page = 1) {
    const data = await this.dataSource.listOpenIssues(`${owner}/${repository}`, page);

    return {
      items: data.items.map(mapIssue),
      total: parsePositiveIntHeader(data.totalHeader),
      nextPage: parsePositiveIntHeader(data.nextPageHeader),
    };
  }
}
