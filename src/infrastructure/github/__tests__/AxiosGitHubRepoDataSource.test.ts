import { apiClient } from '../client';
import type { GitHubRepositoryDetailsDto } from '../dtos';
import { AxiosGitHubRepoDataSource } from '../AxiosGitHubRepoDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitHubRepoDataSource', () => {
  it('requests a repository search with the expected path and params', async () => {
    const response = { total_count: 0, incomplete_results: false, items: [] };
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepoDataSource().searchRepositories('react', 2);

    expect(mockGet).toHaveBeenCalledWith('/search/repositories', {
      params: { q: 'react', page: 2, per_page: 20 },
      signal: undefined,
    });
    expect(result).toBe(response);
  });

  it('requests repository details with the expected path', async () => {
    const response = { id: 1 } as GitHubRepositoryDetailsDto;
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepoDataSource().getRepository('facebook', 'react');

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react', { signal: undefined });
    expect(result).toBe(response);
  });

  it('hands the abort signal to Axios on both calls', async () => {
    const { signal } = new AbortController();
    mockGet.mockResolvedValue({ data: {} });
    const dataSource = new AxiosGitHubRepoDataSource();

    await dataSource.searchRepositories('react', 1, { signal });
    await dataSource.getRepository('facebook', 'react', { signal });

    expect(mockGet).toHaveBeenNthCalledWith(1, '/search/repositories', {
      params: { q: 'react', page: 1, per_page: 20 },
      signal,
    });
    expect(mockGet).toHaveBeenNthCalledWith(2, '/repos/facebook/react', { signal });
  });
});
