import type { Issue } from '@/domain/entities/Issue';
import { isPullRequest } from '@/domain/entities/issueRules';
import type { IssueRepository } from '@/domain/repositories/IssueRepository';
import type { Page } from '@/domain/shared/Page';

export interface ListRepoIssuesInput {
  owner: string;
  repository: string;
  page?: number;
  signal?: AbortSignal;
}

export class ListRepoIssuesUseCase {
  constructor(private readonly issues: IssueRepository) {}

  async execute({
    owner,
    repository,
    page = 1,
    signal,
  }: ListRepoIssuesInput): Promise<Page<Issue>> {
    const normalizedOwner = owner.trim();
    const normalizedRepository = repository.trim();

    if (!normalizedOwner) throw new Error('Repository owner is required.');
    if (!normalizedRepository) throw new Error('Repository name is required.');

    let currentPage = page;
    const visitedPages = new Set<number>();

    while (!visitedPages.has(currentPage)) {
      visitedPages.add(currentPage);
      const result = await this.issues.findOpenByRepository(
        normalizedOwner,
        normalizedRepository,
        currentPage,
        { signal },
      );
      const openIssues = result.items.filter((issue) => !isPullRequest(issue));

      if (openIssues.length > 0 || result.nextPage === null) {
        return { ...result, items: openIssues };
      }

      currentPage = result.nextPage;
    }

    throw new Error('Issue pagination returned a repeated page.');
  }
}
