import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import { IssueService } from '../IssueService';
import { ListRepoIssuesUseCase } from '../ListRepoIssuesUseCase';

const emptyPage = { items: [], total: null, nextPage: null };

function makeIssuePort(): jest.Mocked<IssueRepository> {
  return { findOpenByRepository: jest.fn().mockResolvedValue(emptyPage) };
}

function makeService(issues: jest.Mocked<IssueRepository>) {
  return new IssueService(new ListRepoIssuesUseCase(issues));
}

describe('IssueService', () => {
  it('defaults to the first page and no signal when the caller omits both', async () => {
    const issues = makeIssuePort();

    await makeService(issues).listOpen('facebook', 'react');

    expect(issues.findOpenByRepository).toHaveBeenCalledWith('facebook', 'react', 1, {
      signal: undefined,
    });
  });

  it('carries page and abort signal into the use case input', async () => {
    const issues = makeIssuePort();
    const { signal } = new AbortController();

    await makeService(issues).listOpen('facebook', 'react', 4, { signal });

    expect(issues.findOpenByRepository).toHaveBeenCalledWith('facebook', 'react', 4, { signal });
  });
});
