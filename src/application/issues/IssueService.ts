import type { RequestOptions } from '@/domain/shared/RequestOptions';

import type { ListRepoIssuesUseCase } from './ListRepoIssuesUseCase';

export class IssueService {
  constructor(private readonly listRepoIssues: ListRepoIssuesUseCase) {}

  listOpen(owner: string, repository: string, page = 1, options: RequestOptions = {}) {
    return this.listRepoIssues.execute({ owner, repository, page, signal: options.signal });
  }
}
