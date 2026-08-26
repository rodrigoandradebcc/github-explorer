import { apiClient } from '../client';
import type { GitHubRepositoryDetailsDto } from '../dtos';
import { AxiosGitHubRepositoryDataSource } from '../AxiosGitHubRepositoryDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitHubRepositoryDataSource', () => {
  it('requests a repository search with the expected path and params', async () => {
    const response = { total_count: 0, incomplete_results: false, items: [] };
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepositoryDataSource().searchRepositories('react', 2);

    expect(mockGet).toHaveBeenCalledWith('/search/repositories', {
      params: { q: 'react', page: 2, per_page: 30 },
    });
    expect(result).toBe(response);
  });

  it('requests repository details with the expected path', async () => {
    const response = { id: 1 } as GitHubRepositoryDetailsDto;
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubRepositoryDataSource().getRepository('facebook', 'react');

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react');
    expect(result).toBe(response);
  });
});
