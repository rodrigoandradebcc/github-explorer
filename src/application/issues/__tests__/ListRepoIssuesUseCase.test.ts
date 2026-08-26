import type { Issue } from '@/domain/entities/Issue';
import type { IssueRepository } from '@/domain/repositories/IssueRepository';

import { ListRepoIssuesUseCase } from '../ListRepoIssuesUseCase';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 1,
    number: 1,
    title: 'Issue',
    body: null,
    state: 'open',
    author: {
      id: 1,
      login: 'octocat',
      avatarUrl: 'https://example.com/avatar.png',
      profileUrl: 'https://github.com/octocat',
      type: 'user',
    },
    labels: [],
    commentsCount: 0,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    closedAt: null,
    url: 'https://github.com/example/repo/issues/1',
    isPullRequest: false,
    ...overrides,
  };
}

function makeIssuePort(): jest.Mocked<IssueRepository> {
  return { findOpenByRepository: jest.fn() };
}

describe('ListRepoIssuesUseCase', () => {
  it('filters pull requests from a page', async () => {
    const issues = makeIssuePort();
    issues.findOpenByRepository.mockResolvedValue({
      items: [makeIssue(), makeIssue({ id: 2, isPullRequest: true })],
      total: null,
      nextPage: null,
    });

    const result = await new ListRepoIssuesUseCase(issues).execute({
      owner: 'example',
      repository: 'repo',
    });

    expect(result.items).toEqual([expect.objectContaining({ id: 1 })]);
  });

  it('advances when a page contains only pull requests', async () => {
    const issues = makeIssuePort();
    issues.findOpenByRepository
      .mockResolvedValueOnce({
        items: [makeIssue({ isPullRequest: true })],
        total: null,
        nextPage: 3,
      })
      .mockResolvedValueOnce({
        items: [makeIssue({ id: 2 })],
        total: null,
        nextPage: null,
      });

    const result = await new ListRepoIssuesUseCase(issues).execute({
      owner: 'example',
      repository: 'repo',
      page: 2,
    });

    expect(issues.findOpenByRepository).toHaveBeenNthCalledWith(2, 'example', 'repo', 3);
    expect(result.items[0]?.id).toBe(2);
  });

  it('stops with an empty result when the last page contains only pull requests', async () => {
    const issues = makeIssuePort();
    issues.findOpenByRepository.mockResolvedValue({
      items: [makeIssue({ isPullRequest: true })],
      total: null,
      nextPage: null,
    });

    const result = await new ListRepoIssuesUseCase(issues).execute({
      owner: 'example',
      repository: 'repo',
    });

    expect(result.items).toEqual([]);
    expect(issues.findOpenByRepository).toHaveBeenCalledTimes(1);
  });

  it('fails instead of looping when the port repeats a page', async () => {
    const issues = makeIssuePort();
    issues.findOpenByRepository.mockResolvedValue({
      items: [makeIssue({ isPullRequest: true })],
      total: null,
      nextPage: 1,
    });

    await expect(
      new ListRepoIssuesUseCase(issues).execute({ owner: 'example', repository: 'repo' }),
    ).rejects.toThrow('Issue pagination returned a repeated page.');
    expect(issues.findOpenByRepository).toHaveBeenCalledTimes(1);
  });
});
