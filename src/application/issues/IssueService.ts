import type { ListRepoIssuesUseCase } from './ListRepoIssuesUseCase';

export class IssueService {
  constructor(private readonly listRepoIssues: ListRepoIssuesUseCase) {}

  listOpen(owner: string, repository: string, page = 1) {
    return this.listRepoIssues.execute({ owner, repository, page });
  }
}
