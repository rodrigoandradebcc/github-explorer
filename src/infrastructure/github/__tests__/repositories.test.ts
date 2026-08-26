import type {
  GitHubIssueDto,
  GitHubRepositoryDetailsDto,
  GitHubSearchRepositoriesResponseDto,
} from '../dtos';
import type { GitHubIssueDataSource } from '../GitHubIssueDataSource';
import { GitHubIssueRepository } from '../GitHubIssueRepository';
import type { GitHubRepositoryDataSource } from '../GitHubRepositoryDataSource';
import { GitHubRepositoryRepository } from '../GitHubRepositoryRepository';

function fakeRepositoryDataSource(
  overrides: Partial<GitHubRepositoryDataSource> = {},
): GitHubRepositoryDataSource {
  return { searchRepositories: jest.fn(), getRepository: jest.fn(), ...overrides };
}

function fakeIssueDataSource(
  overrides: Partial<GitHubIssueDataSource> = {},
): GitHubIssueDataSource {
  return { listOpenIssues: jest.fn(), ...overrides };
}

const mockRepository: GitHubRepositoryDetailsDto = {
  id: 1,
  name: 'react',
  full_name: 'facebook/react',
  owner: {
    id: 1,
    login: 'facebook',
    avatar_url: 'https://example.com/avatar.png',
    html_url: 'https://github.com/facebook',
    type: 'Organization',
  },
  description: 'A declarative UI library',
  html_url: 'https://github.com/facebook/react',
  language: 'JavaScript',
  stargazers_count: 200000,
  forks_count: 40000,
  open_issues_count: 100,
  topics: ['javascript', 'react'],
  updated_at: '2024-01-01T00:00:00Z',
  created_at: '2013-05-24T00:00:00Z',
  pushed_at: '2024-01-01T00:00:00Z',
  private: false,
  watchers_count: 200000,
  subscribers_count: 7000,
  network_count: 40000,
  size: 150000,
  default_branch: 'main',
  license: { key: 'mit', name: 'MIT License', spdx_id: 'MIT' },
};

const mockIssue: GitHubIssueDto = {
  id: 42,
  number: 42,
  title: 'Bug: something is broken',
  body: 'Description of the bug',
  state: 'open',
  user: mockRepository.owner,
  labels: [{ id: 1, name: 'bug', color: 'ee0701', description: null }],
  comments: 3,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
  closed_at: null,
  html_url: 'https://github.com/facebook/react/issues/42',
};

describe('GitHubRepositoryRepository', () => {
  it('maps a full middle search page and advances pagination', async () => {
    const response: GitHubSearchRepositoriesResponseDto = {
      total_count: 31,
      incomplete_results: false,
      items: Array.from({ length: 30 }, (_, id) => ({ ...mockRepository, id })),
    };
    const dataSource = fakeRepositoryDataSource({
      searchRepositories: jest.fn().mockResolvedValue(response),
    });

    const result = await new GitHubRepositoryRepository(dataSource).search('react', 1);

    expect(dataSource.searchRepositories).toHaveBeenCalledWith('react', 1);
    expect(result).toMatchObject({ total: 31, nextPage: 2 });
    expect(result.items[0]).toMatchObject({
      fullName: 'facebook/react',
      starsCount: 200000,
      owner: { type: 'organization' },
    });
    expect(result.items[0]?.createdAt).toEqual(new Date('2013-05-24T00:00:00Z'));
  });

  it('stops at the last page supported by the GitHub search result window', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchRepositories: jest.fn().mockResolvedValue({
        total_count: 1500,
        incomplete_results: false,
        items: Array.from({ length: 30 }, (_, id) => ({ ...mockRepository, id })),
      }),
    });

    const result = await new GitHubRepositoryRepository(dataSource).search('react', 34);

    expect(result.nextPage).toBeNull();
  });

  it('stops when the search response contains a partial page', async () => {
    const dataSource = fakeRepositoryDataSource({
      searchRepositories: jest.fn().mockResolvedValue({
        total_count: 100,
        incomplete_results: false,
        items: Array.from({ length: 10 }, (_, id) => ({ ...mockRepository, id })),
      }),
    });

    const result = await new GitHubRepositoryRepository(dataSource).search('react', 2);

    expect(result.nextPage).toBeNull();
  });

  it('loads repository details and maps its specific fields', async () => {
    const dataSource = fakeRepositoryDataSource({
      getRepository: jest.fn().mockResolvedValue(mockRepository),
    });

    const result = await new GitHubRepositoryRepository(dataSource).findByOwnerAndName(
      'facebook',
      'react',
    );

    expect(dataSource.getRepository).toHaveBeenCalledWith('facebook', 'react');
    expect(result).toMatchObject({ watchersCount: 200000, defaultBranch: 'main' });
    expect(result.license).toEqual({ key: 'mit', name: 'MIT License', spdxId: 'MIT' });
  });
});

describe('GitHubIssueRepository', () => {
  it('maps issues and pull requests without applying application rules', async () => {
    const dataSource = fakeIssueDataSource({
      listOpenIssues: jest
        .fn()
        .mockResolvedValue([
          mockIssue,
          { ...mockIssue, id: 43, pull_request: { url: 'https://example.com/pr' } },
        ]),
    });

    const result = await new GitHubIssueRepository(dataSource).findOpenByRepository(
      'facebook',
      'react',
    );

    expect(dataSource.listOpenIssues).toHaveBeenCalledWith('facebook', 'react', 1);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      id: 42,
      author: { login: 'facebook' },
      commentsCount: 3,
      isPullRequest: false,
    });
    expect(result.items[1]).toMatchObject({ id: 43, isPullRequest: true });
  });

  it('uses the raw datasource page size to determine the next page', async () => {
    const dataSource = fakeIssueDataSource({
      listOpenIssues: jest
        .fn()
        .mockResolvedValue(Array.from({ length: 30 }, (_, id) => ({ ...mockIssue, id }))),
    });

    const result = await new GitHubIssueRepository(dataSource).findOpenByRepository(
      'facebook',
      'react',
      3,
    );

    expect(result.nextPage).toBe(4);
    expect(dataSource.listOpenIssues).toHaveBeenCalledWith('facebook', 'react', 3);
  });
});
