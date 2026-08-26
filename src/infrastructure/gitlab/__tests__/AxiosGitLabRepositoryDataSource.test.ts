import { apiClient } from '../client';
import type { GitLabProjectDetailsDto } from '../dtos';
import { AxiosGitLabRepositoryDataSource } from '../AxiosGitLabRepositoryDataSource';

jest.mock('../client', () => ({ apiClient: { get: jest.fn() } }));

const mockGet = apiClient.get as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('AxiosGitLabRepositoryDataSource', () => {
  it('requests a project search with the expected path, params, and page headers', async () => {
    mockGet.mockResolvedValueOnce({
      data: [],
      headers: { 'x-total': '55', 'x-next-page': '3' },
    });

    const result = await new AxiosGitLabRepositoryDataSource().searchProjects('react', 2);

    expect(mockGet).toHaveBeenCalledWith('/projects', {
      params: { search: 'react', order_by: 'star_count', sort: 'desc', page: 2, per_page: 20 },
    });
    expect(result).toEqual({ items: [], totalHeader: '55', nextPageHeader: '3' });
  });

  it('returns null headers when GitLab omits or empties them', async () => {
    mockGet.mockResolvedValueOnce({ data: [], headers: { 'x-next-page': '' } });

    const result = await new AxiosGitLabRepositoryDataSource().searchProjects('react', 9);

    expect(result).toEqual({ items: [], totalHeader: null, nextPageHeader: null });
  });

  it('requests project details by URL-encoded full path', async () => {
    const response = { id: 1 } as GitLabProjectDetailsDto;
    mockGet.mockResolvedValueOnce({ data: response, headers: {} });

    const result = await new AxiosGitLabRepositoryDataSource().getProject('gitlab-org/gitlab-foss');

    expect(mockGet).toHaveBeenCalledWith('/projects/gitlab-org%2Fgitlab-foss');
    expect(result).toBe(response);
  });
});
