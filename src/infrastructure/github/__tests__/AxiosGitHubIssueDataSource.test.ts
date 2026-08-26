import { apiClient } from '../client';
import type { GitHubIssueDto } from '../dtos';
import { AxiosGitHubIssueDataSource } from '../AxiosGitHubIssueDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitHubIssueDataSource', () => {
  it('requests open issues with the expected path and params', async () => {
    const response: GitHubIssueDto[] = [];
    mockGet.mockResolvedValueOnce({ data: response });

    const result = await new AxiosGitHubIssueDataSource().listOpenIssues('facebook', 'react', 3);

    expect(mockGet).toHaveBeenCalledWith('/repos/facebook/react/issues', {
      params: { state: 'open', page: 3, per_page: 20 },
    });
    expect(result).toBe(response);
  });
});
