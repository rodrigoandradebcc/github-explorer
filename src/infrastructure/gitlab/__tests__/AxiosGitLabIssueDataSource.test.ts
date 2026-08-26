import { apiClient } from '../client';
import { AxiosGitLabIssueDataSource } from '../AxiosGitLabIssueDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitLabIssueDataSource', () => {
  it('requests opened issues by URL-encoded full path with page headers', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      headers: { 'x-total': '12', 'x-next-page': '4' },
    });

    const result = await new AxiosGitLabIssueDataSource().listOpenIssues(
      'gitlab-org/gitlab-foss',
      3,
    );

    expect(mockGet).toHaveBeenCalledWith('/projects/gitlab-org%2Fgitlab-foss/issues', {
      params: { state: 'opened', page: 3, per_page: 20 },
    });
    expect(result).toEqual({ items: [], totalHeader: '12', nextPageHeader: '4' });
  });
});
