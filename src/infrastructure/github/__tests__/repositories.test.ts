import { apiClient } from '../client';
import type {
  GitHubIssueDto,
  GitHubRepositoryDetailsDto,
  GitHubSearchRepositoriesResponseDto,
} from '../dtos';
import { GitHubIssueRepository } from '../GitHubIssueRepository';
import { GitHubRepositoryRepository } from '../GitHubRepositoryRepository';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;
const repositoryRepository = new GitHubRepositoryRepository();
const issueRepository = new GitHubIssueRepository();

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

beforeEach(() => jest.clearAllMocks());

describe('GitHubRepositoryRepository', () => {
  it('searches repositories and maps the response to the domain', async () => {
    const response: GitHubSearchRepositoriesResponseDto = {
      total_count: 31,
      incomplete_results: false,
      items: Array.from({ length: 30 }, (_, id) => ({ ...mockRepository, id })),
    };
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await repositoryRepository.search('react', 1);

    expect(mockGet).toHaveBeenCalledWith('/search/repositories', {
      params: { q: 'react', page: 1, per_page: 30 },
    });
    expect(result).toMatchObject({ total: 31, nextPage: 2 });
    expect(result.items[0]).toMatchObject({
      fullName: 'facebook/react',
      starsCount: 200000,
      owner: { type: 'organization' },
    });
    expect(result.items[0]?.createdAt).toEqual(new Date('2013-05-24T00:00:00Z'));
  });

  it('stops after the last page in the GitHub search result window', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        total_count: 1500,
        incomplete_results: false,
        items: Array.from({ length: 10 }, (_, id) => ({ ...mockRepository, id })),
      },
    });

    const result = await repositoryRepository.search('react', 34);

    expect(result.nextPage).toBeNull();
  });

  it('loads repository details and maps its specific fields', async () => {
    mockGet.mockResolvedValueOnce({ data: mockRepository });

    const result = await repositoryRepository.findByOwnerAndName('facebook', 'react');

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react');
    expect(result).toMatchObject({ watchersCount: 200000, defaultBranch: 'main' });
    expect(result.license).toEqual({ key: 'mit', name: 'MIT License', spdxId: 'MIT' });
  });
});

describe('GitHubIssueRepository', () => {
  it('loads open issues, removes pull requests and maps the response', async () => {
    mockGet.mockResolvedValueOnce({
      data: [mockIssue, { ...mockIssue, id: 43, pull_request: { url: 'https://example.com/pr' } }],
    });

    const result = await issueRepository.findOpenByRepository('facebook', 'react');

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react/issues', {
      params: { state: 'open', page: 1, per_page: 30 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      id: 42,
      author: { login: 'facebook' },
      commentsCount: 3,
    });
  });

  it('uses the unfiltered API page size to determine the next page', async () => {
    mockGet.mockResolvedValueOnce({
      data: Array.from({ length: 30 }, (_, id) => ({ ...mockIssue, id })),
    });

    const result = await issueRepository.findOpenByRepository('facebook', 'react', 3);

    expect(result.nextPage).toBe(4);
    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react/issues', {
      params: { state: 'open', page: 3, per_page: 30 },
    });
  });

  it('skips API pages containing only pull requests', async () => {
    const pullRequests = Array.from({ length: 30 }, (_, id) => ({
      ...mockIssue,
      id,
      pull_request: { url: `https://example.com/pr/${id}` },
    }));
    mockGet
      .mockResolvedValueOnce({ data: pullRequests })
      .mockResolvedValueOnce({ data: [mockIssue] });

    const result = await issueRepository.findOpenByRepository('facebook', 'react', 2);

    expect(mockGet).toHaveBeenNthCalledWith(2, '/repos/facebook/react/issues', {
      params: { state: 'open', page: 3, per_page: 30 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.nextPage).toBeNull();
  });
});
